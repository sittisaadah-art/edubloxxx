import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Building, Player, AvatarPreset } from '../types';
import { AVATAR_PRESETS } from '../data/initialData';
import { soundManager } from '../utils/audio';

interface World3DProps {
  buildings: Building[];
  players: Player[];
  activePlayerIdx: number;
  moveMode: 'manual' | 'auto';
  dpadState: { up: boolean; down: boolean; left: boolean; right: boolean };
  onNearbyBuildingChange: (bldg: Building | { isCanteen: true } | null) => void;
  onEnterBuilding: (code: string) => void;
  onProjectedCoordsChange?: (coords: {
    players: { id: string; name: string; x: number; y: number; visible: boolean }[];
    buildings: { code: string; name: string; icon: string; color: string; x: number; y: number; visible: boolean }[];
    monument: { x: number; y: number; visible: boolean };
  }) => void;
  cameraControlAction?: { type: 'rotate' | 'zoom' | 'focus' | 'teleportPlaza' | 'teleportBuilding'; value?: any; id: number } | null;
}

export const World3D: React.FC<World3DProps> = ({
  buildings,
  players,
  activePlayerIdx,
  moveMode,
  dpadState,
  onNearbyBuildingChange,
  onEnterBuilding,
  onProjectedCoordsChange,
  cameraControlAction,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Mutable refs to prevent re-instantiating WebGL
  const stateRef = useRef({
    players,
    activePlayerIdx,
    moveMode,
    dpadState,
    buildings,
  });

  stateRef.current = {
    players,
    activePlayerIdx,
    moveMode,
    dpadState,
    buildings,
  };

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const crystalMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsGroupRef = useRef<THREE.Group | null>(null);
  const buildingsGroupRef = useRef<THREE.Group | null>(null);
  const avatarsGroupRef = useRef<THREE.Group | null>(null);

  // Camera angles & zoom
  const camYawRef = useRef(0);
  const camPitchRef = useRef(0.48);
  const camDistRef = useRef(26);
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const autoWanderTimerRef = useRef(0);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Handle external camera controls from HUD buttons
  useEffect(() => {
    if (!cameraControlAction) return;
    const { type, value } = cameraControlAction;

    if (type === 'rotate') {
      camYawRef.current += Number(value || 0.35);
    } else if (type === 'zoom') {
      camDistRef.current = Math.max(10, Math.min(55, camDistRef.current + Number(value || 3)));
    } else if (type === 'focus') {
      camYawRef.current = 0;
      camPitchRef.current = 0.48;
      camDistRef.current = 24;
    } else if (type === 'teleportPlaza') {
      const p = stateRef.current.players[stateRef.current.activePlayerIdx];
      if (p) {
        p.x = 0;
        p.z = 7;
        p.y = 0;
        soundManager.playSFX('jump');
      }
    } else if (type === 'teleportBuilding') {
      const b = stateRef.current.buildings.find((x) => x.code === value);
      const p = stateRef.current.players[stateRef.current.activePlayerIdx];
      if (b && p) {
        p.x = b.x;
        p.z = b.z + 6.5;
        p.y = 0;
        soundManager.playSFX('jump');
      }
    }
  }, [cameraControlAction]);

  // Rebuild 3D buildings when data changes
  useEffect(() => {
    if (!sceneRef.current || !buildingsGroupRef.current) return;
    const group = buildingsGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    buildings.forEach((b) => {
      const bldgGroup = new THREE.Group();
      const col = new THREE.Color(b.color || '#3b82f6');

      // Main Voxel Body
      const mainBody = new THREE.Mesh(
        new THREE.BoxGeometry(8, 7.5, 8),
        new THREE.MeshLambertMaterial({ color: col })
      );
      mainBody.position.y = 3.75;
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;

      // Roof
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(8.8, 1.2, 8.8),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      roof.position.y = 8.1;
      roof.castShadow = true;

      // Glowing Door
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 3.2, 0.4),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      door.position.set(0, 1.6, 4.05);

      // Windows
      const winMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.3), winMat);
      w1.position.set(-2.3, 5, 4.05);
      const w2 = w1.clone();
      w2.position.set(2.3, 5, 4.05);

      // Welcome Mat / Portal
      const portal = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.15, 2.5),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      portal.position.set(0, 0.08, 5.4);

      bldgGroup.add(mainBody, roof, door, w1, w2, portal);
      bldgGroup.position.set(b.x, 0, b.z);
      group.add(bldgGroup);
    });
  }, [buildings]);

  // Rebuild 3D player avatars
  useEffect(() => {
    if (!sceneRef.current || !avatarsGroupRef.current) return;
    const group = avatarsGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    players.forEach((p) => {
      const preset = AVATAR_PRESETS.find((a) => a.id === p.avatarId) || AVATAR_PRESETS[0];
      const charGroup = createBlockyCharacterMesh(preset);
      charGroup.position.set(p.x, p.y, p.z);
      group.add(charGroup);
    });
  }, [players]);

  function createBlockyCharacterMesh(preset: AvatarPreset) {
    const charGroup = new THREE.Group();

    const legMat = new THREE.MeshLambertMaterial({ color: preset.legs });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.55), legMat);
    leftLeg.position.set(-0.32, 0.55, 0);
    leftLeg.castShadow = true;
    const rightLeg = leftLeg.clone();
    rightLeg.position.set(0.32, 0.55, 0);

    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.35, 0.7),
      new THREE.MeshLambertMaterial({ color: preset.torso })
    );
    torso.position.y = 1.78;
    torso.castShadow = true;

    const armMat = new THREE.MeshLambertMaterial({ color: preset.head });
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.25, 0.45), armMat);
    leftArm.position.set(-0.92, 1.78, 0);
    leftArm.castShadow = true;
    const rightArm = leftArm.clone();
    rightArm.position.set(0.92, 1.78, 0);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.MeshLambertMaterial({ color: preset.head })
    );
    head.position.y = 3.05;
    head.castShadow = true;

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.1), eyeMat);
    eyeL.position.set(-0.24, 3.12, 0.56);
    const eyeR = eyeL.clone();
    eyeR.position.set(0.24, 3.12, 0.56);

    charGroup.add(leftLeg, rightLeg, torso, leftArm, rightArm, head, eyeL, eyeR);

    // Hat / accessory
    if (preset.hat !== 'none') {
      const hatMat = new THREE.MeshLambertMaterial({ color: preset.hatColor });
      if (preset.hat === 'wizard') {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.2, 4), hatMat);
        cone.position.y = 4.1;
        charGroup.add(cone);
      } else if (preset.hat === 'ears') {
        const ear1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.25), hatMat);
        ear1.position.set(-0.35, 3.8, 0);
        const ear2 = ear1.clone();
        ear2.position.set(0.35, 3.8, 0);
        charGroup.add(ear1, ear2);
      } else {
        const crown = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), hatMat);
        crown.position.y = 3.75;
        charGroup.add(crown);
      }
    }

    return charGroup;
  }

  // Jump handler
  const triggerJump = (idx: number) => {
    const p = stateRef.current.players[idx];
    if (p && p.y <= 0.01) {
      p.vy = 0.32 * (p.jumpBoost || 1);
      if (idx === stateRef.current.activePlayerIdx) {
        soundManager.playSFX('jump');
      }
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Software WebGL detection
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7dd3fc);
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0085);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Warm Sun and Hemisphere Fill Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.65);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.85);
    dirLight.position.set(45, 70, 35);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 160;
    const d = 55;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Voxel Sun in Sky
    const sunMesh = new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    sunMesh.position.set(55, 65, -55);
    scene.add(sunMesh);

    // Island & Plaza
    const grassGeo = new THREE.BoxGeometry(100, 3, 100);
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = -1.5;
    grass.receiveShadow = true;
    scene.add(grass);

    const dirtGeo = new THREE.BoxGeometry(96, 6, 96);
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const dirt = new THREE.Mesh(dirtGeo, dirtMat);
    dirt.position.y = -6;
    scene.add(dirt);

    // Plaza
    const plazaGeo = new THREE.BoxGeometry(22, 0.25, 22);
    const plazaMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = 0.05;
    plaza.receiveShadow = true;
    scene.add(plaza);

    // Roads
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const roadH = new THREE.Mesh(new THREE.BoxGeometry(72, 0.15, 5), roadMat);
    roadH.position.set(0, 0.03, 4);
    roadH.receiveShadow = true;
    scene.add(roadH);

    const roadV = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 72), roadMat);
    roadV.position.set(0, 0.03, 4);
    roadV.receiveShadow = true;
    scene.add(roadV);

    const roadNorth = new THREE.Mesh(new THREE.BoxGeometry(56, 0.15, 4.5), roadMat);
    roadNorth.position.set(0, 0.03, -22);
    roadNorth.receiveShadow = true;
    scene.add(roadNorth);

    const roadSouth = new THREE.Mesh(new THREE.BoxGeometry(56, 0.15, 4.5), roadMat);
    roadSouth.position.set(0, 0.03, 26);
    roadSouth.receiveShadow = true;
    scene.add(roadSouth);

    // Monument & Rotating Crystal
    const pedBase = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 1.2, 5.5),
      new THREE.MeshLambertMaterial({ color: 0x334155 })
    );
    pedBase.position.set(0, 0.6, 0);
    pedBase.castShadow = true;
    scene.add(pedBase);

    const pedTop = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 1.2, 3.8),
      new THREE.MeshLambertMaterial({ color: 0xf59e0b })
    );
    pedTop.position.set(0, 1.8, 0);
    pedTop.castShadow = true;
    scene.add(pedTop);

    const crystalGeo = new THREE.OctahedronGeometry(2.1, 0);
    const crystalMat = new THREE.MeshPhongMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      shininess: 90,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.set(0, 5.2, 0);
    crystalMesh.castShadow = true;
    scene.add(crystalMesh);
    crystalMeshRef.current = crystalMesh;

    // Clouds
    const cloudsGroup = new THREE.Group();
    scene.add(cloudsGroup);
    cloudsGroupRef.current = cloudsGroup;
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const cloudPositions = [
      [-30, 34, -25],
      [15, 38, -35],
      [40, 32, 10],
      [-38, 36, 22],
      [0, 40, 38],
    ];
    cloudPositions.forEach(([x, y, z]) => {
      const c = new THREE.Group();
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(9, 2.5, 5), cloudMat);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 4), cloudMat);
      b2.position.set(1.5, 1.5, 0);
      c.add(b1, b2);
      c.position.set(x, y, z);
      cloudsGroup.add(c);
    });

    // Trees & Props
    const treeCoords = [
      [-14, -14],
      [14, -14],
      [-38, -32],
      [38, -32],
      [-40, 16],
      [40, 16],
      [-38, 36],
      [38, 36],
      [-14, 38],
      [14, 38],
    ];
    treeCoords.forEach(([x, z]) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4, 1.4), new THREE.MeshLambertMaterial({ color: 0x78350f }));
      trunk.position.y = 2;
      trunk.castShadow = true;
      const leaves1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3, 4.5), new THREE.MeshLambertMaterial({ color: 0x16a34a }));
      leaves1.position.y = 5;
      leaves1.castShadow = true;
      const leaves2 = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 3), new THREE.MeshLambertMaterial({ color: 0x22c55e }));
      leaves2.position.y = 7.2;
      leaves2.castShadow = true;
      tree.add(trunk, leaves1, leaves2);
      tree.position.set(x, 0, z);
      scene.add(tree);
    });

    // Fountain on East
    const fountain = new THREE.Group();
    const basin = new THREE.Mesh(new THREE.BoxGeometry(5, 0.9, 5), new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
    basin.position.y = 0.45;
    const water = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.8, 4.2), new THREE.MeshLambertMaterial({ color: 0x38bdf8 }));
    water.position.y = 0.55;
    const spout = new THREE.Mesh(new THREE.BoxGeometry(1, 2.4, 1), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
    spout.position.y = 1.4;
    fountain.add(basin, water, spout);
    fountain.position.set(13, 0, 0);
    scene.add(fountain);

    // Canteen on West
    const canteen = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(7, 4.5, 5.5), new THREE.MeshLambertMaterial({ color: 0xf97316 }));
    body.position.y = 2.25;
    body.castShadow = true;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(7.8, 1, 6.3), new THREE.MeshLambertMaterial({ color: 0xfef08a }));
    roof.position.y = 4.8;
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5, 1.3, 1.2), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    counter.position.set(0, 0.65, 3);
    canteen.add(body, roof, counter);
    canteen.position.set(-14, 0, 0);
    scene.add(canteen);

    // Reading Gazebo on South
    const gazebo = new THREE.Group();
    const gFloor = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 5), new THREE.MeshLambertMaterial({ color: 0xfde68a }));
    gFloor.position.y = 0.2;
    const gRoof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.2, 4), new THREE.MeshLambertMaterial({ color: 0xec4899 }));
    gRoof.position.y = 4.8;
    gRoof.rotation.y = Math.PI / 4;
    [
      [-2, -2],
      [2, -2],
      [-2, 2],
      [2, 2],
    ].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.8, 0.4), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      pillar.position.set(px, 2, pz);
      gazebo.add(pillar);
    });
    gazebo.add(gFloor, gRoof);
    gazebo.position.set(-13, 0, 17);
    scene.add(gazebo);

    // Robot Mascot
    const robot = new THREE.Group();
    const rLegs = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.2), new THREE.MeshLambertMaterial({ color: 0x475569 }));
    rLegs.position.y = 0.9;
    const rBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 1.5), new THREE.MeshLambertMaterial({ color: 0x6366f1 }));
    rBody.position.y = 2.9;
    const rHead = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 1.5), new THREE.MeshLambertMaterial({ color: 0x38bdf8 }));
    rHead.position.y = 4.8;
    robot.add(rLegs, rBody, rHead);
    robot.position.set(13, 0, 17);
    scene.add(robot);

    // Flower patches
    const flowerColors = [0xf43f5e, 0xfacc15, 0xa855f7, 0x38bdf8];
    for (let i = 0; i < 24; i++) {
      const fx = Math.sin(i * 2.3) * 36;
      const fz = Math.cos(i * 1.9) * 36;
      if (Math.abs(fx) < 12 && Math.abs(fz) < 12) continue;
      const flower = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 0.6),
        new THREE.MeshLambertMaterial({ color: flowerColors[i % flowerColors.length] })
      );
      flower.position.set(fx, 0.3, fz);
      scene.add(flower);
    }

    // Groups for dynamic buildings & avatars
    const buildingsGroup = new THREE.Group();
    scene.add(buildingsGroup);
    buildingsGroupRef.current = buildingsGroup;

    const avatarsGroup = new THREE.Group();
    scene.add(avatarsGroup);
    avatarsGroupRef.current = avatarsGroup;

    // Pointer events for camera orbit
    const dom = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevPointerRef.current.x;
      const dy = e.clientY - prevPointerRef.current.y;
      camYawRef.current -= dx * 0.007;
      camPitchRef.current = Math.max(0.18, Math.min(1.25, camPitchRef.current + dy * 0.006));
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
    };
    const onWheel = (e: WheelEvent) => {
      camDistRef.current = Math.max(10, Math.min(55, camDistRef.current + e.deltaY * 0.02));
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: true });

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName || ''))) return;
      const k = e.key.toLowerCase();
      keysPressedRef.current[k] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        triggerJump(0);
      }
      if (e.key === 'Enter') {
        triggerJump(1);
      }
      if (k === 'u') {
        triggerJump(2);
      }
      if (k === 'r') {
        triggerJump(3);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Resize handler
    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Main animation loop
    let animId: number;
    const targetVec = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate central crystal & drift clouds
      if (crystalMeshRef.current) {
        crystalMeshRef.current.rotation.y += 0.015;
        crystalMeshRef.current.position.y = 5.2 + Math.sin(Date.now() * 0.003) * 0.35;
      }
      if (cloudsGroupRef.current) {
        cloudsGroupRef.current.children.forEach((c, i) => {
          c.position.x += 0.015 * (i % 2 === 0 ? 1 : -1);
          if (c.position.x > 55) c.position.x = -55;
          if (c.position.x < -55) c.position.x = 55;
        });
      }

      // Compute Movement
      const { players: curPlayers, activePlayerIdx: actIdx, moveMode: curMode, dpadState: curDpad, buildings: curBldgs } = stateRef.current;
      const speed = 0.24;
      const moveVectors = [
        { dx: 0, dz: 0 },
        { dx: 0, dz: 0 },
        { dx: 0, dz: 0 },
        { dx: 0, dz: 0 },
      ];

      const kp = keysPressedRef.current;
      // P1: WASD
      if (kp['w']) moveVectors[0].dz -= 1;
      if (kp['s']) moveVectors[0].dz += 1;
      if (kp['a']) moveVectors[0].dx -= 1;
      if (kp['d']) moveVectors[0].dx += 1;

      // P2: Arrows
      if (kp['arrowup']) moveVectors[1].dz -= 1;
      if (kp['arrowdown']) moveVectors[1].dz += 1;
      if (kp['arrowleft']) moveVectors[1].dx -= 1;
      if (kp['arrowright']) moveVectors[1].dx += 1;

      // P3: IJKL
      if (kp['i']) moveVectors[2].dz -= 1;
      if (kp['k']) moveVectors[2].dz += 1;
      if (kp['j']) moveVectors[2].dx -= 1;
      if (kp['l']) moveVectors[2].dx += 1;

      // P4: TFGH
      if (kp['t']) moveVectors[3].dz -= 1;
      if (kp['g']) moveVectors[3].dz += 1;
      if (kp['f']) moveVectors[3].dx -= 1;
      if (kp['h']) moveVectors[3].dx += 1;

      // D-Pad active player
      if (curDpad.up) moveVectors[actIdx].dz -= 1;
      if (curDpad.down) moveVectors[actIdx].dz += 1;
      if (curDpad.left) moveVectors[actIdx].dx -= 1;
      if (curDpad.right) moveVectors[actIdx].dx += 1;

      // Auto-wander mode
      if (curMode === 'auto') {
        autoWanderTimerRef.current += 0.02;
        curPlayers.forEach((_, i) => {
          const angle = autoWanderTimerRef.current + i * (Math.PI / 2);
          moveVectors[i].dx = Math.cos(angle) * 0.5;
          moveVectors[i].dz = Math.sin(angle) * 0.5;
        });
      }

      curPlayers.forEach((p, idx) => {
        const mv = moveVectors[idx];
        if (mv.dx !== 0 || mv.dz !== 0) {
          const sin = Math.sin(camYawRef.current);
          const cos = Math.cos(camYawRef.current);
          const worldDx = mv.dx * cos + mv.dz * sin;
          const worldDz = mv.dz * cos - mv.dx * sin;
          const len = Math.hypot(worldDx, worldDz) || 1;
          p.x = Math.max(-45, Math.min(45, p.x + (worldDx / len) * speed));
          p.z = Math.max(-45, Math.min(45, p.z + (worldDz / len) * speed));
          p.rot = Math.atan2(worldDx, worldDz);
        }

        // Gravity & Jump
        if (p.y > 0 || p.vy > 0) {
          p.y += p.vy;
          p.vy -= 0.018;
          if (p.y <= 0) {
            p.y = 0;
            p.vy = 0;
          }
        }

        if (avatarsGroupRef.current && avatarsGroupRef.current.children[idx]) {
          const mesh = avatarsGroupRef.current.children[idx];
          mesh.position.set(p.x, p.y, p.z);
          mesh.rotation.y = p.rot;
        }
      });

      // Camera follow active player with smooth interpolation
      const activeP = curPlayers[actIdx] || curPlayers[0];
      const cx = activeP.x + Math.sin(camYawRef.current) * Math.cos(camPitchRef.current) * camDistRef.current;
      const cy = activeP.y + 2 + Math.sin(camPitchRef.current) * camDistRef.current;
      const cz = activeP.z + Math.cos(camYawRef.current) * Math.cos(camPitchRef.current) * camDistRef.current;
      camera.position.lerp(targetVec.set(cx, cy, cz), 0.14);
      camera.lookAt(activeP.x, activeP.y + 2.2, activeP.z);

      // Check nearby building or canteen
      let found: Building | { isCanteen: true } | null = null;
      for (const b of curBldgs) {
        const dist = Math.hypot(activeP.x - b.x, activeP.z - (b.z + 4.5));
        if (dist < 4.5) {
          found = b;
          break;
        }
      }
      if (!found) {
        const distCanteen = Math.hypot(activeP.x - -14, activeP.z - 3);
        if (distCanteen < 4) {
          found = { isCanteen: true };
        }
      }
      onNearbyBuildingChange(found);

      // Project 3D tags to 2D screen coordinates
      if (onProjectedCoordsChange) {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const projectedPlayers = curPlayers.map((p) => {
          const v = new THREE.Vector3(p.x, p.y + 4.3, p.z);
          v.project(camera);
          const visible = v.z < 1;
          const sx = (v.x * 0.5 + 0.5) * w;
          const sy = (-v.y * 0.5 + 0.5) * h;
          return { id: p.id, name: p.name, x: sx, y: sy, visible };
        });

        const projectedBldgs = curBldgs.map((b) => {
          const v = new THREE.Vector3(b.x, 9.6, b.z);
          v.project(camera);
          const visible = v.z < 1;
          const sx = (v.x * 0.5 + 0.5) * w;
          const sy = (-v.y * 0.5 + 0.5) * h;
          return { code: b.code, name: b.name, icon: b.icon, color: b.color, x: sx, y: sy, visible };
        });

        const monV = new THREE.Vector3(0, 8.2, 0);
        monV.project(camera);
        const monVisible = monV.z < 1;
        const monSx = (monV.x * 0.5 + 0.5) * w;
        const monSy = (-monV.y * 0.5 + 0.5) * h;

        onProjectedCoordsChange({
          players: projectedPlayers,
          buildings: projectedBldgs,
          monument: { x: monSx, y: monSy, visible: monVisible },
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />;
};
