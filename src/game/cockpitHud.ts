/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface RadarContact {
  x: number;
  y: number;
  z: number;
  type: 'ENEMY' | 'ALLY' | 'DREADNOUGHT' | 'SUBSYSTEM';
}

/**
 * Creates a glowing 3D holographic wireframe radar globe mounted on the cockpit dashboard
 */
export function createHoloRadarGlobe(): {
  radarGroup: THREE.Group;
  blipPoints: THREE.Points;
  blipGeo: THREE.BufferGeometry;
  updateContacts: (contacts: RadarContact[], playerPos: { x: number; y: number; z: number }) => void;
} {
  const radarGroup = new THREE.Group();

  // Wireframe holographic sphere
  const sphereGeo = new THREE.SphereGeometry(0.22, 12, 8);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const sphere = new THREE.Mesh(sphereGeo, wireMat);
  radarGroup.add(sphere);

  // Radar equator and polar rings
  const ringGeo = new THREE.RingGeometry(0.21, 0.22, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotateX(Math.PI / 2);
  radarGroup.add(ring);

  // Player center icon (tiny cyan chevron)
  const chevronGeo = new THREE.ConeGeometry(0.02, 0.04, 3);
  chevronGeo.rotateX(Math.PI / 2);
  const chevronMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const playerBlip = new THREE.Mesh(chevronGeo, chevronMat);
  radarGroup.add(playerBlip);

  // Dynamic Contact Blips (Points buffer)
  const maxContacts = 48;
  const positions = new Float32Array(maxContacts * 3);
  const colors = new Float32Array(maxContacts * 3);

  const blipGeo = new THREE.BufferGeometry();
  blipGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  blipGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const blipMat = new THREE.PointsMaterial({
    size: 0.025,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });

  const blipPoints = new THREE.Points(blipGeo, blipMat);
  radarGroup.add(blipPoints);

  const radarRange = 400; // meters represented inside 0.2m radius

  const updateContacts = (contacts: RadarContact[], playerPos: { x: number; y: number; z: number }) => {
    const posAttr = blipGeo.attributes.position as THREE.BufferAttribute;
    const colAttr = blipGeo.attributes.color as THREE.BufferAttribute;
    const pArr = posAttr.array as Float32Array;
    const cArr = colAttr.array as Float32Array;

    const count = Math.min(contacts.length, maxContacts);

    for (let i = 0; i < count; i++) {
      const c = contacts[i];
      const dx = c.x - playerPos.x;
      const dy = c.y - playerPos.y;
      const dz = c.z - playerPos.z;

      // Scale down to radar radius (0.2m)
      const scale = 0.2 / radarRange;
      const rx = THREE.MathUtils.clamp(dx * scale, -0.2, 0.2);
      const ry = THREE.MathUtils.clamp(dy * scale, -0.2, 0.2);
      const rz = THREE.MathUtils.clamp(dz * scale, -0.2, 0.2);

      pArr[i * 3] = rx;
      pArr[i * 3 + 1] = ry;
      pArr[i * 3 + 2] = rz;

      if (c.type === 'ENEMY') {
        // Red
        cArr[i * 3] = 0.95;
        cArr[i * 3 + 1] = 0.2;
        cArr[i * 3 + 2] = 0.2;
      } else if (c.type === 'ALLY') {
        // Cyan / Blue
        cArr[i * 3] = 0.2;
        cArr[i * 3 + 1] = 0.8;
        cArr[i * 3 + 2] = 1.0;
      } else if (c.type === 'SUBSYSTEM') {
        // Amber / Yellow
        cArr[i * 3] = 0.95;
        cArr[i * 3 + 1] = 0.7;
        cArr[i * 3 + 2] = 0.1;
      } else {
        // Dreadnought purple
        cArr[i * 3] = 0.7;
        cArr[i * 3 + 1] = 0.3;
        cArr[i * 3 + 2] = 0.9;
      }
    }

    // Zero out unused slots
    for (let i = count; i < maxContacts; i++) {
      pArr[i * 3] = 0;
      pArr[i * 3 + 1] = 999;
      pArr[i * 3 + 2] = 0;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  };

  return { radarGroup, blipPoints, blipGeo, updateContacts };
}
