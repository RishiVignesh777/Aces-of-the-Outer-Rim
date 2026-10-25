/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DreadnoughtStage =
  | 'STAGE_1_SHIELDS' // Shield generator domes active
  | 'STAGE_2_TURRETS' // Flak turrets defense grid
  | 'STAGE_3_ENGINES' // Sub-light ion engine manifolds
  | 'STAGE_4_BRIDGE' // Thermal exhaust trench run
  | 'DESTROYED';

export interface CapitalSubsystem {
  id: string;
  name: string;
  stage: number;
  maxHp: number;
  hp: number;
  destroyed: boolean;
  positionOffset: { x: number; y: number; z: number };
  radius: number;
}

export interface DreadnoughtState {
  currentStage: DreadnoughtStage;
  subsystems: CapitalSubsystem[];
  overallHp: number;
  maxHp: number;
  shieldActive: boolean;
  bridgeVulnerable: boolean;
  destroyedAt: number | null;
}

export function createInitialDreadnought(): DreadnoughtState {
  const subsystems: CapitalSubsystem[] = [
    // Stage 1: Shield Generator Domes
    {
      id: 'shield_dome_port',
      name: 'Port Deflector Dome',
      stage: 1,
      maxHp: 250,
      hp: 250,
      destroyed: false,
      positionOffset: { x: -35, y: 18, z: 20 },
      radius: 12,
    },
    {
      id: 'shield_dome_starboard',
      name: 'Starboard Deflector Dome',
      stage: 1,
      maxHp: 250,
      hp: 250,
      destroyed: false,
      positionOffset: { x: 35, y: 18, z: 20 },
      radius: 12,
    },
    // Stage 2: Heavy Flak Turrets
    {
      id: 'turret_flak_1',
      name: 'Dorsal Heavy Flak #1',
      stage: 2,
      maxHp: 180,
      hp: 180,
      destroyed: false,
      positionOffset: { x: -18, y: 10, z: -40 },
      radius: 8,
    },
    {
      id: 'turret_flak_2',
      name: 'Dorsal Heavy Flak #2',
      stage: 2,
      maxHp: 180,
      hp: 180,
      destroyed: false,
      positionOffset: { x: 18, y: 10, z: -40 },
      radius: 8,
    },
    {
      id: 'turret_flak_3',
      name: 'Ventral Defense Battery #1',
      stage: 2,
      maxHp: 180,
      hp: 180,
      destroyed: false,
      positionOffset: { x: -20, y: -10, z: 10 },
      radius: 8,
    },
    {
      id: 'turret_flak_4',
      name: 'Ventral Defense Battery #2',
      stage: 2,
      maxHp: 180,
      hp: 180,
      destroyed: false,
      positionOffset: { x: 20, y: -10, z: 10 },
      radius: 8,
    },
    // Stage 3: Sub-light Engine Manifolds
    {
      id: 'engine_manifold_port',
      name: 'Port Sub-light Reactor',
      stage: 3,
      maxHp: 320,
      hp: 320,
      destroyed: false,
      positionOffset: { x: -25, y: 0, z: 120 },
      radius: 14,
    },
    {
      id: 'engine_manifold_starboard',
      name: 'Starboard Sub-light Reactor',
      stage: 3,
      maxHp: 320,
      hp: 320,
      destroyed: false,
      positionOffset: { x: 25, y: 0, z: 120 },
      radius: 14,
    },
    // Stage 4: Bridge Thermal Vent
    {
      id: 'bridge_thermal_vent',
      name: 'Command Bridge Thermal Exhaust',
      stage: 4,
      maxHp: 400,
      hp: 400,
      destroyed: false,
      positionOffset: { x: 0, y: 22, z: -60 },
      radius: 10,
    },
  ];

  const totalSubHp = subsystems.reduce((acc, s) => acc + s.maxHp, 0);

  return {
    currentStage: 'STAGE_1_SHIELDS',
    subsystems,
    overallHp: totalSubHp,
    maxHp: totalSubHp,
    shieldActive: true,
    bridgeVulnerable: false,
    destroyedAt: null,
  };
}

export function damageSubsystem(
  state: DreadnoughtState,
  subsystemId: string,
  damage: number
): {
  state: DreadnoughtState;
  justDestroyedSubsystem: CapitalSubsystem | null;
  stageAdvanced: boolean;
} {
  let justDestroyedSubsystem: CapitalSubsystem | null = null;
  let stageAdvanced = false;

  const nextSubsystems = state.subsystems.map((sub) => {
    if (sub.id !== subsystemId || sub.destroyed) return sub;

    // Stage validation: cannot damage subsystem if prerequisites not completed
    if (sub.stage === 2 && state.shieldActive) {
      // Deflector shield reduces incoming damage by 85%
      damage *= 0.15;
    }
    if (sub.stage === 4 && !state.bridgeVulnerable) {
      // Bridge vent invulnerable until engines destroyed
      damage = 0;
    }

    const nextHp = Math.max(0, sub.hp - damage);
    const destroyed = nextHp <= 0;
    if (destroyed && !sub.destroyed) {
      justDestroyedSubsystem = { ...sub, hp: 0, destroyed: true };
    }
    return { ...sub, hp: nextHp, destroyed };
  });

  // Calculate current stage status
  const stage1Done = nextSubsystems
    .filter((s) => s.stage === 1)
    .every((s) => s.destroyed);
  const stage2Done = nextSubsystems
    .filter((s) => s.stage === 2)
    .every((s) => s.destroyed);
  const stage3Done = nextSubsystems
    .filter((s) => s.stage === 3)
    .every((s) => s.destroyed);
  const stage4Done = nextSubsystems
    .filter((s) => s.stage === 4)
    .every((s) => s.destroyed);

  let nextStage = state.currentStage;
  if (stage4Done) {
    nextStage = 'DESTROYED';
  } else if (stage3Done) {
    nextStage = 'STAGE_4_BRIDGE';
  } else if (stage2Done) {
    nextStage = 'STAGE_3_ENGINES';
  } else if (stage1Done) {
    nextStage = 'STAGE_2_TURRETS';
  }

  if (nextStage !== state.currentStage) {
    stageAdvanced = true;
  }

  const remainingHp = nextSubsystems.reduce((acc, s) => acc + s.hp, 0);

  return {
    state: {
      ...state,
      currentStage: nextStage,
      subsystems: nextSubsystems,
      overallHp: remainingHp,
      shieldActive: !stage1Done,
      bridgeVulnerable: stage3Done,
      destroyedAt: nextStage === 'DESTROYED' && !state.destroyedAt ? Date.now() : state.destroyedAt,
    },
    justDestroyedSubsystem,
    stageAdvanced,
  };
}
