/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface FlightInput {
  throttle: number; // -1 (retro) to 1 (full forward)
  strafeX: number; // -1 (left) to 1 (right)
  strafeY: number; // -1 (down) to 1 (up)
  pitch: number; // -1 (down) to 1 (up)
  yaw: number; // -1 (left) to 1 (right)
  roll: number; // -1 (counter-clock) to 1 (clockwise)
  boost: boolean;
  flightAssist: boolean; // true = coupled, false = decoupled drift
}

export interface ShipPhysicsState {
  position: Vector3D;
  velocity: Vector3D;
  forward: Vector3D;
  up: Vector3D;
  right: Vector3D;
  speed: number;
  isDrifting: boolean;
  boostActive: boolean;
}

export function v3(x = 0, y = 0, z = 0): Vector3D {
  return { x, y, z };
}

export function add(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(v: Vector3D, s: number): Vector3D {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function lengthSq(v: Vector3D): number {
  return v.x * v.x + v.y * v.y + v.z * v.z;
}

export function length(v: Vector3D): number {
  return Math.sqrt(lengthSq(v));
}

export function normalize(v: Vector3D): Vector3D {
  const len = length(v);
  if (len < 0.00001) return { x: 0, y: 0, z: -1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function dot(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Calculates physics step with hybrid space flight and decoupled drift mechanics
 */
export function stepPhysics(
  state: ShipPhysicsState,
  input: FlightInput,
  dt: number,
  enginePowerMultiplier = 1.0,
  agilityMultiplier = 1.0
): ShipPhysicsState {
  const baseMaxSpeed = 75 * enginePowerMultiplier;
  const boostSpeed = baseMaxSpeed * 1.85;
  const maxSpeed = input.boost ? boostSpeed : baseMaxSpeed;

  const accel = (input.boost ? 140 : 65) * enginePowerMultiplier;
  const retroAccel = 50 * enginePowerMultiplier;
  const strafeAccel = 45 * agilityMultiplier;

  // Compute desired thrust vector in world space from ship basis vectors
  let thrustVector = v3(0, 0, 0);

  // Forward / Retro
  if (input.throttle > 0) {
    thrustVector = add(thrustVector, scale(state.forward, input.throttle * accel));
  } else if (input.throttle < 0) {
    thrustVector = add(thrustVector, scale(state.forward, input.throttle * retroAccel));
  }

  // Micro-thrusters (Lateral and Vertical strafe)
  if (input.strafeX !== 0) {
    thrustVector = add(thrustVector, scale(state.right, input.strafeX * strafeAccel));
  }
  if (input.strafeY !== 0) {
    thrustVector = add(thrustVector, scale(state.up, input.strafeY * strafeAccel));
  }

  let nextVelocity = add(state.velocity, scale(thrustVector, dt));

  // If Flight Assist is ON (Coupled mode):
  // Flight computer aligns velocity vector toward ship forward and applies linear drag
  if (input.flightAssist) {
    // Project velocity onto forward
    const forwardSpeed = dot(nextVelocity, state.forward);
    // Damp lateral drift
    const lateralVel = sub(nextVelocity, scale(state.forward, forwardSpeed));
    const lateralDamping = Math.exp(-4.5 * dt);
    const dampedLateral = scale(lateralVel, lateralDamping);

    // If no throttle input, bring forward speed to 0 gradually
    let targetForward = forwardSpeed;
    if (Math.abs(input.throttle) < 0.05 && input.strafeX === 0 && input.strafeY === 0) {
      targetForward *= Math.exp(-1.5 * dt);
    }

    nextVelocity = add(scale(state.forward, targetForward), dampedLateral);
  } else {
    // Flight Assist is OFF (Decoupled Drift Mode):
    // True Newtonian space inertia! Velocity vector is preserved regardless of ship rotation.
    // Very subtle cosmic space friction to prevent numerical explosion
    nextVelocity = scale(nextVelocity, Math.exp(-0.02 * dt));
  }

  // Speed clamp
  const curSpeed = length(nextVelocity);
  if (curSpeed > maxSpeed) {
    nextVelocity = scale(nextVelocity, maxSpeed / curSpeed);
  }

  const nextPos = add(state.position, scale(nextVelocity, dt));

  // Check if drifting: angle between forward direction and velocity vector > 25 degrees
  let isDrifting = false;
  if (curSpeed > 10) {
    const velDir = scale(nextVelocity, 1 / curSpeed);
    const forwardAlign = dot(velDir, state.forward);
    if (forwardAlign < 0.88) {
      isDrifting = true;
    }
  }

  return {
    ...state,
    position: nextPos,
    velocity: nextVelocity,
    speed: curSpeed,
    isDrifting,
    boostActive: input.boost && curSpeed > 30,
  };
}
