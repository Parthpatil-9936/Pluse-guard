import os
import joblib
import numpy as np
from typing import List, Tuple, Dict, Any

class MLEngine:
    def __init__(self):
        self.model_version = "isoforest_v1.pkl"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, self.model_version)
        
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            print(f"[ML Engine] Loaded {self.model_version}")
        else:
            print(f"[ML Engine] {self.model_version} not found! Training fallback model...")
            from app.ml.train_offline import train_and_save_model
            train_and_save_model()
            self.model = joblib.load(model_path)

        # Baselines for drift check per bed
        self.baselines: Dict[str, np.ndarray] = {}

    def extract_features(self, ticks: List[Dict[str, Any]]) -> Tuple[np.ndarray, Dict[str, float]]:
        if not ticks:
            return np.zeros(10), {}

        hrs = [t["hr"] for t in ticks]
        spo2s = [t["spo2"] for t in ticks]
        bp_syss = [t["bp_sys"] for t in ticks]
        bp_dias = [t["bp_dia"] for t in ticks]

        hr_m, hr_s = np.mean(hrs), np.std(hrs)
        spo2_m, spo2_s = np.mean(spo2s), np.std(spo2s)
        bp_sys_m, bp_sys_s = np.mean(bp_syss), np.std(bp_syss)
        bp_dia_m = np.mean(bp_dias)

        hr_roc = (hrs[-1] - hrs[0]) if len(hrs) > 1 else 0.0
        spo2_roc = (spo2s[-1] - spo2s[0]) if len(spo2s) > 1 else 0.0

        # Cross correlation HR vs SpO2
        if len(hrs) > 2 and hr_s > 0.01 and spo2_s > 0.01:
            corr_matrix = np.corrcoef(hrs, spo2s)
            cross_corr = corr_matrix[0, 1] if not np.isnan(corr_matrix[0, 1]) else 0.0
        else:
            cross_corr = 0.0

        feature_vector = np.array([
            hr_m, hr_s, hr_roc,
            spo2_m, spo2_s, spo2_roc,
            bp_sys_m, bp_sys_s, bp_dia_m,
            cross_corr
        ])

        summary = {
            "hr_mean": float(hr_m),
            "spo2_mean": float(spo2_m),
            "bp_sys_mean": float(bp_sys_m),
            "bp_dia_mean": float(bp_dia_m),
            "cross_corr": float(cross_corr),
            "latest_hr": hrs[-1],
            "latest_spo2": spo2s[-1],
            "latest_ecg_ok": ticks[-1].get("ecg_lead_ok", True)
        }

        return feature_vector, summary

    def check_drift_tamper(self, bed_id: str, feature_vector: np.ndarray, ticks: List[Dict[str, Any]]) -> str:
        latest = ticks[-1]
        
        # Tamper check: physiologically impossible jump or electrode disconnect artifact
        if latest["hr"] > 260 or latest["spo2"] < 20 or latest["bp_sys"] > 260 or not latest.get("ecg_lead_ok", True):
            return "tamper"

        if len(ticks) >= 2:
            step_hr_diff = abs(ticks[-1]["hr"] - ticks[-2]["hr"])
            step_spo2_diff = abs(ticks[-1]["spo2"] - ticks[-2]["spo2"])
            if step_hr_diff > 45 or step_spo2_diff > 30:
                return "tamper"

        # Drift check: cosine similarity vs baseline
        if bed_id not in self.baselines:
            self.baselines[bed_id] = feature_vector
            return "none"

        baseline = self.baselines[bed_id]
        norm_b = np.linalg.norm(baseline)
        norm_f = np.linalg.norm(feature_vector)

        if norm_b > 0 and norm_f > 0:
            cos_sim = np.dot(baseline, feature_vector) / (norm_b * norm_f)
            if cos_sim < 0.82: # Significant drift from initial baseline
                return "drift"

        return "none"

    def score(self, bed_id: str, ticks: List[Dict[str, Any]]) -> Tuple[float, str, str, Dict[str, Any]]:
        feature_vector, summary = self.extract_features(ticks)
        drift_flag = self.check_drift_tamper(bed_id, feature_vector, ticks)

        # Isolation Forest raw anomaly score (-1 for anomaly, 1 for normal)
        # decision_function returns negative values for anomalies
        raw_score = self.model.decision_function([feature_vector])[0]

        # Map decision function to normalized confidence score [0.0, 1.0] where 1.0 = highly anomalous
        # decision_function is positive for normal, negative for anomalies
        anomaly_confidence = float(np.clip(0.40 - (raw_score * 2.0), 0.0, 1.0))

        # Plain language reason generation (NEVER raw model score)
        reasons = []
        hr_m = summary["hr_mean"]
        spo2_m = summary["spo2_mean"]
        corr = summary["cross_corr"]

        if spo2_m < 88:
            reasons.append(f"Severe hypoxia (SpO2 {int(spo2_m)}%)")
        elif spo2_m < 92:
            reasons.append(f"SpO2 desaturation ({int(spo2_m)}%)")

        if hr_m > 130:
            reasons.append(f"Tachycardia (HR {int(hr_m)} bpm)")
        elif hr_m < 45:
            reasons.append(f"Bradycardia (HR {int(hr_m)} bpm)")

        if corr < -0.65:
            reasons.append("HR and SpO2 sharply diverging")

        if drift_flag == "drift":
            reasons.append("Multi-vital baseline drift detected")
        elif drift_flag == "tamper":
            reasons.append("Signal noise / sensor contact artifact")

        if not reasons:
            if anomaly_confidence > 0.6:
                reasons.append("Multi-vital covariance anomaly")
            else:
                reasons.append("Normal vitals pattern")

        plain_reason = " + ".join(reasons)
        return anomaly_confidence, plain_reason, drift_flag, summary

ml_engine = MLEngine()
