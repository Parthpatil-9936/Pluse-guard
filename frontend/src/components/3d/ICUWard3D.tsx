import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BedState } from '../../types';
import { THEME } from '../../theme';
import {
  RotateCcw,
  Eye,
  AlertTriangle,
  Compass,
  Layers,
  MousePointer,
  ZoomIn,
  Move,
} from 'lucide-react';

interface ICUWard3DProps {
  beds: Record<string, BedState>;
  selectedBedId: string;
  onSelectBed: (bedId: string) => void;
}

export const ICUWard3D: React.FC<ICUWard3DProps> = ({
  beds,
  selectedBedId,
  onSelectBed,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cameraView, setCameraView] = useState<'panoramic' | 'topdown' | 'emergency' | 'focus'>('panoramic');
  const [autoRotate, setAutoRotate] = useState(false);
  const [hoveredBedId, setHoveredBedId] = useState<string | null>(null);

  // References across render cycles
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const bedMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const lightsRef = useRef<Map<string, THREE.PointLight>>(new Map());
  const beaconsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const monitorScreensRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Smooth animation interpolation targets
  const isTransitioningRef = useRef(false);
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 18, 22));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Count active emergencies
  const emergencyBeds = Object.values(beds).filter((b) => b.tier === 1 && b.signal_status === 'online');
  const anomalyBeds = Object.values(beds).filter((b) => b.tier === 2 && b.signal_status === 'online');

  // Compute Bed 3D positions in a 2x5 Ward Grid
  const getBedPosition = (bedIndex: number): [number, number, number] => {
    const isTopRow = bedIndex < 5;
    const colIndex = bedIndex % 5;
    const x = (colIndex - 2) * 7.0;
    const z = isTopRow ? -5.5 : 5.5;
    return [x, 0, z];
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(THEME.three.sceneBg);
    scene.fog = new THREE.FogExp2(THEME.three.fogColor, 0.010);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 300);
    camera.position.set(0, 18, 22);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls: Free Cursor Movement & Navigation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.screenSpacePanning = true;
    controls.minDistance = 2.0; // Allow moving right up to patient mattress
    controls.maxDistance = 65.0; // Allow zooming out to entire hospital ward
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Don't flip under floor
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // User interacting cancels programmatic camera transition
    controls.addEventListener('start', () => {
      isTransitioningRef.current = false;
    });

    // 5. Medium Clinical Lighting System
    const ambientLight = new THREE.AmbientLight(THEME.three.ambientLight, 1.4);
    scene.add(ambientLight);

    const ceilingMainLight = new THREE.DirectionalLight(THEME.three.directionalLight, 1.1);
    ceilingMainLight.position.set(0, 25, 10);
    ceilingMainLight.castShadow = true;
    ceilingMainLight.shadow.mapSize.width = 2048;
    ceilingMainLight.shadow.mapSize.height = 2048;
    ceilingMainLight.shadow.bias = -0.0008;
    scene.add(ceilingMainLight);

    const blueFillLight = new THREE.DirectionalLight(THEME.three.fillLight, 0.5);
    blueFillLight.position.set(-15, 15, -15);
    scene.add(blueFillLight);

    // 6. Medical Floor Architecture & Grids
    const floorGeo = new THREE.PlaneGeometry(70, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      color: THEME.three.floorColor,
      roughness: 0.4,
      metalness: 0.05,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Floor Grid Lines
    const gridHelper = new THREE.GridHelper(70, 35, THEME.three.floorGridCenter, THEME.three.floorGridLines);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Ward Center Pathway Guide Strip
    const aisleGeo = new THREE.PlaneGeometry(60, 2.8);
    const aisleMat = new THREE.MeshBasicMaterial({
      color: THEME.three.aislePathway,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    const aisle = new THREE.Mesh(aisleGeo, aisleMat);
    aisle.rotation.x = -Math.PI / 2;
    aisle.position.y = 0.02;
    scene.add(aisle);

    // 7. Medical Telemetry Particle Dust
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 60;
      particlePositions[i + 1] = Math.random() * 12 + 0.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 40;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: THEME.three.particles,
      size: 0.08,
      transparent: true,
      opacity: 0.35,
    });
    const wardParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(wardParticles);

    // 8. Procedural 3D ICU Bed Pod Generator
    const createBedPod = (bedId: string, index: number): THREE.Group => {
      const bedGroup = new THREE.Group();
      const [posX, posY, posZ] = getBedPosition(index);
      bedGroup.position.set(posX, posY, posZ);
      bedGroup.name = bedId;

      // Face the beds towards the central aisle
      if (index < 5) {
        bedGroup.rotation.y = 0;
      } else {
        bedGroup.rotation.y = Math.PI;
      }

      // --- A. Base Pod Floor Zone Indicator ---
      const zoneGeo = new THREE.PlaneGeometry(5.4, 4.4);
      const zoneMat = new THREE.MeshStandardMaterial({
        color: THEME.three.bedZoneFloor,
        roughness: 0.5,
        metalness: 0.1,
      });
      const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
      zoneMesh.rotation.x = -Math.PI / 2;
      zoneMesh.position.y = 0.02;
      zoneMesh.receiveShadow = true;
      bedGroup.add(zoneMesh);

      // Bed Zone Border
      const borderGeo = new THREE.EdgesGeometry(zoneGeo);
      const borderMat = new THREE.LineBasicMaterial({ color: THEME.three.bedZoneBorder, linewidth: 2 });
      const borderMesh = new THREE.LineSegments(borderGeo, borderMat);
      borderMesh.rotation.x = -Math.PI / 2;
      borderMesh.position.y = 0.03;
      bedGroup.add(borderMesh);

      // --- B. Hospital Bed Frame & Patient Mattress ---
      const frameGeo = new THREE.BoxGeometry(2.4, 0.4, 4.0);
      const frameMat = new THREE.MeshStandardMaterial({
        color: THEME.three.bedFrame,
        metalness: 0.6,
        roughness: 0.3,
      });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.y = 0.5;
      frame.castShadow = true;
      frame.receiveShadow = true;
      bedGroup.add(frame);

      // Chrome Frame Rails
      const railGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.8);
      const railMat = new THREE.MeshStandardMaterial({ color: THEME.three.bedRails, metalness: 0.85, roughness: 0.15 });

      const leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.rotation.x = Math.PI / 2;
      leftRail.position.set(-1.25, 0.9, 0);
      bedGroup.add(leftRail);

      const rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.rotation.x = Math.PI / 2;
      rightRail.position.set(1.25, 0.9, 0);
      bedGroup.add(rightRail);

      // Mattress (Deep Slate Leatherette)
      const mattressGeo = new THREE.BoxGeometry(2.3, 0.45, 3.9);
      const mattressMat = new THREE.MeshStandardMaterial({
        color: THEME.three.mattress,
        roughness: 0.6,
        metalness: 0.1,
      });
      const mattress = new THREE.Mesh(mattressGeo, mattressMat);
      mattress.position.y = 0.92;
      mattress.castShadow = true;
      mattress.receiveShadow = true;
      bedGroup.add(mattress);

      // Incline Headrest / White Hospital Pillow
      const pillowGeo = new THREE.BoxGeometry(1.9, 0.2, 0.9);
      const pillowMat = new THREE.MeshStandardMaterial({ color: THEME.three.pillow, roughness: 0.9 });
      const pillow = new THREE.Mesh(pillowGeo, pillowMat);
      pillow.position.set(0, 1.25, -1.3);
      pillow.rotation.x = 0.2;
      bedGroup.add(pillow);

      // Headboard & Footboard
      const headboardGeo = new THREE.BoxGeometry(2.4, 1.4, 0.15);
      const boardMat = new THREE.MeshStandardMaterial({ color: THEME.three.board, metalness: 0.4, roughness: 0.5 });
      const headboard = new THREE.Mesh(headboardGeo, boardMat);
      headboard.position.set(0, 1.1, -2.0);
      headboard.castShadow = true;
      bedGroup.add(headboard);

      const footboardGeo = new THREE.BoxGeometry(2.4, 0.8, 0.15);
      const footboard = new THREE.Mesh(footboardGeo, boardMat);
      footboard.position.set(0, 0.8, 2.0);
      footboard.castShadow = true;
      bedGroup.add(footboard);

      // --- C. Bedside Vital Signs Monitor Station ---
      const standGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8);
      const standMat = new THREE.MeshStandardMaterial({ color: THEME.three.monitorStand, metalness: 0.7, roughness: 0.25 });
      const stand = new THREE.Mesh(standGeo, standMat);
      stand.position.set(-1.8, 1.4, -1.2);
      stand.castShadow = true;
      bedGroup.add(stand);

      const monitorGeo = new THREE.BoxGeometry(0.9, 0.65, 0.15);
      const monitorMat = new THREE.MeshStandardMaterial({ color: THEME.three.monitorCase, roughness: 0.4 });
      const monitor = new THREE.Mesh(monitorGeo, monitorMat);
      monitor.position.set(-1.8, 2.4, -1.2);
      monitor.rotation.y = Math.PI / 5;
      monitor.castShadow = true;
      bedGroup.add(monitor);

      // Emissive Vital Screen
      const screenGeo = new THREE.PlaneGeometry(0.8, 0.55);
      const screenMat = new THREE.MeshStandardMaterial({
        color: THEME.three.tier3,
        emissive: THEME.three.tier3,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(-1.75, 2.4, -1.12);
      screen.rotation.y = Math.PI / 5;
      bedGroup.add(screen);
      monitorScreensRef.current.set(bedId, screen);

      // --- D. Emergency Beacon Strobe (Top of Monitor Pole) ---
      const beaconGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.22, 16);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: THEME.three.tier3,
        emissive: THEME.three.tier3,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(-1.8, 2.9, -1.2);
      bedGroup.add(beacon);
      beaconsRef.current.set(bedId, beacon);

      // --- E. IV Drip Pole & Fluid Bag ---
      const ivPoleGeo = new THREE.CylinderGeometry(0.03, 0.03, 3.2);
      const ivPole = new THREE.Mesh(ivPoleGeo, standMat);
      ivPole.position.set(1.8, 1.6, -1.2);
      bedGroup.add(ivPole);

      const bagGeo = new THREE.BoxGeometry(0.25, 0.4, 0.1);
      const bagMat = new THREE.MeshStandardMaterial({
        color: THEME.three.ivBag,
        transparent: true,
        opacity: 0.75,
        roughness: 0.1,
      });
      const bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(1.8, 2.9, -1.2);
      bedGroup.add(bag);

      // --- F. Dynamic Real-Time PointLight for Emergency Alerts ---
      const bedPointLight = new THREE.PointLight(THEME.three.tier3, 0.9, 7.0);
      bedPointLight.position.set(0, 2.5, 0);
      bedGroup.add(bedPointLight);
      lightsRef.current.set(bedId, bedPointLight);

      bedMeshesRef.current.set(bedId, bedGroup);
      return bedGroup;
    };

    // Create 10 Bed Pods
    for (let i = 1; i <= 10; i++) {
      const id = `bed-${String(i).padStart(2, '0')}`;
      const pod = createBedPod(id, i - 1);
      scene.add(pod);
    }

    // 9. Mouse Raycasting for Interactive Selection & Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let downPos = { x: 0, y: 0 };

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!isDragging) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        let foundBedId: string | null = null;
        for (const hit of intersects) {
          let parent: THREE.Object3D | null = hit.object;
          while (parent && parent !== scene) {
            if (parent.name && parent.name.startsWith('bed-')) {
              foundBedId = parent.name;
              break;
            }
            parent = parent.parent;
          }
          if (foundBedId) break;
        }
        setHoveredBedId(foundBedId);
        container.style.cursor = foundBedId ? 'pointer' : 'grab';
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      isDragging = false;
      downPos = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };

    const onPointerUp = (e: MouseEvent) => {
      container.style.cursor = 'grab';
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);

      // Only treat as click selection if user didn't drag/orbit camera
      if (dist < 6) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (const hit of intersects) {
          let parent: THREE.Object3D | null = hit.object;
          while (parent && parent !== scene) {
            if (parent.name && parent.name.startsWith('bed-')) {
              onSelectBed(parent.name);
              return;
            }
            parent = parent.parent;
          }
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('mouseup', onPointerUp);

    // 10. Main Render Loop with Controls Update
    let clock = new THREE.Clock();
    let animId: number;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const elapsed = clock.getElapsedTime();

      // Programmatic Camera Fly-In Transition
      if (isTransitioningRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.06);
        controls.target.lerp(targetLookAtRef.current, 0.06);

        if (
          camera.position.distanceTo(targetCamPosRef.current) < 0.1 &&
          controls.target.distanceTo(targetLookAtRef.current) < 0.1
        ) {
          isTransitioningRef.current = false;
        }
      }

      // Auto Orbit if enabled
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 1.0;
      controls.update();

      // Animate floating dust particles
      wardParticles.rotation.y = elapsed * 0.02;

      // Animate Emergency Beacons and Point Lights
      beaconsRef.current.forEach((beaconMesh, bedId) => {
        const bedState = beds[bedId];
        const pointLight = lightsRef.current.get(bedId);
        const screenMesh = monitorScreensRef.current.get(bedId);
        if (!bedState) return;

        let targetColor: number = THEME.three.tier3;
        let intensity = 0.8;

        if (bedState.signal_status === 'no_signal') {
          targetColor = THEME.three.offline;
          intensity = 0.2;
        } else if (bedState.tier === 1) {
          targetColor = THEME.three.tier1;
          const flash = (Math.sin(elapsed * 12) + 1) / 2;
          intensity = 1.6 + flash * 2.0;
          beaconMesh.rotation.y += 0.2;
          beaconMesh.scale.set(1 + flash * 0.25, 1 + flash * 0.25, 1 + flash * 0.25);
        } else if (bedState.tier === 2) {
          targetColor = THEME.three.tier2;
          const pulse = (Math.sin(elapsed * 4) + 1) / 2;
          intensity = 1.2 + pulse * 1.0;
          beaconMesh.rotation.y += 0.05;
        } else {
          const breath = (Math.sin(elapsed * 1.5) + 1) / 2;
          intensity = 0.6 + breath * 0.3;
        }

        const colorObj = new THREE.Color(targetColor);

        const beaconMat = beaconMesh.material as THREE.MeshStandardMaterial;
        beaconMat.color.copy(colorObj);
        beaconMat.emissive.copy(colorObj);
        beaconMat.emissiveIntensity = intensity * 0.6;

        if (pointLight) {
          pointLight.color.copy(colorObj);
          pointLight.intensity = intensity;
        }

        if (screenMesh) {
          const sMat = screenMesh.material as THREE.MeshStandardMaterial;
          sMat.color.copy(colorObj);
          sMat.emissive.copy(colorObj);
          sMat.emissiveIntensity = intensity * 0.5;
        }
      });

      renderer.render(scene, camera);
    };

    renderLoop();

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
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mousedown', onPointerDown);
      container.removeEventListener('mouseup', onPointerUp);
      cancelAnimationFrame(animId);
      controls.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Programmatic Camera Fly-In Targets
  useEffect(() => {
    isTransitioningRef.current = true;
    if (cameraView === 'panoramic') {
      targetCamPosRef.current.set(0, 18, 22);
      targetLookAtRef.current.set(0, 0, 0);
    } else if (cameraView === 'topdown') {
      targetCamPosRef.current.set(0, 34, 0.1);
      targetLookAtRef.current.set(0, 0, 0);
    } else if (cameraView === 'emergency') {
      const firstCrit = emergencyBeds[0] || anomalyBeds[0] || beds['bed-04'] || beds['bed-01'];
      const bedIndex = parseInt(firstCrit.bed_id.replace('bed-', '')) - 1;
      const [bx, by, bz] = getBedPosition(bedIndex);
      targetCamPosRef.current.set(bx, by + 5.0, bz + 7.5);
      targetLookAtRef.current.set(bx, by + 1.2, bz);
    } else if (cameraView === 'focus') {
      const bedIndex = parseInt(selectedBedId.replace('bed-', '')) - 1;
      const [bx, by, bz] = getBedPosition(bedIndex);
      targetCamPosRef.current.set(bx, by + 4.5, bz + 6.5);
      targetLookAtRef.current.set(bx, by + 1.0, bz);
    }
  }, [cameraView, selectedBedId]);

  return (
    <div className="relative w-full h-[500px] lg:h-[560px] rounded-3xl overflow-hidden bg-slate-100 border border-slate-300 shadow-md select-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: 3D Ward Header & Emergency Ticker */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col space-y-1.5 z-10">
        <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-300 shadow-sm pointer-events-auto">
          <Layers className="w-4 h-4 text-teal-600 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            3D ICU Ward Room (Alpha Bay)
          </span>
          <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            WebGL 60 FPS
          </span>
        </div>

        {emergencyBeds.length > 0 && (
          <div className="flex items-center space-x-2 bg-red-50/95 backdrop-blur-md px-3.5 py-1 rounded-2xl border border-red-300 shadow-md pointer-events-auto animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span className="text-[11px] font-mono font-bold text-red-700">
              {emergencyBeds.length} TIER-1 EMERGENCY:{' '}
              {emergencyBeds.map((b) => b.bed_id.toUpperCase()).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Top Right: Free Navigation Guidance HUD & View Presets */}
      <div className="absolute top-4 right-4 flex flex-col items-end space-y-2 z-10 pointer-events-none">
        {/* View Preset Buttons */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={() => setCameraView('panoramic')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold backdrop-blur-md border transition-all flex items-center space-x-1.5 shadow-sm ${
              cameraView === 'panoramic'
                ? 'bg-teal-600 text-white border-teal-600 shadow ring-1 ring-teal-500'
                : 'bg-white/90 text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Panoramic</span>
          </button>

          <button
            onClick={() => setCameraView('topdown')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold backdrop-blur-md border transition-all flex items-center space-x-1.5 shadow-sm ${
              cameraView === 'topdown'
                ? 'bg-teal-600 text-white border-teal-600 shadow ring-1 ring-teal-500'
                : 'bg-white/90 text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Top-Down</span>
          </button>

          <button
            onClick={() => setCameraView('emergency')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold backdrop-blur-md border transition-all flex items-center space-x-1.5 shadow-sm ${
              cameraView === 'emergency'
                ? 'bg-red-600 text-white border-red-600 ring-1 ring-red-500 shadow'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Emergency Fly-To</span>
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all shadow-sm pointer-events-auto ${
              autoRotate
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white/90 text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle Auto-Orbit"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Free-Moving Cursor Controls HUD */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-700 flex items-center space-x-3 shadow-sm pointer-events-auto">
          <span className="flex items-center space-x-1 text-teal-700">
            <MousePointer className="w-3 h-3 text-teal-600" />
            <span>Left Drag: Orbit 360°</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center space-x-1 text-slate-600">
            <ZoomIn className="w-3 h-3 text-teal-600" />
            <span>Scroll: Zoom In/Out</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center space-x-1 text-slate-600">
            <Move className="w-3 h-3 text-teal-600" />
            <span>Right Drag: Pan</span>
          </span>
        </div>
      </div>

      {/* Bottom Bar: Interactive Bed Navigator Pill Strip */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center space-x-1.5 overflow-x-auto p-1.5 bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-300 pointer-events-auto shadow-md">
          {Array.from({ length: 10 }, (_, i) => {
            const bId = `bed-${String(i + 1).padStart(2, '0')}`;
            const bState = beds[bId];
            const isSelected = selectedBedId === bId;
            const isCrit = bState?.tier === 1;
            const isAnom = bState?.tier === 2;

            return (
              <button
                key={bId}
                onClick={() => {
                  onSelectBed(bId);
                  setCameraView('focus');
                }}
                className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all flex items-center space-x-1.5 border shadow-sm ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow ring-1 ring-teal-500'
                    : isCrit
                    ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                    : isAnom
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCrit ? 'bg-red-600 animate-ping' : isAnom ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <span>{bId.toUpperCase()}</span>
                {bState?.tick && (
                  <span className={`text-[9px] ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                    {bState.tick.hr} bpm
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {hoveredBedId && (
          <div className="bg-white/95 backdrop-blur-md border border-teal-400 px-3 py-1.5 rounded-xl text-xs font-mono text-teal-800 shadow-md pointer-events-auto animate-fadeIn">
            Click to fly into <strong className="text-teal-900 font-extrabold">{hoveredBedId.toUpperCase()}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

