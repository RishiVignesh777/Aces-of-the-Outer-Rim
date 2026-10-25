/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SquadOrder = 'COVER_SIX' | 'FOCUS_TARGET' | 'FREE_HUNT';

export interface Wingman {
  id: string;
  callsign: string;
  pilotName: string;
  role: 'DOGFIGHTER' | 'SHIELD_SUPPORT';
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  status: 'ACTIVE' | 'DAMAGED' | 'EJECTED';
  targetEnemyId: string | null;
  kills: number;
}

export interface SquadState {
  currentOrder: SquadOrder;
  wingmen: Wingman[];
  lastRadioMessage: {
    sender: string;
    text: string;
    timestamp: number;
  } | null;
}

export function createInitialSquad(): SquadState {
  return {
    currentOrder: 'FREE_HUNT',
    wingmen: [
      {
        id: 'wing_vex',
        callsign: 'Shadow-2',
        pilotName: 'Lt. Vex "Ghost" Korr',
        role: 'DOGFIGHTER',
        hp: 120,
        maxHp: 120,
        shield: 80,
        maxShield: 80,
        status: 'ACTIVE',
        targetEnemyId: null,
        kills: 0,
      },
      {
        id: 'wing_kira',
        callsign: 'Shadow-3',
        pilotName: 'Cpt. Kira Vos',
        role: 'SHIELD_SUPPORT',
        hp: 140,
        maxHp: 140,
        shield: 100,
        maxShield: 100,
        status: 'ACTIVE',
        targetEnemyId: null,
        kills: 0,
      },
    ],
    lastRadioMessage: {
      sender: 'Shadow-Lead',
      text: 'Shadow Squadron, weapons hot. Planetary ring ingress confirmed.',
      timestamp: Date.now(),
    },
  };
}

export function issueSquadOrder(state: SquadState, order: SquadOrder, playerLockedTargetId?: string): SquadState {
  let responseText = '';
  if (order === 'COVER_SIX') {
    responseText = 'Shadow-2 copy! Forming up on your tail. Watching your six!';
  } else if (order === 'FOCUS_TARGET') {
    responseText = playerLockedTargetId
      ? 'Shadow-3 acquiring your telemetry lock. Engaging designated target!'
      : 'Shadow Lead, no target lock designated. Scanning perimeter!';
  } else {
    responseText = 'Shadow flight breaking formation. Free hunt engaged, let them burn!';
  }

  const updatedWingmen = state.wingmen.map((w) => ({
    ...w,
    targetEnemyId: order === 'FOCUS_TARGET' && playerLockedTargetId ? playerLockedTargetId : w.targetEnemyId,
  }));

  return {
    ...state,
    currentOrder: order,
    wingmen: updatedWingmen,
    lastRadioMessage: {
      sender: order === 'COVER_SIX' ? 'Shadow-2 (Vex)' : 'Shadow-3 (Kira)',
      text: responseText,
      timestamp: Date.now(),
    },
  };
}
