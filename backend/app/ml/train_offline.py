import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
import os

def train_and_save_model():
    np.random.seed(42)
    n_samples = 2000

    # Synthetic normal vital signs covariance profile:
    # Features: [hr_mean, hr_std, hr_roc, spo2_mean, spo2_std, spo2_roc, bp_sys_mean, bp_sys_std, bp_dia_mean, cross_corr_hr_spo2]
    hr_mean = np.random.normal(72, 6, n_samples)
    hr_std = np.random.uniform(0.5, 2.5, n_samples)
    hr_roc = np.random.normal(0, 0.5, n_samples)

    spo2_mean = np.random.normal(98, 1.0, n_samples)
    spo2_mean = np.clip(spo2_mean, 95, 100)
    spo2_std = np.random.uniform(0.1, 1.0, n_samples)
    spo2_roc = np.random.normal(0, 0.2, n_samples)

    bp_sys_mean = np.random.normal(120, 8, n_samples)
    bp_sys_std = np.random.uniform(1.0, 4.0, n_samples)
    bp_dia_mean = np.random.normal(80, 5, n_samples)

    cross_corr = np.random.normal(-0.1, 0.15, n_samples) # Normal minor inverse correlation

    X_train = np.column_stack([
        hr_mean, hr_std, hr_roc,
        spo2_mean, spo2_std, spo2_roc,
        bp_sys_mean, bp_sys_std, bp_dia_mean,
        cross_corr
    ])

    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    )
    model.fit(X_train)

    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "isoforest_v1.pkl")
    joblib.dump(model, output_path)
    print(f"[ML Train] Saved IsolationForest artifact version isoforest_v1.pkl to {output_path}")

if __name__ == "__main__":
    train_and_save_model()
