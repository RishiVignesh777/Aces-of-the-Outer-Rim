/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDamageSeverityStage,
  calculateTraumaAmplification,
  calculateStructuralVibration,
  getCanopyFractureProps,
} from './damageEffects.ts';

test('DamageEffects: severity stages transition appropriately', () => {
  assert.equal(getDamageSeverityStage(100, 100), 'PRISTINE');
  assert.equal(getDamageSeverityStage(90, 100), 'PRISTINE');
  assert.equal(getDamageSeverityStage(70, 100), 'MINOR_STRESS');
  assert.equal(getDamageSeverityStage(40, 100), 'MODERATE_FRACTURE');
  assert.equal(getDamageSeverityStage(15, 100), 'CRITICAL_FAILURE');
  assert.equal(getDamageSeverityStage(0, 100), 'CRITICAL_FAILURE');
});

test('DamageEffects: trauma amplification increases monotonically with damage', () => {
  const ampPristine = calculateTraumaAmplification(100, 100);
  const ampModerate = calculateTraumaAmplification(50, 100);
  const ampCritical = calculateTraumaAmplification(10, 100);

  assert.equal(ampPristine, 1.0);
  assert.ok(ampModerate > ampPristine, 'Moderate damage should amplify trauma');
  assert.ok(ampCritical > ampModerate, 'Critical damage should further amplify trauma');
  assert.ok(ampCritical >= 2.0, 'Critical damage should exceed 2.0x trauma amplification');
});

test('DamageEffects: structural vibration is zero at full hull and intensifies at low hull', () => {
  const vibe100 = calculateStructuralVibration(100, 100, 1.0, true);
  assert.equal(vibe100.amplitude, 0);
  assert.equal(vibe100.intensity, 0);

  const vibe50 = calculateStructuralVibration(50, 100, 1.0, true);
  assert.ok(vibe50.amplitude > 0, '50% hull should produce measurable vibration amplitude');
  assert.ok(vibe50.intensity > 0.2, '50% hull should have non-zero intensity');

  const vibe15 = calculateStructuralVibration(15, 100, 1.0, true);
  assert.ok(vibe15.intensity > vibe50.intensity, '15% hull must vibrate significantly more than 50%');
  assert.ok(Math.abs(vibe15.rollAngle) > 0, 'Structural shudder should introduce subtle roll angular shake');
});

test('DamageEffects: canopy glass fractures scale with hull integrity', () => {
  const frac100 = getCanopyFractureProps(100, 100);
  assert.equal(frac100.crackLevel, 0);
  assert.equal(frac100.alarmStrobeActive, false);

  const frac70 = getCanopyFractureProps(70, 100);
  assert.equal(frac70.crackLevel, 1);
  assert.ok(frac70.opacity > 0.3);

  const frac40 = getCanopyFractureProps(40, 100);
  assert.equal(frac40.crackLevel, 2);

  const frac10 = getCanopyFractureProps(10, 100);
  assert.equal(frac10.crackLevel, 3);
  assert.equal(frac10.alarmStrobeActive, true);
});
