/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DamageSeverityStage = 'PRISTINE' | 'MINOR_STRESS' | 'MODERATE_FRACTURE' | 'CRITICAL_FAILURE';

export interface StructuralVibration {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  rollAngle: number;
  amplitude: number;
  intensity: number; // 0.0 to 1.0
}

/**
 * Calculates current structural damage severity stage based on hull percentage
 */
export function getDamageSeverityStage(hull: number, maxHull: number): DamageSeverityStage {
  const pct = Math.max(0, Math.min(100, (hull / maxHull) * 100));
  if (pct >= 85) return 'PRISTINE';
  if (pct >= 55) return 'MINOR_STRESS';
  if (pct >= 25) return 'MODERATE_FRACTURE';
  return 'CRITICAL_FAILURE';
}

/**
 * Computes trauma amplification multiplier based on remaining hull
 * As hull degrades, external impacts and explosion shocks induce more violent cabin rattling
 */
export function calculateTraumaAmplification(hull: number, maxHull: number): number {
  const damageRatio = Math.max(0, Math.min(1, (maxHull - hull) / maxHull));
  // At 100% hull = 1.0x; at 0% hull = 2.6x violent shake
  return 1.0 + Math.pow(damageRatio, 1.3) * 1.6;
}

/**
 * Computes continuous structural vibrations caused by airframe deformation and stabilizer flutter
 */
export function calculateStructuralVibration(
  hull: number,
  maxHull: number,
  timeSec: number,
  isCockpitView: boolean = true
): StructuralVibration {
  const damageRatio = Math.max(0, Math.min(1, (maxHull - hull) / maxHull));

  // If hull is above 85%, negligible structural vibration
  if (damageRatio < 0.15) {
    return {
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rollAngle: 0,
      amplitude: 0,
      intensity: 0,
    };
  }

  // Intensity scales non-linearly with damage
  const intensity = Math.pow((damageRatio - 0.15) / 0.85, 1.4);
  const viewMult = isCockpitView ? 1.0 : 0.6; // Cockpit feels vibrations more directly

  // Dual frequency vibration: high frequency engine chatter + lower resonance shudder
  const hiFreq = Math.sin(timeSec * 42.0) * 0.6 + Math.cos(timeSec * 58.0) * 0.4;
  const loFreq = Math.sin(timeSec * 16.0) * 0.7 + Math.sin(timeSec * 22.0) * 0.3;

  const maxOffset = 0.08 * viewMult * intensity;

  const offsetX = (hiFreq * 0.5 + loFreq * 0.5) * maxOffset;
  const offsetY = (Math.cos(timeSec * 36.0) * 0.6 + Math.sin(timeSec * 18.0) * 0.4) * maxOffset * 0.8;
  const offsetZ = Math.sin(timeSec * 50.0) * maxOffset * 0.4;
  const rollAngle = loFreq * 0.022 * viewMult * intensity;

  return {
    offsetX,
    offsetY,
    offsetZ,
    rollAngle,
    amplitude: maxOffset,
    intensity,
  };
}

/**
 * Returns dynamic canopy glass fracture parameters
 */
export function getCanopyFractureProps(hull: number, maxHull: number): {
  crackLevel: 0 | 1 | 2 | 3;
  opacity: number;
  glitchFrequency: number;
  alarmStrobeActive: boolean;
} {
  const pct = Math.max(0, Math.min(100, (hull / maxHull) * 100));
  if (pct >= 85) {
    return { crackLevel: 0, opacity: 0, glitchFrequency: 0, alarmStrobeActive: false };
  }
  if (pct >= 55) {
    // Minor peripheral cracks
    const op = 0.35 + ((85 - pct) / 30) * 0.3;
    return { crackLevel: 1, opacity: op, glitchFrequency: 0.1, alarmStrobeActive: false };
  }
  if (pct >= 25) {
    // Moderate spiderweb fractures
    const op = 0.65 + ((55 - pct) / 30) * 0.25;
    return { crackLevel: 2, opacity: op, glitchFrequency: 0.35, alarmStrobeActive: false };
  }
  // Critical failure - shattered glass and active red emergency strobe
  return { crackLevel: 3, opacity: 0.95, glitchFrequency: 0.8, alarmStrobeActive: true };
}
