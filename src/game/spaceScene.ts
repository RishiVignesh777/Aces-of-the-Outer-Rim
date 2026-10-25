/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createPlayerFighterMesh,
  createEnemyFighterMesh,
  createDreadnoughtMesh,
  createCockpitInterior,
  createAsteroidBumpTexture,
} from './shipModels.ts';
import { createHoloRadarGlobe, type RadarContact } from './cockpitHud.ts';
import { stepPhysics, type ShipPhysicsState, type FlightInput, v3, scale, add, length } from './physics.ts';
import {
  createInitialPowerState,
  updatePowerSystem,
  type PowerSystemState,
} from './powerSystem.ts';
import {
  createInitialDreadnought,
  damageSubsystem,
  type DreadnoughtState,
  type CapitalSubsystem,
} from './dreadnought.ts';
import {
  createInitialSquad,
  issueSquadOrder,
  type SquadState,
  type SquadOrder,
} from './squad.ts';
import { sound } from './audio.ts';
import type { HangarLoadout } from './hangar.ts';

export interface TelemetryData {
  speed: number;
  maxSpeed: number;
  throttle: number;
  isDrifting: boolean;
  flightAssist: boolean;
  boostActive: boolean;
  boostFuel: number;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  laserHeat: number;
  laserCapacitor: number;
  viewMode: 'COCKPIT' | 'PURSUIT';
  targetInfo: {
    name: string;
    distance: number;
    hp: number;
    maxHp: number;
    isSubsystem: boolean;
    destroyed?: boolean;
  } | null;
  dreadnoughtStage: string;
  dreadnoughtHp: number;
  dreadnoughtMaxHp: number;
  squad: SquadState;
  power: PowerSystemState;
  missileLocked: boolean;
}

export interface SpaceSimulationCallbacks {
  onTelemetryUpdate: (data: TelemetryData) => void;
  onVictory: (stats: { timeSec: number; enemiesKilled: number; accuracy: number }) => void;
  onGameOver: (stats: { timeSec: number; subsystemsDestroyed: number }) => void;
  onRadioMessage: (msg: { sender: string; text: string }) => void;
}

interface Projectile {
  active: boolean;
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  isEnemy: boolean;
  damage: number;
}

interface EnemyShip {
  id: string;
  group: THREE.Group;
  velocity: THREE.Vector3;
  hp: number;
  maxHp: number;
  shield: number;
  attackCooldown: number;
  aiState: 'PURSUE' | 'EVADE' | 'STRAFE';
  targetPos: THREE.Vector3;
  destroyed: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

export class SpaceCombatSimulation {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDestroyed: boolean = false;
  private isPaused: boolean = false;
  private isTitleMode: boolean = true;
  private titleOrbitAngle: number = 0;

  // Scene Entities
  private playerGroup!: THREE.Group;
  private playerFighterMesh!: THREE.Group;
  private cockpitInterior!: ReturnType<typeof createCockpitInterior>;
  private holoRadar!: ReturnType<typeof createHoloRadarGlobe>;
  private dreadnoughtData!: ReturnType<typeof createDreadnoughtMesh>;

  // Simulation State
  private shipPhysics!: ShipPhysicsState;
  private flightInput: FlightInput = {
    throttle: 0,
    strafeX: 0,
    strafeY: 0,
    pitch: 0,
    yaw: 0,
    roll: 0,
    boost: false,
    flightAssist: true,
  };

  private playerHull = 100;
  private playerMaxHull = 100;
  private powerState!: PowerSystemState;
  private dreadnoughtState!: DreadnoughtState;
  private squadState!: SquadState;
  private currentLoadout!: HangarLoadout;

  private viewMode: 'COCKPIT' | 'PURSUIT' = 'COCKPIT';
  private lockedTargetId: string | null = null;
  private callbacks: SpaceSimulationCallbacks;

  // Object Pools
  private projectiles: Projectile[] = [];
  private enemies: EnemyShip[] = [];
  private particles: Particle[] = [];
  private asteroidInstancedMesh!: THREE.InstancedMesh;

  // Camera Shake & Hitstop
  private trauma: number = 0;
  private simHitstopTimer: number = 0;
  private primaryFireTimer: number = 0;
  private lastShotTime: number = 0;
  private shotsFired: number = 0;
  private shotsHit: number = 0;
  private enemiesKilled: number = 0;
  private missionStartTime: number = 0;

  // Math helpers
  private _vec3A = new THREE.Vector3();
  private _vec3B = new THREE.Vector3();
  private _quatA = new THREE.Quaternion();

  constructor(
    container: HTMLDivElement,
    loadout: HangarLoadout,
    callbacks: SpaceSimulationCallbacks
  ) {
    this.container = container;
    this.currentLoadout = loadout;
    this.callbacks = callbacks;

    this.initRenderer();
    this.initScene();
    this.initLighting();
    this.initEnvironment();
    this.initPlayer();
    this.initDreadnought();
    this.initSquadAndEnemies();
    this.initObjectPools();

    this.missionStartTime = Date.now();
    sound.init();
    sound.startAtmosphericMusic();

    this.startLoop();
  }

  private initRenderer() {
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      6000
    );
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060c);
    this.scene.fog = new THREE.FogExp2(0x060814, 0.00035);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }

  private initLighting() {
    // Distant amber stellar key light
    const sunLight = new THREE.DirectionalLight(0xffeedd, 2.5);
    sunLight.position.set(400, 250, -500);
    this.scene.add(sunLight);

    // Deep space rim light (cyan/blue from planetary ring reflection)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-300, -100, 300);
    this.scene.add(rimLight);

    // Ambient fill
    const hemiLight = new THREE.HemisphereLight(0x1e293b, 0x0f172a, 0.6);
    this.scene.add(hemiLight);
  }

  private initEnvironment() {
    // 1. Starfield (5000 twinkling particles)
    const starCount = 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 2500 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const tint = Math.random();
      if (tint > 0.7) {
        // Cyan star
        starColors[i * 3] = 0.6;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 1.0;
      } else if (tint > 0.4) {
        // Amber star
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.8;
        starColors[i * 3 + 2] = 0.5;
      } else {
        // Crisp white
        starColors[i * 3] = 0.95;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 1.0;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    this.scene.add(starField);

    // 2. Distant Ringed Gas Giant Planet
    const planetGroup = new THREE.Group();
    planetGroup.position.set(1200, 300, -2200);

    const planetGeo = new THREE.SphereGeometry(320, 32, 24);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      metalness: 0.1,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planet);

    // Glowing Planetary Ring Disc
    const ringGeo = new THREE.RingGeometry(380, 750, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotateX(Math.PI / 2.3);
    planetGroup.add(ring);
    this.scene.add(planetGroup);

    // 3. Dense Orbiting Asteroid Belt (InstancedMesh 260 instances)
    const asteroidCount = 260;
    const asteroidGeo = new THREE.DodecahedronGeometry(1, 1);
    const rockBumpTex = createAsteroidBumpTexture();
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x3b4252,
      roughness: 0.9,
      metalness: 0.35,
      bumpMap: rockBumpTex,
      bumpScale: 0.45,
    });

    this.asteroidInstancedMesh = new THREE.InstancedMesh(asteroidGeo, asteroidMat, asteroidCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < asteroidCount; i++) {
      // Distribute in donut ring around the combat arena
      const dist = 180 + Math.random() * 850;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 160;

      dummy.position.set(Math.cos(angle) * dist, height, Math.sin(angle) * dist - 200);
      const scale = 4 + Math.random() * 22;
      dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.4), scale);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      this.asteroidInstancedMesh.setMatrixAt(i, dummy.matrix);
    }
    this.asteroidInstancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.asteroidInstancedMesh);
  }

  private initPlayer() {
    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(0, 5, 240); // Facing dreadnought at (0, 0, -100)
    this.scene.add(this.playerGroup);

    // Initial Physics
    this.shipPhysics = {
      position: v3(0, 5, 240),
      velocity: v3(0, 0, 0),
      forward: v3(0, 0, -1),
      up: v3(0, 1, 0),
      right: v3(1, 0, 0),
      speed: 0,
      isDrifting: false,
      boostActive: false,
    };

    // Exterior Fighter Mesh
    this.playerFighterMesh = createPlayerFighterMesh(0x18181b, 0x06b6d4);
    this.playerGroup.add(this.playerFighterMesh);

    // Interior Cockpit Cockpit rig
    this.cockpitInterior = createCockpitInterior();
    this.playerGroup.add(this.cockpitInterior.cockpitGroup);

    // Holographic 3D Wireframe Radar Globe
    this.holoRadar = createHoloRadarGlobe();
    this.holoRadar.radarGroup.position.set(0, -0.28, -0.92);
    this.playerGroup.add(this.holoRadar.radarGroup);

    // Initial Systems
    this.powerState = createInitialPowerState();
    this.squadState = createInitialSquad();

    this.isTitleMode = true;
    this.updateViewMode();
  }

  private initDreadnought() {
    this.dreadnoughtData = createDreadnoughtMesh();
    // Dramatic 3/4 broadside combat angle showing wedge prow, dorsal bridge tower, and shield domes
    this.dreadnoughtData.group.position.set(0, 0, -520);
    this.dreadnoughtData.group.rotation.set(-0.08, 0.55, 0.05);
    this.scene.add(this.dreadnoughtData.group);
    this.dreadnoughtState = createInitialDreadnought();
  }

  private initSquadAndEnemies() {
    // 2 Allied Wingmen
    const allyMat = 0x2563eb;
    const wingVex = createPlayerFighterMesh(0x1e293b, allyMat);
    wingVex.position.set(-25, 4, 260);
    this.scene.add(wingVex);

    const wingKira = createPlayerFighterMesh(0x1e293b, allyMat);
    wingKira.position.set(25, 6, 260);
    this.scene.add(wingKira);

    // 4 Initial Imperial Interceptors
    for (let i = 0; i < 4; i++) {
      this.spawnEnemy(i);
    }
  }

  private spawnEnemy(idx: number) {
    const group = createEnemyFighterMesh();
    const spawnX = (idx % 2 === 0 ? 1 : -1) * (60 + Math.random() * 80);
    const spawnY = (Math.random() - 0.5) * 50;
    const spawnZ = -40 + Math.random() * 120;
    group.position.set(spawnX, spawnY, spawnZ);
    this.scene.add(group);

    this.enemies.push({
      id: `enemy_${Date.now()}_${idx}`,
      group,
      velocity: new THREE.Vector3(0, 0, 10),
      hp: 75,
      maxHp: 75,
      shield: 40,
      attackCooldown: 1.5 + Math.random() * 2,
      aiState: 'PURSUE',
      targetPos: new THREE.Vector3(),
      destroyed: false,
    });
  }

  private initObjectPools() {
    // Pre-allocate laser projectiles (Pool of 40)
    const laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6);
    laserGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < 45; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const mesh = new THREE.Mesh(laserGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.projectiles.push({
        active: false,
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        isEnemy: false,
        damage: 25,
      });
    }

    // Pre-allocate particle pool (Pool of 80 for zero-GC explosion blasts)
    const pGeo = new THREE.SphereGeometry(0.4, 6, 4);
    for (let i = 0; i < 80; i++) {
      const pMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.visible = false;
      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        active: false,
      });
    }
  }

  public setInput(input: Partial<FlightInput>) {
    this.flightInput = { ...this.flightInput, ...input };
  }

  public setPowerPreset(preset: 'ENGINES' | 'WEAPONS' | 'SHIELDS' | 'BALANCED') {
    this.powerState = {
      ...this.powerState,
      preset,
      target: {
        ENGINES: { engines: 60, weapons: 20, shields: 20 },
        WEAPONS: { engines: 20, weapons: 60, shields: 20 },
        SHIELDS: { engines: 20, weapons: 20, shields: 60 },
        BALANCED: { engines: 33.33, weapons: 33.33, shields: 33.34 },
      }[preset],
    };
    sound.playSwitchClick();
  }

  public triggerPowerDump() {
    if (this.powerState.shieldLevel > 20 && this.powerState.powerDumpCooldown <= 0) {
      this.powerState.shieldLevel -= 35;
      this.powerState.boostFuel = 100;
      this.powerState.powerDumpCooldown = 12;
      sound.playTorpedoLaunch();
      this.addTrauma(0.3);
    }
  }

  public triggerOvercharge() {
    if (this.powerState.overchargeTimer <= 0) {
      this.powerState.overchargeTimer = 6.0;
      this.powerState.laserCapacitor = 100;
      this.powerState.laserHeat = 0;
      sound.playMissileLockWarning();
      this.addTrauma(0.4);
    }
  }

  public issueSquadOrder(order: SquadOrder) {
    this.squadState = issueSquadOrder(this.squadState, order, this.lockedTargetId || undefined);
    sound.playRadioBeep();
    if (this.squadState.lastRadioMessage) {
      this.callbacks.onRadioMessage(this.squadState.lastRadioMessage);
    }
  }

  public setTitleMode(isTitle: boolean) {
    this.isTitleMode = isTitle;
    this.updateViewMode();
  }

  public toggleViewMode() {
    this.viewMode = this.viewMode === 'COCKPIT' ? 'PURSUIT' : 'COCKPIT';
    this.updateViewMode();
    sound.playSwitchClick();
  }

  private updateViewMode() {
    if (this.isTitleMode) {
      // In title mode, show beautiful exterior fighter and hide cockpit interior
      this.cockpitInterior.cockpitGroup.visible = false;
      this.holoRadar.radarGroup.visible = false;
      this.playerFighterMesh.visible = true;
      return;
    }

    if (this.viewMode === 'COCKPIT') {
      this.cockpitInterior.cockpitGroup.visible = true;
      this.holoRadar.radarGroup.visible = true;
      this.playerFighterMesh.visible = false; // Hide exterior mesh while inside cockpit
    } else {
      this.cockpitInterior.cockpitGroup.visible = false;
      this.holoRadar.radarGroup.visible = false;
      this.playerFighterMesh.visible = true;
    }
  }

  public firePrimary() {
    if (this.powerState.laserHeat >= 95 || this.powerState.laserCapacitor < 8) return;

    const now = Date.now();
    if (now - this.lastShotTime < 140) return;
    this.lastShotTime = now;

    this.shotsFired++;
    this.powerState.laserHeat = Math.min(100, this.powerState.laserHeat + 6);
    this.powerState.laserCapacitor = Math.max(0, this.powerState.laserCapacitor - 7);

    sound.playLaser(1.0 + (Math.random() - 0.5) * 0.15);

    // Spawn 2 laser bolts from wing cannons
    const offsets = [-3.8, 3.8];
    offsets.forEach((offsetX) => {
      const proj = this.projectiles.find((p) => !p.active);
      if (!proj) return;

      proj.active = true;
      proj.isEnemy = false;
      proj.damage = 25;
      proj.life = 2.2;
      proj.mesh.visible = true;

      const spawnPos = this.playerGroup.position.clone();
      this._vec3A.set(offsetX, 0, -2.5).applyQuaternion(this.playerGroup.quaternion);
      spawnPos.add(this._vec3A);
      proj.mesh.position.copy(spawnPos);
      proj.mesh.quaternion.copy(this.playerGroup.quaternion);

      // Projectile velocity = ship velocity + forward muzzle speed
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerGroup.quaternion);
      proj.velocity.copy(fwd).multiplyScalar(280);
      proj.velocity.add(this._vec3A.set(this.shipPhysics.velocity.x, this.shipPhysics.velocity.y, this.shipPhysics.velocity.z));
    });
  }

  public fireSecondary() {
    // Heavy torpedo launch
    sound.playTorpedoLaunch();
    this.addTrauma(0.25);

    const proj = this.projectiles.find((p) => !p.active);
    if (!proj) return;

    proj.active = true;
    proj.isEnemy = false;
    proj.damage = 180;
    proj.life = 3.5;
    proj.mesh.visible = true;
    proj.mesh.scale.set(2, 2, 2);

    const spawnPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, -0.6, -2.5).applyQuaternion(this.playerGroup.quaternion));
    proj.mesh.position.copy(spawnPos);
    proj.mesh.quaternion.copy(this.playerGroup.quaternion);

    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerGroup.quaternion);
    proj.velocity.copy(fwd).multiplyScalar(160);
  }

  public cycleTarget() {
    // Target closest enemy or next dreadnought subsystem
    const liveEnemies = this.enemies.filter((e) => !e.destroyed);
    if (liveEnemies.length > 0) {
      const currentIdx = liveEnemies.findIndex((e) => e.id === this.lockedTargetId);
      const nextIdx = (currentIdx + 1) % liveEnemies.length;
      this.lockedTargetId = liveEnemies[nextIdx].id;
    } else {
      // Target active subsystem
      const activeSub = this.dreadnoughtState.subsystems.find((s) => !s.destroyed);
      this.lockedTargetId = activeSub ? activeSub.id : null;
    }
    sound.playSwitchClick();
  }

  private addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  private spawnExplosion(x: number, y: number, z: number, count = 14, isLarge = false) {
    sound.playExplosion(isLarge);
    this.addTrauma(isLarge ? 0.7 : 0.35);

    let spawned = 0;
    for (const p of this.particles) {
      if (p.active) continue;
      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set(x, y, z);
      p.life = 0;
      p.maxLife = 0.5 + Math.random() * (isLarge ? 1.0 : 0.6);

      const speed = (isLarge ? 40 : 22) * (0.5 + Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      p.vel.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed,
        Math.sin(phi) * Math.sin(theta) * speed
      );

      spawned++;
      if (spawned >= count) break;
    }
  }

  private startLoop() {
    let lastTime = performance.now();

    const tick = () => {
      if (this.isDestroyed) return;

      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (!this.isPaused) {
        this.updateSimulation(dt);
      }

      this.render();

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDestroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateSimulation(dt: number) {
    // 1. Sim Hitstop check
    if (this.simHitstopTimer > 0) {
      this.simHitstopTimer -= dt;
      return;
    }

    // 2. Flight Dynamics & Orientation
    const pitchRate = 2.0 * dt;
    const yawRate = 1.8 * dt;
    const rollRate = 2.6 * dt;

    if (this.flightInput.pitch !== 0) {
      this.playerGroup.rotateX(this.flightInput.pitch * pitchRate);
    }
    if (this.flightInput.yaw !== 0) {
      this.playerGroup.rotateY(-this.flightInput.yaw * yawRate);
    }
    if (this.flightInput.roll !== 0) {
      this.playerGroup.rotateZ(-this.flightInput.roll * rollRate);
    }

    // Extract current ship basis vectors
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerGroup.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.playerGroup.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.playerGroup.quaternion);

    this.shipPhysics.forward = { x: fwd.x, y: fwd.y, z: fwd.z };
    this.shipPhysics.up = { x: up.x, y: up.y, z: up.z };
    this.shipPhysics.right = { x: right.x, y: right.y, z: right.z };

    // Energy modifiers
    const enginePowerMult = 0.6 + (this.powerState.current.engines / 100) * 0.8;
    const agilityMult = 0.8 + (this.powerState.current.engines / 100) * 0.4;

    // Check boost consumption
    let boostActive = false;
    if (this.flightInput.boost && this.powerState.boostFuel > 5) {
      boostActive = true;
      this.powerState.boostFuel = Math.max(0, this.powerState.boostFuel - 22 * dt);
    }

    const effectiveInput = {
      ...this.flightInput,
      boost: boostActive,
    };

    // Step physics
    this.shipPhysics = stepPhysics(this.shipPhysics, effectiveInput, dt, enginePowerMult, agilityMult);
    this.playerGroup.position.set(
      this.shipPhysics.position.x,
      this.shipPhysics.position.y,
      this.shipPhysics.position.z
    );

    // Audio engine pitch
    sound.updateEngineSound(
      this.flightInput.throttle,
      boostActive,
      this.shipPhysics.speed / 130
    );

    // 3. Power system update
    this.powerState = updatePowerSystem(this.powerState, dt);

    // 4. Cockpit Dial & Needle Animations
    if (this.cockpitInterior) {
      const engRot = (this.powerState.current.engines / 100) * Math.PI * 1.5 - Math.PI * 0.75;
      const weapRot = (this.powerState.current.weapons / 100) * Math.PI * 1.5 - Math.PI * 0.75;
      const shldRot = (this.powerState.current.shields / 100) * Math.PI * 1.5 - Math.PI * 0.75;

      this.cockpitInterior.needleEngines.rotation.z = -engRot;
      this.cockpitInterior.needleWeapons.rotation.z = -weapRot;
      this.cockpitInterior.needleShields.rotation.z = -shldRot;

      this.cockpitInterior.boostLever.position.z = boostActive ? -0.92 : -0.85;
      this.cockpitInterior.flightAssistSwitch.rotation.x = this.flightInput.flightAssist ? 0.3 : -0.3;
    }

    // 5. Update Projectiles
    for (const p of this.projectiles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.mesh.position.addScaledVector(p.velocity, dt);

      // Collision vs Enemies
      if (!p.isEnemy) {
        for (const enemy of this.enemies) {
          if (enemy.destroyed) continue;
          if (p.mesh.position.distanceTo(enemy.group.position) < 4.2) {
            p.active = false;
            p.mesh.visible = false;
            this.shotsHit++;

            if (enemy.shield > 0) {
              enemy.shield = Math.max(0, enemy.shield - p.damage);
              sound.playShieldHit();
            } else {
              enemy.hp = Math.max(0, enemy.hp - p.damage);
            }

            if (enemy.hp <= 0 && !enemy.destroyed) {
              enemy.destroyed = true;
              enemy.group.visible = false;
              this.enemiesKilled++;
              this.spawnExplosion(enemy.group.position.x, enemy.group.position.y, enemy.group.position.z, 22);
              this.simHitstopTimer = 0.05; // Hitstop freeze on kill!
            }
            break;
          }
        }

        // Collision vs Dreadnought Subsystems
        const dreadPos = this.dreadnoughtData.group.position;
        for (const sub of this.dreadnoughtState.subsystems) {
          if (sub.destroyed) continue;
          this._vec3A
            .set(sub.positionOffset.x, sub.positionOffset.y, sub.positionOffset.z)
            .applyQuaternion(this.dreadnoughtData.group.quaternion)
            .add(dreadPos);

          if (p.mesh.position.distanceTo(this._vec3A) < sub.radius) {
            p.active = false;
            p.mesh.visible = false;
            this.shotsHit++;

            const damageRes = damageSubsystem(this.dreadnoughtState, sub.id, p.damage);
            this.dreadnoughtState = damageRes.state;

            if (damageRes.justDestroyedSubsystem) {
              this.spawnExplosion(this._vec3A.x, this._vec3A.y, this._vec3A.z, 30, true);
              this.simHitstopTimer = 0.08;

              // Hide or char the destroyed subsystem mesh
              const subMesh = this.dreadnoughtData.subsystemMeshes.get(sub.id);
              if (subMesh) {
                subMesh.visible = false;
              }

              if (this.dreadnoughtState.currentStage === 'DESTROYED') {
                this.spawnExplosion(dreadPos.x, dreadPos.y + 10, dreadPos.z, 60, true);
                setTimeout(() => {
                  this.callbacks.onVictory({
                    timeSec: Math.round((Date.now() - this.missionStartTime) / 1000),
                    enemiesKilled: this.enemiesKilled,
                    accuracy: this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 100,
                  });
                }, 1200);
              }
            }
            break;
          }
        }
      }
    }

    // 6. Update Enemy AI
    for (const enemy of this.enemies) {
      if (enemy.destroyed) continue;

      const toPlayer = this.playerGroup.position.clone().sub(enemy.group.position);
      const distToPlayer = toPlayer.length();

      // Enemy flight behavior: dogfight intercept
      if (distToPlayer > 30) {
        toPlayer.normalize();
        enemy.velocity.lerp(toPlayer.multiplyScalar(42), 1.5 * dt);
        enemy.group.position.addScaledVector(enemy.velocity, dt);
        enemy.group.lookAt(this.playerGroup.position);
      } else {
        // Break off maneuver
        enemy.group.position.x += Math.sin(Date.now() * 0.003) * 15 * dt;
      }

      // Attack player
      enemy.attackCooldown -= dt;
      if (enemy.attackCooldown <= 0 && distToPlayer < 180) {
        enemy.attackCooldown = 2.5 + Math.random() * 2.0;

        // Fire enemy laser bolt
        const p = this.projectiles.find((pr) => !pr.active);
        if (p) {
          p.active = true;
          p.isEnemy = true;
          p.damage = 12;
          p.life = 3.0;
          p.mesh.visible = true;
          p.mesh.position.copy(enemy.group.position);

          const aimDir = this.playerGroup.position.clone().sub(enemy.group.position).normalize();
          p.velocity.copy(aimDir).multiplyScalar(190);
        }
      }
    }

    // 7. Enemy lasers hitting player
    for (const p of this.projectiles) {
      if (!p.active || !p.isEnemy) continue;
      if (p.mesh.position.distanceTo(this.playerGroup.position) < 3.0) {
        p.active = false;
        p.mesh.visible = false;

        this.addTrauma(0.35);

        if (this.powerState.shieldLevel > 0) {
          this.powerState.shieldLevel = Math.max(0, this.powerState.shieldLevel - p.damage);
          sound.playShieldHit();
        } else {
          this.playerHull = Math.max(0, this.playerHull - p.damage);
          sound.playExplosion(false);

          if (this.playerHull <= 0) {
            this.callbacks.onGameOver({
              timeSec: Math.round((Date.now() - this.missionStartTime) / 1000),
              subsystemsDestroyed: this.dreadnoughtState.subsystems.filter((s) => s.destroyed).length,
            });
          }
        }
      }
    }

    // 8. Update Particles
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      const alpha = 1.0 - p.life / p.maxLife;
      p.mesh.scale.setScalar(alpha * 1.5);
    }

    // 9. Update Radar Contacts
    const contacts: RadarContact[] = [];
    for (const enemy of this.enemies) {
      if (!enemy.destroyed) {
        contacts.push({
          x: enemy.group.position.x,
          y: enemy.group.position.y,
          z: enemy.group.position.z,
          type: 'ENEMY',
        });
      }
    }
    for (const sub of this.dreadnoughtState.subsystems) {
      if (!sub.destroyed) {
        this._vec3A
          .set(sub.positionOffset.x, sub.positionOffset.y, sub.positionOffset.z)
          .applyQuaternion(this.dreadnoughtData.group.quaternion)
          .add(this.dreadnoughtData.group.position);

        contacts.push({
          x: this._vec3A.x,
          y: this._vec3A.y,
          z: this._vec3A.z,
          type: 'SUBSYSTEM',
        });
      }
    }
    this.holoRadar.updateContacts(contacts, this.playerGroup.position);

    // 10. Camera Framing & Damping
    this.updateCamera(dt);

    // 11. Send Telemetry to Diegetic HUD
    this.emitTelemetry();
  }

  private updateCamera(dt: number) {
    if (this.isTitleMode) {
      // Cinematic live-world camera orbit around the interceptor hero centerpiece
      this.titleOrbitAngle += 0.25 * dt;
      const radius = 13.5;
      const camX = this.playerGroup.position.x + Math.sin(this.titleOrbitAngle) * radius;
      const camY = this.playerGroup.position.y + 2.8 + Math.sin(this.titleOrbitAngle * 0.5) * 1.2;
      const camZ = this.playerGroup.position.z + Math.cos(this.titleOrbitAngle) * radius;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.playerGroup.position);
      return;
    }

    if (this.viewMode === 'COCKPIT') {
      // Cockpit camera sits comfortably inside canopy looking forward
      this.camera.position.copy(this.playerGroup.position);
      this._vec3A.set(0, 0.55, 0.15).applyQuaternion(this.playerGroup.quaternion);
      this.camera.position.add(this._vec3A);
      this.camera.quaternion.copy(this.playerGroup.quaternion);
    } else {
      // Pursuit third-person camera trailing smoothly behind the fighter
      const targetPos = this.playerGroup.position.clone();
      this._vec3A.set(0, 3.5, 12).applyQuaternion(this.playerGroup.quaternion);
      targetPos.add(this._vec3A);

      this.camera.position.lerp(targetPos, 10.0 * dt);
      this.camera.lookAt(this.playerGroup.position.clone().add(new THREE.Vector3(0, 0, -20).applyQuaternion(this.playerGroup.quaternion)));
    }

    // Screen Shake / Trauma
    if (this.trauma > 0) {
      const shake = this.trauma * this.trauma * 0.4;
      this.camera.position.x += (Math.random() - 0.5) * shake;
      this.camera.position.y += (Math.random() - 0.5) * shake;
      this.trauma = Math.max(0, this.trauma - 1.2 * dt);
    }
  }

  private emitTelemetry() {
    let targetInfo = null;
    if (this.lockedTargetId) {
      const enemy = this.enemies.find((e) => e.id === this.lockedTargetId);
      if (enemy) {
        targetInfo = {
          name: 'Imperial TIE Interceptor',
          distance: Math.round(this.playerGroup.position.distanceTo(enemy.group.position)),
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          isSubsystem: false,
          destroyed: enemy.destroyed,
        };
      } else {
        const sub = this.dreadnoughtState.subsystems.find((s) => s.id === this.lockedTargetId);
        if (sub) {
          this._vec3A
            .set(sub.positionOffset.x, sub.positionOffset.y, sub.positionOffset.z)
            .applyQuaternion(this.dreadnoughtData.group.quaternion)
            .add(this.dreadnoughtData.group.position);

          targetInfo = {
            name: sub.name,
            distance: Math.round(this.playerGroup.position.distanceTo(this._vec3A)),
            hp: sub.hp,
            maxHp: sub.maxHp,
            isSubsystem: true,
            destroyed: sub.destroyed,
          };
        }
      }
    }

    this.callbacks.onTelemetryUpdate({
      speed: Math.round(this.shipPhysics.speed),
      maxSpeed: Math.round(75 * (0.6 + (this.powerState.current.engines / 100) * 0.8)),
      throttle: this.flightInput.throttle,
      isDrifting: this.shipPhysics.isDrifting,
      flightAssist: this.flightInput.flightAssist,
      boostActive: this.shipPhysics.boostActive,
      boostFuel: Math.round(this.powerState.boostFuel),
      hull: Math.round(this.playerHull),
      maxHull: this.playerMaxHull,
      shield: Math.round(this.powerState.shieldLevel),
      maxShield: this.powerState.maxShield,
      laserHeat: Math.round(this.powerState.laserHeat),
      laserCapacitor: Math.round(this.powerState.laserCapacitor),
      viewMode: this.viewMode,
      targetInfo,
      dreadnoughtStage: this.dreadnoughtState.currentStage,
      dreadnoughtHp: Math.round(this.dreadnoughtState.overallHp),
      dreadnoughtMaxHp: this.dreadnoughtState.maxHp,
      squad: this.squadState,
      power: this.powerState,
      missileLocked: false,
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    sound.stopAtmosphericMusic();

    this.scene.clear();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
