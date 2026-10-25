/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Creates procedural texture for starfighter armor paneling
 */
export function createPanelTexture(baseColor = '#1f242d', lineColor = '#0e1116'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle noise & panel lines
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;

    // Grid panels
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Rivet dots
    ctx.fillStyle = '#3a4454';
    for (let x = step / 2; x < 512; x += step) {
      for (let y = step / 2; y < 512; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates procedural grayscale bump texture for metallic cratered asteroids
 */
export function createAsteroidBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    // Craters and crevices
    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * 256;
      const cy = Math.random() * 256;
      const r = 4 + Math.random() * 18;

      const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
      grad.addColorStop(0, '#222222');
      grad.addColorStop(0.7, '#555555');
      grad.addColorStop(1, '#808080');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Highlight rim
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 1, r, 0, Math.PI);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Player Interceptor (3-12 composite parts):
 * - Main fuselage & needle prow
 * - Canopy glass
 * - Asymmetrical wing foils
 * - Twin laser cannon hardpoints
 * - Dual plasma ion engine bells
 */
export function createPlayerFighterMesh(hullHex = 0x22262d, accentHex = 0x06b6d4): THREE.Group {
  const group = new THREE.Group();

  const panelTex = createPanelTexture('#20252c', '#111418');

  const hullMat = new THREE.MeshStandardMaterial({
    color: hullHex,
    roughness: 0.65,
    metalness: 0.85,
    map: panelTex,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.35,
    metalness: 0.6,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.3,
    metalness: 0.9,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: accentHex,
  });

  // 1. Central fuselage (elongated tapered wedge)
  const fuselageGeo = new THREE.ConeGeometry(1.6, 9.5, 5);
  fuselageGeo.rotateX(Math.PI / 2);
  fuselageGeo.scale(1.2, 0.6, 1.0);
  const fuselage = new THREE.Mesh(fuselageGeo, hullMat);
  fuselage.position.set(0, 0, 0);
  group.add(fuselage);

  // 2. Armored Cockpit Canopy
  const canopyGeo = new THREE.SphereGeometry(1.0, 16, 12);
  canopyGeo.scale(0.8, 0.65, 2.2);
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x09141f,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85,
    reflectivity: 0.9,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.6, -0.4);
  group.add(canopy);

  // 3. Port Main Wing
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(-5.5, 2.2);
  wingShape.lineTo(-5.2, 1.2);
  wingShape.lineTo(-1.2, -2.8);
  wingShape.closePath();

  const wingExtrudeSettings = { depth: 0.18, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 };
  const portWingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
  portWingGeo.rotateX(Math.PI / 2);
  const portWing = new THREE.Mesh(portWingGeo, hullMat);
  portWing.position.set(-0.6, 0.1, 0.5);
  group.add(portWing);

  // 4. Starboard Main Wing (Asymmetric tip)
  const stbWingShape = new THREE.Shape();
  stbWingShape.moveTo(0, 0);
  stbWingShape.lineTo(5.8, 2.0);
  stbWingShape.lineTo(5.5, 0.8);
  stbWingShape.lineTo(1.2, -2.8);
  stbWingShape.closePath();
  const stbWingGeo = new THREE.ExtrudeGeometry(stbWingShape, wingExtrudeSettings);
  stbWingGeo.rotateX(Math.PI / 2);
  const stbWing = new THREE.Mesh(stbWingGeo, hullMat);
  stbWing.position.set(0.6, 0.1, 0.5);
  group.add(stbWing);

  // 5. Wing Accent Racing Stripes
  const stripeGeo = new THREE.BoxGeometry(0.5, 0.05, 3.2);
  const portStripe = new THREE.Mesh(stripeGeo, accentMat);
  portStripe.position.set(-2.8, 0.22, 0.2);
  portStripe.rotateY(-0.35);
  group.add(portStripe);

  const stbStripe = new THREE.Mesh(stripeGeo, accentMat);
  stbStripe.position.set(2.8, 0.22, 0.2);
  stbStripe.rotateY(0.35);
  group.add(stbStripe);

  // 6. Dual Laser Cannons (wingtips / hardpoints)
  const cannonGeo = new THREE.CylinderGeometry(0.09, 0.12, 4.2, 8);
  cannonGeo.rotateX(Math.PI / 2);

  const portCannon = new THREE.Mesh(cannonGeo, metalMat);
  portCannon.position.set(-4.5, 0.0, -0.6);
  group.add(portCannon);

  const stbCannon = new THREE.Mesh(cannonGeo, metalMat);
  stbCannon.position.set(4.5, 0.0, -0.6);
  group.add(stbCannon);

  // Cannon muzzle emitters
  const emitterGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.3, 8);
  emitterGeo.rotateX(Math.PI / 2);
  const portEmitter = new THREE.Mesh(emitterGeo, glowMat);
  portEmitter.position.set(-4.5, 0.0, -2.7);
  group.add(portEmitter);

  const stbEmitter = new THREE.Mesh(emitterGeo, glowMat);
  stbEmitter.position.set(4.5, 0.0, -2.7);
  group.add(stbEmitter);

  // 7. Twin Aft Ion Engines
  const engineGeo = new THREE.CylinderGeometry(0.48, 0.6, 1.8, 12);
  engineGeo.rotateX(Math.PI / 2);

  const portEngine = new THREE.Mesh(engineGeo, metalMat);
  portEngine.position.set(-0.85, 0.2, 4.2);
  group.add(portEngine);

  const stbEngine = new THREE.Mesh(engineGeo, metalMat);
  stbEngine.position.set(0.85, 0.2, 4.2);
  group.add(stbEngine);

  // Engine exhaust plasma discs
  const plumeGeo = new THREE.ConeGeometry(0.42, 1.4, 12);
  plumeGeo.rotateX(-Math.PI / 2);
  const portPlume = new THREE.Mesh(plumeGeo, glowMat);
  portPlume.position.set(-0.85, 0.2, 5.4);
  portPlume.name = 'engine_plume_port';
  group.add(portPlume);

  const stbPlume = new THREE.Mesh(plumeGeo, glowMat);
  stbPlume.position.set(0.85, 0.2, 5.4);
  stbPlume.name = 'engine_plume_stb';
  group.add(stbPlume);

  // Scale fighter to realistic dogfighting size
  group.scale.set(0.85, 0.85, 0.85);

  return group;
}

/**
 * Enemy Starfighter (Imperial Outer Rim Interceptor):
 * - Sharp triangular dagger wings
 * - Central cockpit eye
 * - Crimson plasma thrusters
 */
export function createEnemyFighterMesh(): THREE.Group {
  const group = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.7,
    metalness: 0.9,
  });

  const redAccentMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });

  // Cockpit core
  const coreGeo = new THREE.DodecahedronGeometry(1.2, 1);
  const core = new THREE.Mesh(coreGeo, hullMat);
  core.position.set(0, 0, 0);
  group.add(core);

  // Red eye visor
  const eyeGeo = new THREE.SphereGeometry(0.5, 8, 8);
  const eye = new THREE.Mesh(eyeGeo, redAccentMat);
  eye.position.set(0, 0.1, -1.0);
  group.add(eye);

  // Dagger side pylons & wings
  const wingGeo = new THREE.BoxGeometry(0.15, 3.8, 5.0);
  const portWing = new THREE.Mesh(wingGeo, hullMat);
  portWing.position.set(-2.2, 0, 0);
  portWing.rotateZ(0.2);
  group.add(portWing);

  const stbWing = new THREE.Mesh(wingGeo, hullMat);
  stbWing.position.set(2.2, 0, 0);
  stbWing.rotateZ(-0.2);
  group.add(stbWing);

  // Red engine thruster
  const thrusterGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 8);
  thrusterGeo.rotateX(Math.PI / 2);
  const thruster = new THREE.Mesh(thrusterGeo, redAccentMat);
  thruster.position.set(0, 0, 1.4);
  group.add(thruster);

  group.scale.set(0.9, 0.9, 0.9);
  return group;
}

/**
 * Dreadnought Flagship (The Leviathan):
 * Massive 350-meter capital warship with procedural damage nodes
 */
export function createDreadnoughtMesh(): {
  group: THREE.Group;
  subsystemMeshes: Map<string, THREE.Mesh>;
} {
  const group = new THREE.Group();
  const subsystemMeshes = new Map<string, THREE.Mesh>();

  const dreadHullMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.8,
    metalness: 0.85,
  });

  const darkPlatesMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.9,
    metalness: 0.7,
  });

  const shieldDomeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
  });

  const turretMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.4,
    metalness: 0.9,
    emissive: 0x991b1b,
    emissiveIntensity: 0.4,
  });

  const reactorMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.3,
    metalness: 0.8,
    emissive: 0xea580c,
    emissiveIntensity: 0.8,
  });

  const bridgeVentMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0x9333ea,
    emissiveIntensity: 0.9,
  });

  // 1. Primary Dreadnought Wedge Hull
  const hullLength = 280;
  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(0, -hullLength * 0.55); // Prow tip
  wedgeShape.lineTo(65, hullLength * 0.45); // Starboard aft corner
  wedgeShape.lineTo(-65, hullLength * 0.45); // Port aft corner
  wedgeShape.closePath();

  const hullGeo = new THREE.ExtrudeGeometry(wedgeShape, {
    depth: 26,
    bevelEnabled: true,
    bevelThickness: 4,
    bevelSize: 3,
  });
  hullGeo.rotateX(Math.PI / 2);
  const mainHull = new THREE.Mesh(hullGeo, dreadHullMat);
  mainHull.position.set(0, 0, 0);
  group.add(mainHull);

  // 2. Central Dorsal Spine & Armor Terraces
  const spineGeo = new THREE.BoxGeometry(32, 14, 180);
  const spine = new THREE.Mesh(spineGeo, darkPlatesMat);
  spine.position.set(0, 14, 10);
  group.add(spine);

  // 3. Command Bridge Tower
  const towerGeo = new THREE.BoxGeometry(45, 12, 35);
  const tower = new THREE.Mesh(towerGeo, dreadHullMat);
  tower.position.set(0, 24, -45);
  group.add(tower);

  // 4. Subsystems: Port & Starboard Deflector Domes (Stage 1)
  const domeGeo = new THREE.SphereGeometry(7, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);

  const portDome = new THREE.Mesh(domeGeo, shieldDomeMat.clone());
  portDome.position.set(-35, 18, 20);
  group.add(portDome);
  subsystemMeshes.set('shield_dome_port', portDome);

  const stbDome = new THREE.Mesh(domeGeo, shieldDomeMat.clone());
  stbDome.position.set(35, 18, 20);
  group.add(stbDome);
  subsystemMeshes.set('shield_dome_starboard', stbDome);

  // 5. Subsystems: 4 Flak Turrets (Stage 2)
  const turretBaseGeo = new THREE.CylinderGeometry(4.5, 5, 3.5, 8);
  const turretBarrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
  turretBarrelGeo.rotateX(Math.PI / 2);

  const turretPositions = [
    { id: 'turret_flak_1', pos: [-18, 10, -40] },
    { id: 'turret_flak_2', pos: [18, 10, -40] },
    { id: 'turret_flak_3', pos: [-20, -10, 10] },
    { id: 'turret_flak_4', pos: [20, -10, 10] },
  ];

  turretPositions.forEach(({ id, pos }) => {
    const tGroup = new THREE.Group();
    const base = new THREE.Mesh(turretBaseGeo, turretMat.clone());
    const barrel = new THREE.Mesh(turretBarrelGeo, turretMat.clone());
    barrel.position.set(0, 1.8, -4);
    tGroup.add(base);
    tGroup.add(barrel);
    tGroup.position.set(pos[0], pos[1], pos[2]);
    group.add(tGroup);
    subsystemMeshes.set(id, base); // reference base for damage feedback
  });

  // 6. Subsystems: Sub-light Engine Reactors (Stage 3)
  const reactorGeo = new THREE.CylinderGeometry(9, 11, 24, 12);
  reactorGeo.rotateX(Math.PI / 2);

  const portReactor = new THREE.Mesh(reactorGeo, reactorMat.clone());
  portReactor.position.set(-25, 0, 120);
  group.add(portReactor);
  subsystemMeshes.set('engine_manifold_port', portReactor);

  const stbReactor = new THREE.Mesh(reactorGeo, reactorMat.clone());
  stbReactor.position.set(25, 0, 120);
  group.add(stbReactor);
  subsystemMeshes.set('engine_manifold_starboard', stbReactor);

  // 7. Subsystem: Bridge Thermal Vent (Stage 4)
  const ventGeo = new THREE.CylinderGeometry(6, 7, 6, 8);
  const bridgeVent = new THREE.Mesh(ventGeo, bridgeVentMat.clone());
  bridgeVent.position.set(0, 22, -60);
  group.add(bridgeVent);
  subsystemMeshes.set('bridge_thermal_vent', bridgeVent);

  return { group, subsystemMeshes };
}

/**
 * Creates Diegetic Cockpit Interior (first-person view model):
 * - Canopy frame struts with reinforced bolts
 * - Dashboard with tactical gauges, switches, and holographic radar mount
 */
export function createCockpitInterior(): {
  cockpitGroup: THREE.Group;
  needleEngines: THREE.Mesh;
  needleWeapons: THREE.Mesh;
  needleShields: THREE.Mesh;
  boostLever: THREE.Mesh;
  flightAssistSwitch: THREE.Mesh;
} {
  const cockpitGroup = new THREE.Group();

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.8,
    metalness: 0.6,
  });

  const metalBezelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.3,
    metalness: 0.9,
  });

  const needleMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  });

  const leverMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.4,
    metalness: 0.8,
  });

  // 1. Armored Canopy Frame Ribs (Left & Right angled arch struts, leaving forward center 100% clear)
  const archGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.8, 6);

  // Left diagonal strut
  const leftStrut = new THREE.Mesh(archGeo, interiorMat);
  leftStrut.position.set(-0.85, 0.35, -0.9);
  leftStrut.rotation.set(0.4, 0, 0.35);
  cockpitGroup.add(leftStrut);

  // Right diagonal strut
  const rightStrut = new THREE.Mesh(archGeo, interiorMat);
  rightStrut.position.set(0.85, 0.35, -0.9);
  rightStrut.rotation.set(0.4, 0, -0.35);
  cockpitGroup.add(rightStrut);

  // Top canopy visor arch
  const topArchGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6);
  topArchGeo.rotateZ(Math.PI / 2);
  const topArch = new THREE.Mesh(topArchGeo, interiorMat);
  topArch.position.set(0, 0.95, -0.75);
  cockpitGroup.add(topArch);

  // 2. Dashboard Console Base
  const dashGeo = new THREE.BoxGeometry(2.4, 0.55, 1.1);
  const dash = new THREE.Mesh(dashGeo, interiorMat);
  dash.position.set(0, -0.55, -1.1);
  dash.rotateX(0.35);
  cockpitGroup.add(dash);

  // 3. Three Analog Tactical Power Needles (Engines, Weapons, Shields)
  const dialRadius = 0.14;
  const dialGeo = new THREE.CircleGeometry(dialRadius, 16);
  const dialMat = new THREE.MeshBasicMaterial({ color: 0x050b14 });

  const needleGeo = new THREE.BoxGeometry(0.015, 0.12, 0.01);
  needleGeo.translate(0, 0.05, 0);

  // Dial 1: Engines (Left)
  const dialEng = new THREE.Mesh(dialGeo, dialMat);
  dialEng.position.set(-0.55, -0.42, -0.92);
  dialEng.rotateX(0.35);
  cockpitGroup.add(dialEng);
  const needleEngines = new THREE.Mesh(needleGeo, needleMat.clone());
  dialEng.add(needleEngines);

  // Dial 2: Weapons (Center-Left)
  const dialWeap = new THREE.Mesh(dialGeo, dialMat);
  dialWeap.position.set(-0.22, -0.42, -0.92);
  dialWeap.rotateX(0.35);
  cockpitGroup.add(dialWeap);
  const needleWeapons = new THREE.Mesh(needleGeo, needleMat.clone());
  dialWeap.add(needleWeapons);

  // Dial 3: Shields (Center-Right)
  const dialShld = new THREE.Mesh(dialGeo, dialMat);
  dialShld.position.set(0.12, -0.42, -0.92);
  dialShld.rotateX(0.35);
  cockpitGroup.add(dialShld);
  const needleShields = new THREE.Mesh(needleGeo, needleMat.clone());
  dialShld.add(needleShields);

  // 4. Boost Throttle Lever (Right hand quadrant)
  const leverBaseGeo = new THREE.BoxGeometry(0.12, 0.08, 0.35);
  const leverBase = new THREE.Mesh(leverBaseGeo, metalBezelMat);
  leverBase.position.set(0.65, -0.48, -0.85);
  leverBase.rotateX(0.35);
  cockpitGroup.add(leverBase);

  const leverHandleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8);
  const boostLever = new THREE.Mesh(leverHandleGeo, leverMat);
  boostLever.position.set(0.65, -0.38, -0.85);
  cockpitGroup.add(boostLever);

  // 5. Flight Assist Decoupled Toggle Switch
  const switchGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.14, 6);
  const flightAssistSwitch = new THREE.Mesh(switchGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
  flightAssistSwitch.position.set(0.42, -0.44, -0.88);
  cockpitGroup.add(flightAssistSwitch);

  return {
    cockpitGroup,
    needleEngines,
    needleWeapons,
    needleShields,
    boostLever,
    flightAssistSwitch,
  };
}
