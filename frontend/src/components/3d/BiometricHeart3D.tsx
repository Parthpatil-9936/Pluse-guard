import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TierType } from '../../types';
import { THEME } from '../../theme';

interface BiometricHeart3DProps {
  hr: number;
  spo2: number;
  tier: TierType;
  isSignalLost?: boolean;
}

export const BiometricHeart3D: React.FC<BiometricHeart3DProps> = ({
  hr,
  spo2,
  tier,
  isSignalLost = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 260;
    const height = container.clientHeight || 190;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Color based on tier and signal from centralized theme
    let baseColor = new THREE.Color(THEME.three.tealAccent);
    if (isSignalLost) {
      baseColor = new THREE.Color(THEME.three.offline);
    } else if (tier === 1) {
      baseColor = new THREE.Color(THEME.three.tier1);
    } else if (tier === 2) {
      baseColor = new THREE.Color(THEME.three.tier2);
    } else {
      baseColor = new THREE.Color(THEME.three.tier3);
    }

    // Group for entire heart system
    const heartGroup = new THREE.Group();
    scene.add(heartGroup);

    // 1. Core Pulsar Icosahedron
    const coreGeometry = new THREE.IcosahedronGeometry(1.0, 2);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      wireframe: true,
      emissive: baseColor,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.7,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    heartGroup.add(coreMesh);

    // 2. Inner Glowing Solid Core
    const innerGeometry = new THREE.SphereGeometry(0.65, 24, 24);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.65,
      roughness: 0.3,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    heartGroup.add(innerMesh);

    // 3. Orbiting Holographic Rings
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.02, 16, 64), ringMaterial);
    ring1.rotation.x = Math.PI / 3;
    heartGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.02, 16, 64), ringMaterial);
    ring2.rotation.y = Math.PI / 4;
    heartGroup.add(ring2);

    // 4. Particle Cloud
    const particleCount = 60;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 1.3 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: baseColor,
      size: 0.04,
      transparent: true,
      opacity: 0.5,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    heartGroup.add(particleSystem);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(baseColor, 1.4, 10);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    // Free Cursor Drag & Parallax Movement
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.015;
        targetRotationX += deltaY * 0.015;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };

    const onMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Dynamic Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous rotation combined with cursor interaction
      if (!isDragging) {
        targetRotationY += 0.008;
      }

      heartGroup.rotation.y += (targetRotationY + mouseX * 0.5 - heartGroup.rotation.y) * 0.08;
      heartGroup.rotation.x += (targetRotationX - mouseY * 0.5 - heartGroup.rotation.x) * 0.08;

      ring1.rotation.z = elapsedTime * 0.6;
      ring2.rotation.x = elapsedTime * -0.5;

      // Pulse calculation based on HR (BPM -> frequency)
      const beatsPerSec = isSignalLost || hr <= 0 ? 0.5 : hr / 60;
      const pulseFrequency = beatsPerSec * Math.PI * 2;

      const rawPulse = Math.sin(elapsedTime * pulseFrequency);
      const beatScale = 1 + Math.max(0, Math.pow(rawPulse, 5)) * 0.25;

      coreMesh.scale.set(beatScale, beatScale, beatScale);
      innerMesh.scale.set(beatScale * 0.9, beatScale * 0.9, beatScale * 0.9);

      if (tier === 1 && !isSignalLost) {
        heartGroup.position.x = (Math.random() - 0.5) * 0.03;
        heartGroup.position.y = (Math.random() - 0.5) * 0.03;
      } else {
        heartGroup.position.set(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeometry.dispose();
      innerGeometry.dispose();
      particleGeometry.dispose();
    };
  }, [hr, spo2, tier, isSignalLost]);

  return (
    <div className="relative w-full h-44 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200 shadow-sm group">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Overlay Readout */}
      <div className="absolute top-2.5 left-3 pointer-events-none">
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-semibold block">
          3D Biometric Hologram
        </span>
        <span className="text-xs font-mono font-bold text-slate-800">
          {isSignalLost ? 'TELEMETRY DISCONNECTED' : `${hr} BPM PULSE`}
        </span>
      </div>

      <div className="absolute top-2.5 right-3 pointer-events-none text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
        🖱️ Drag to rotate
      </div>

      <div className="absolute bottom-2 right-3 pointer-events-none flex items-center space-x-1.5 bg-white/95 px-2 py-0.5 rounded-md border border-slate-200 text-[9px] font-mono text-teal-700 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping" />
        <span className="font-semibold">SpO2: {spo2}%</span>
      </div>
    </div>
  );
};

