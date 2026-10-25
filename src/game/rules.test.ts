/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialPowerState,
  setPowerPreset,
  updatePowerSystem,
  triggerPowerDump,
  triggerOvercharge,
} from './powerSystem.ts';
import {
  v3,
  stepPhysics,
  type ShipPhysicsState,
  type FlightInput,
} from './physics.ts';
import {
  createInitialDreadnought,
  damageSubsystem,
} from './dreadnought.ts';
import {
  createInitialSquad,
  issueSquadOrder,
} from './squad.ts';

test('PowerSystem: presets configure power triangle correctly', () => {
  let state = createInitialPowerState();
  assert.equal(state.preset, 'BALANCED');

  state = setPowerPreset(state, 'ENGINES');
  assert.equal(state.preset, 'ENGINES');
  assert.equal(state.target.engines, 60);
  assert.equal(state.target.weapons, 20);
  assert.equal(state.target.shields, 20);

  // Update over 1 second should lerp current towards target
  state = updatePowerSystem(state, 1.0);
  assert.ok(state.current.engines > 45, 'Engines power should have increased significantly');
});

test('PowerSystem: Emergency Power Dump trades shield for full boost', () => {
  let state = createInitialPowerState();
  state.shieldLevel = 80;
  state.boostFuel = 10;

  const res = triggerPowerDump(state);
  assert.equal(res.success, true);
  assert.equal(res.state.boostFuel, 100);
  assert.ok(res.state.shieldLevel < 80);
  assert.ok(res.state.powerDumpCooldown > 0);
});

test('PowerSystem: Emergency Overcharge activates temporary laser supercharge', () => {
  let state = createInitialPowerState();
  const res = triggerOvercharge(state);
  assert.equal(res.success, true);
  assert.equal(res.state.overchargeTimer, 6.0);
});

test('Physics: Decoupled flight mode preserves drift velocity during rotation', () => {
  let shipState: ShipPhysicsState = {
    position: v3(0, 0, 0),
    velocity: v3(0, 0, -50), // Moving along -Z (forward)
    forward: v3(0, 0, -1),
    up: v3(0, 1, 0),
    right: v3(1, 0, 0),
    speed: 50,
    isDrifting: false,
    boostActive: false,
  };

  // Turn ship 180 degrees backward (forward is now +Z) with Flight Assist OFF
  shipState.forward = v3(0, 0, 1);

  const input: FlightInput = {
    throttle: 0,
    strafeX: 0,
    strafeY: 0,
    pitch: 0,
    yaw: 0,
    roll: 0,
    boost: false,
    flightAssist: false, // DECOUPLED DRIFT
  };

  const next = stepPhysics(shipState, input, 0.5);
  // Velocity along -Z should still be largely preserved (drifting backward!)
  assert.ok(next.velocity.z < -45, 'Drift velocity along original momentum vector should remain high');
  assert.equal(next.isDrifting, true, 'Ship should be flagged as drifting since velocity opposes forward');
});

test('Dreadnought: Multi-stage subsystem damage progression', () => {
  let dreadnought = createInitialDreadnought();
  assert.equal(dreadnought.currentStage, 'STAGE_1_SHIELDS');
  assert.equal(dreadnought.shieldActive, true);
  assert.equal(dreadnought.bridgeVulnerable, false);

  // Destroy Port Dome
  let res = damageSubsystem(dreadnought, 'shield_dome_port', 300);
  assert.ok(res.justDestroyedSubsystem !== null);
  dreadnought = res.state;
  assert.equal(dreadnought.currentStage, 'STAGE_1_SHIELDS'); // Still need Starboard

  // Destroy Starboard Dome
  res = damageSubsystem(dreadnought, 'shield_dome_starboard', 300);
  dreadnought = res.state;
  assert.equal(res.stageAdvanced, true);
  assert.equal(dreadnought.currentStage, 'STAGE_2_TURRETS');
  assert.equal(dreadnought.shieldActive, false);
});

test('Squad: Tactical orders update squad state and radio comms', () => {
  let squad = createInitialSquad();
  assert.equal(squad.currentOrder, 'FREE_HUNT');

  squad = issueSquadOrder(squad, 'COVER_SIX');
  assert.equal(squad.currentOrder, 'COVER_SIX');
  assert.ok(squad.lastRadioMessage?.text.includes('watching your six') || squad.lastRadioMessage?.text.includes('Watching'));
});
