/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PowerDistribution {
  engines: number; // 0 to 100
  weapons: number; // 0 to 100
  shields: number; // 0 to 100
}

export type PowerPreset = 'ENGINES' | 'WEAPONS' | 'SHIELDS' | 'BALANCED';

export interface PowerSystemState {
  current: PowerDistribution;
  target: PowerDistribution;
  preset: PowerPreset;
  laserCapacitor: number; // 0 - 100
  laserHeat: number; // 0 - 100
  shieldLevel: number; // 0 - 100
  maxShield: number;
  boostFuel: number; // 0 - 100
  overchargeTimer: number; // seconds remaining
  powerDumpCooldown: number;
}

export const POWER_PRESETS: Record<PowerPreset, PowerDistribution> = {
  ENGINES: { engines: 60, weapons: 20, shields: 20 },
  WEAPONS: { engines: 20, weapons: 60, shields: 20 },
  SHIELDS: { engines: 20, weapons: 20, shields: 60 },
  BALANCED: { engines: 33.33, weapons: 33.33, shields: 33.34 },
};

export function createInitialPowerState(): PowerSystemState {
  return {
    current: { ...POWER_PRESETS.BALANCED },
    target: { ...POWER_PRESETS.BALANCED },
    preset: 'BALANCED',
    laserCapacitor: 100,
    laserHeat: 0,
    shieldLevel: 100,
    maxShield: 100,
    boostFuel: 100,
    overchargeTimer: 0,
    powerDumpCooldown: 0,
  };
}

export function setPowerPreset(state: PowerSystemState, preset: PowerPreset): PowerSystemState {
  return {
    ...state,
    preset,
    target: { ...POWER_PRESETS[preset] },
  };
}

export function updatePowerSystem(state: PowerSystemState, dt: number): PowerSystemState {
  const lerpSpeed = 5.0 * dt;
  const current = {
    engines: state.current.engines + (state.target.engines - state.current.engines) * Math.min(lerpSpeed, 1),
    weapons: state.current.weapons + (state.target.weapons - state.current.weapons) * Math.min(lerpSpeed, 1),
    shields: state.current.shields + (state.target.shields - state.current.shields) * Math.min(lerpSpeed, 1),
  };

  // Laser recharge: scaled by weapon power
  const weaponRatio = current.weapons / 100;
  const isOvercharged = state.overchargeTimer > 0;
  const rechargeRate = isOvercharged ? 40 : 10 + weaponRatio * 25;
  const newCapacitor = Math.min(100, state.laserCapacitor + rechargeRate * dt);

  // Laser heat cooling
  const coolingRate = 15 + weaponRatio * 20;
  const newHeat = Math.max(0, state.laserHeat - coolingRate * dt);

  // Shield regeneration: scaled by shield power
  const shieldRatio = current.shields / 100;
  const shieldRegen = 2 + shieldRatio * 8;
  const newShield = Math.min(state.maxShield, state.shieldLevel + shieldRegen * dt);

  // Boost regeneration: scaled by engines power
  const engineRatio = current.engines / 100;
  const boostRegen = 8 + engineRatio * 16;
  const newBoost = Math.min(100, state.boostFuel + boostRegen * dt);

  return {
    ...state,
    current,
    laserCapacitor: newCapacitor,
    laserHeat: newHeat,
    shieldLevel: newShield,
    boostFuel: newBoost,
    overchargeTimer: Math.max(0, state.overchargeTimer - dt),
    powerDumpCooldown: Math.max(0, state.powerDumpCooldown - dt),
  };
}

/**
 * Emergency Core: Power Dump
 * Converts 50% of current shields into instant 100% boost fuel
 */
export function triggerPowerDump(state: PowerSystemState): { state: PowerSystemState; success: boolean } {
  if (state.powerDumpCooldown > 0 || state.shieldLevel < 15) {
    return { state, success: false };
  }
  const shieldCost = Math.min(state.shieldLevel, 40);
  return {
    state: {
      ...state,
      shieldLevel: state.shieldLevel - shieldCost,
      boostFuel: 100,
      powerDumpCooldown: 12, // 12s cooldown
    },
    success: true,
  };
}

/**
 * Emergency Core: Overcharge
 * Temporarily supercharges weapon output for 6 seconds at the cost of HUD glitch
 */
export function triggerOvercharge(state: PowerSystemState): { state: PowerSystemState; success: boolean } {
  if (state.overchargeTimer > 0) {
    return { state, success: false };
  }
  return {
    state: {
      ...state,
      overchargeTimer: 6.0,
      laserCapacitor: 100,
      laserHeat: 0,
    },
    success: true,
  };
}
