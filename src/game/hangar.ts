/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WeaponHardpoint {
  id: string;
  name: string;
  type: 'PRIMARY' | 'SECONDARY';
  description: string;
  damage: number;
  fireRate: number; // shots per sec
  velocity: number;
  heatPerShot: number;
  shieldBonus: number; // multiplier against shields
  ammoMax?: number;
  color: string;
}

export interface SubsystemModule {
  id: string;
  name: string;
  slot: 'PROPULSION' | 'DEFENSE' | 'AVIONICS';
  description: string;
  statBonus: string;
  speedMult?: number;
  hullBonus?: number;
  shieldBonus?: number;
  radarRangeBonus?: number;
}

export interface LiveryOption {
  id: string;
  name: string;
  hullColor: string; // hex
  accentColor: string; // hex
  glowColor: string; // hex
  cockpitGlassColor: string;
}

export interface PilotPerk {
  id: string;
  branch: 'ACE_AVIATOR' | 'FLEET_TACTICS' | 'SYSTEMS_ENG';
  name: string;
  description: string;
  unlocked: boolean;
  cost: number;
}

export interface HangarLoadout {
  primaryWeaponId: string;
  secondaryWeaponId: string;
  selectedModuleId: string;
  selectedLiveryId: string;
  unlockedPerkIds: string[];
  reqCredits: number;
}

export const PRIMARY_WEAPONS: WeaponHardpoint[] = [
  {
    id: 'plasma_dual',
    name: 'Dual Linked Plasma Cannons',
    type: 'PRIMARY',
    description: 'High-frequency particle bolts with balanced range and thermal dissipation.',
    damage: 28,
    fireRate: 6.5,
    velocity: 280,
    heatPerShot: 7,
    shieldBonus: 1.0,
    color: '#38bdf8',
  },
  {
    id: 'heavy_ion',
    name: 'Twin Ion Disruptor Cannons',
    type: 'PRIMARY',
    description: 'Devastating against capital deflector shields and electrical subsystems.',
    damage: 22,
    fireRate: 4.5,
    velocity: 260,
    heatPerShot: 9,
    shieldBonus: 2.2,
    color: '#818cf8',
  },
  {
    id: 'scatter_rotary',
    name: 'Rotary Vulcan Flak Cannon',
    type: 'PRIMARY',
    description: 'High-RPM kinetic rounds designed to shred agile interceptors at close range.',
    damage: 18,
    fireRate: 11.0,
    velocity: 320,
    heatPerShot: 5,
    shieldBonus: 0.8,
    color: '#fbbf24',
  },
];

export const SECONDARY_WEAPONS: WeaponHardpoint[] = [
  {
    id: 'heavy_torpedo',
    name: 'Proton Concussion Torpedoes',
    type: 'SECONDARY',
    description: 'Heavy armor-piercing warheads built to crack dreadnought hardpoints.',
    damage: 180,
    fireRate: 0.8,
    velocity: 150,
    heatPerShot: 0,
    shieldBonus: 1.2,
    ammoMax: 8,
    color: '#f97316',
  },
  {
    id: 'swarm_missiles',
    name: 'Cluster Swarm Micro-Rockets',
    type: 'SECONDARY',
    description: 'Quad salvo tracking rockets for multi-target interceptor engagements.',
    damage: 55,
    fireRate: 2.0,
    velocity: 190,
    heatPerShot: 0,
    shieldBonus: 1.0,
    ammoMax: 16,
    color: '#ec4899',
  },
];

export const SUBSYSTEM_MODULES: SubsystemModule[] = [
  {
    id: 'mod_overclock_thruster',
    name: 'Overclocked Ion Boosters',
    slot: 'PROPULSION',
    description: 'Unlocks high-G vector drift acceleration and +25% maximum boost velocity.',
    statBonus: '+25% Boost Velocity · +15% Drift Agility',
    speedMult: 1.25,
  },
  {
    id: 'mod_durasteel_plating',
    name: 'Reinforced Durasteel Plating',
    slot: 'DEFENSE',
    description: 'Heavy layered composite plating increasing total hull structural integrity.',
    statBonus: '+50 Maximum Hull Points · -5% Top Speed',
    hullBonus: 50,
  },
  {
    id: 'mod_kinetic_deflector',
    name: 'Phase Deflector Matrix',
    slot: 'DEFENSE',
    description: 'Advanced magnetic energy weave providing enhanced shield capacitance.',
    statBonus: '+40 Maximum Shield Capacity · +25% Shield Recharge',
    shieldBonus: 40,
  },
];

export const LIVERIES: LiveryOption[] = [
  {
    id: 'void_stealth',
    name: 'Void Stealth (Black / Cyan)',
    hullColor: '#18181b',
    accentColor: '#06b6d4',
    glowColor: '#22d3ee',
    cockpitGlassColor: '#083344',
  },
  {
    id: 'corsair_crimson',
    name: 'Outer Rim Corsair (Charcoal / Crimson)',
    hullColor: '#27272a',
    accentColor: '#dc2626',
    glowColor: '#ef4444',
    cockpitGlassColor: '#450a0a',
  },
  {
    id: 'republic_titanium',
    name: 'Titanium Cobalt (Silver / Royal Blue)',
    hullColor: '#71717a',
    accentColor: '#2563eb',
    glowColor: '#60a5fa',
    cockpitGlassColor: '#172554',
  },
  {
    id: 'solar_flare',
    name: 'Solar Flare (White / Hazard Orange)',
    hullColor: '#e4e4e7',
    accentColor: '#ea580c',
    glowColor: '#fb923c',
    cockpitGlassColor: '#431407',
  },
];

export const PILOT_PERKS: PilotPerk[] = [
  {
    id: 'perk_ace_drift',
    branch: 'ACE_AVIATOR',
    name: 'Vector Drift Mastery',
    description: 'Flight Assist Off rotation speed increased by 30% without angular wobble.',
    unlocked: true,
    cost: 0,
  },
  {
    id: 'perk_fleet_sync',
    branch: 'FLEET_TACTICS',
    name: 'Wingmen Tactical Focus',
    description: 'Squad mates deal +35% damage to locked focus targets and cover closer.',
    unlocked: true,
    cost: 0,
  },
  {
    id: 'perk_energy_shunt',
    branch: 'SYSTEMS_ENG',
    name: 'Rapid Shunt Capacitance',
    description: 'Power Triangle distribution shifts 50% faster with zero energy loss.',
    unlocked: true,
    cost: 0,
  },
];

export function getDefaultLoadout(): HangarLoadout {
  return {
    primaryWeaponId: PRIMARY_WEAPONS[0].id,
    secondaryWeaponId: SECONDARY_WEAPONS[0].id,
    selectedModuleId: SUBSYSTEM_MODULES[0].id,
    selectedLiveryId: LIVERIES[0].id,
    unlockedPerkIds: ['perk_ace_drift', 'perk_fleet_sync', 'perk_energy_shunt'],
    reqCredits: 450,
  };
}
