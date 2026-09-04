import * as THREE from "three";
import { BALLOON_PALETTES, WORLD } from "./config.js";
import { createFabricTextureSet } from "./materials.js";
import { seededRandom } from "./noise.js";
import { terrainHeight } from "./geology.js";

const fabricTextureCache = new Map();

function cachedFabricTextures(patternIndex, detail) {
  const paletteIndex = patternIndex % BALLOON_PALETTES.length;
  const key = `${paletteIndex}-${detail}`;
  if (!fabricTextureCache.has(key)) {
    const size = detail === "hero" ? 384 : detail === "mid" ? 192 : 96;
    fabricTextureCache.set(key, createFabricTextureSet(BALLOON_PALETTES[paletteIndex], paletteIndex, size));
  }
  return fabricTextureCache.get(key);
}

function envelopeRadius(t, seed) {
  const core = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.92)), 0.61);
  const shoulder = 0.18 * Math.exp(-Math.pow((t - 0.68) / 0.18, 2));
  const mouth = 0.07 + 0.11 * (1 - t);
  return Math.max(mouth, core + shoulder) * (1 + 0.014 * Math.sin(t * 33 + seed));
}

function createEnvelopeGeometry(seed, radialSegments = 64, heightSegments = 44) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let row = 0; row <= heightSegments; row += 1) {
    const t = row / heightSegments;
    const y = 5.1 + t * 20.8;
    for (let column = 0; column <= radialSegments; column += 1) {
      const theta = (column / radialSegments) * Math.PI * 2;
      const panelRidge = 1 + 0.012 * Math.cos(theta * 24);
      const wrinkle = 1 + 0.006 * Math.sin(theta * 7 + t * 41 + seed);
      const asymmetry = 1 + 0.015 * Math.cos(theta - seed * 0.31) * Math.sin(t * Math.PI);
      const radius = 7.65 * envelopeRadius(t, seed) * panelRidge * wrinkle * asymmetry;
      positions.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
      uvs.push(column / radialSegments, 1 - t);
    }
  }
  for (let row = 0; row < heightSegments; row += 1) {
    for (let column = 0; column < radialSegments; column += 1) {
      const a = row * (radialSegments + 1) + column;
      const b = a + radialSegments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createTaperedBasketGeometry(widthTop = 2.8, widthBottom = 2.45, depthTop = 2.35, depthBottom = 2.06, height = 1.85) {
  const y0 = 0;
  const y1 = height;
  const vertices = [
    -widthBottom / 2, y0, -depthBottom / 2, widthBottom / 2, y0, -depthBottom / 2,
    widthBottom / 2, y0, depthBottom / 2, -widthBottom / 2, y0, depthBottom / 2,
    -widthTop / 2, y1, -depthTop / 2, widthTop / 2, y1, -depthTop / 2,
    widthTop / 2, y1, depthTop / 2, -widthTop / 2, y1, depthTop / 2,
  ];
  const indices = [0, 1, 4, 1, 5, 4, 1, 2, 5, 2, 6, 5, 2, 3, 6, 3, 7, 6, 3, 0, 7, 0, 4, 7, 0, 3, 2, 0, 2, 1];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function tubeBetween(start, end, radius, material, radialSegments = 7) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  return mesh;
}

function createBasket(materials, detailed) {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(createTaperedBasketGeometry(), materials.wicker);
  shell.castShadow = true;
  shell.receiveShadow = true;
  shell.userData.pbrMaterial = materials.wicker;
  group.add(shell);
  if (!detailed) return group;

  const reedMaterial = materials.wickerDark;
  const verticalCount = 12;
  for (let side = 0; side < 4; side += 1) {
    for (let index = 0; index < verticalCount; index += 1) {
      const u = (index + 0.5) / verticalCount - 0.5;
      let bottom;
      let top;
      if (side < 2) {
        const zSign = side === 0 ? -1 : 1;
        bottom = new THREE.Vector3(u * 2.45, 0.05, zSign * 1.035);
        top = new THREE.Vector3(u * 2.8, 1.82, zSign * 1.18);
      } else {
        const xSign = side === 2 ? -1 : 1;
        bottom = new THREE.Vector3(xSign * 1.23, 0.05, u * 2.06);
        top = new THREE.Vector3(xSign * 1.4, 1.82, u * 2.35);
      }
      group.add(tubeBetween(bottom, top, 0.025, reedMaterial, 5));
    }
  }
  for (let level = 0; level < 9; level += 1) {
    const y = 0.13 + level * 0.205;
    const mix = y / 1.85;
    const halfX = THREE.MathUtils.lerp(1.225, 1.4, mix);
    const halfZ = THREE.MathUtils.lerp(1.03, 1.175, mix);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-halfX, y, -halfZ), new THREE.Vector3(halfX, y, -halfZ),
      new THREE.Vector3(halfX, y, halfZ), new THREE.Vector3(-halfX, y, halfZ),
      new THREE.Vector3(-halfX, y, -halfZ),
    ], true, "catmullrom", 0.02);
    const band = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, level === 8 ? 0.07 : 0.035, 5, true), level === 8 ? materials.wickerRim : reedMaterial);
    band.castShadow = true;
    group.add(band);
  }
  return group;
}

function createBurnerAssembly(materials, detailed) {
  const group = new THREE.Group();
  group.position.y = 2.05;
  const frameMaterial = materials.metal;
  const corners = [[-0.86, -0.68], [0.86, -0.68], [0.86, 0.68], [-0.86, 0.68]];
  corners.forEach(([x, z]) => group.add(tubeBetween(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, 2.7, z), 0.055, frameMaterial, 8)));
  for (let side = 0; side < 4; side += 1) {
    const current = corners[side];
    const next = corners[(side + 1) % 4];
    group.add(tubeBetween(new THREE.Vector3(current[0], 2.65, current[1]), new THREE.Vector3(next[0], 2.65, next[1]), 0.055, frameMaterial, 8));
  }
  const flameMeshes = [];
  [-0.34, 0.34].forEach((x) => {
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.7, 16, 2), frameMaterial);
    burner.position.set(x, 2.55, 0);
    burner.castShadow = true;
    group.add(burner);
    const flame = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.9, 7, 12), materials.flame);
    flame.position.set(x, 3.35, 0);
    flame.scale.y = 0.01;
    flame.visible = false;
    group.add(flame);
    flameMeshes.push(flame);
  });
  if (detailed) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.92, 16), materials.tank);
    tank.position.set(0.86, 0.46, 0.46);
    tank.castShadow = true;
    group.add(tank);
  }
  return { group, flameMeshes };
}

function createRigging(group, materials, detailed) {
  const lower = [[-1.25, 3.9, -0.95], [1.25, 3.9, -0.95], [1.25, 3.9, 0.95], [-1.25, 3.9, 0.95]];
  const upper = [[-2.7, 7.3, -1.9], [2.7, 7.3, -1.9], [2.7, 7.3, 1.9], [-2.7, 7.3, 1.9]];
  lower.forEach((point, index) => {
    const a = new THREE.Vector3(...point);
    const b = new THREE.Vector3(...upper[index]);
    group.add(tubeBetween(a, b, detailed ? 0.038 : 0.028, materials.rope, 6));
    if (detailed) {
      const c = b.clone().multiply(new THREE.Vector3(1.18, 1, 1.18));
      c.y = 9.6;
      group.add(tubeBetween(b, c, 0.025, materials.rope, 5));
    }
  });
}

export function createBalloonVisual(patternIndex, materials, detail = "hero") {
  const detailed = detail === "hero";
  const rigged = detail !== "far";
  const group = new THREE.Group();
  const textures = cachedFabricTextures(patternIndex, detail);
  const fabric = new THREE.MeshPhysicalMaterial({
    map: textures.color,
    normalMap: textures.normal,
    normalScale: new THREE.Vector2(0.34, 0.34),
    roughness: 0.76,
    metalness: 0,
    side: THREE.DoubleSide,
    sheen: 0.45,
    sheenRoughness: 0.88,
    sheenColor: new THREE.Color("#ffd8ab"),
    emissive: new THREE.Color("#2b1810"),
    emissiveIntensity: 0.08,
  });
  const envelope = new THREE.Mesh(createEnvelopeGeometry(71 + patternIndex * 17, detailed ? 64 : rigged ? 32 : 20, detailed ? 44 : rigged ? 25 : 15), fabric);
  envelope.castShadow = true;
  envelope.receiveShadow = true;
  envelope.userData.pbrMaterial = fabric;
  group.add(envelope);

  const basket = createBasket(materials, detailed);
  basket.position.y = 0.15;
  group.add(basket);
  let flameMeshes = [];
  if (rigged) {
    const burners = createBurnerAssembly(materials, detailed);
    group.add(burners.group);
    createRigging(group, materials, detailed);
    flameMeshes = burners.flameMeshes;
  }

  if (detailed) {
    for (let seam = 0; seam < 24; seam += 1) {
      const theta = (seam / 24) * Math.PI * 2;
      const points = [];
      for (let step = 2; step <= 30; step += 1) {
        const t = step / 32;
        const radius = 7.65 * envelopeRadius(t, 71 + patternIndex * 17) * 1.014;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 5.1 + t * 20.8, Math.sin(theta) * radius));
      }
      const seamMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 34, 0.026, 4, false), materials.seam);
      seamMesh.castShadow = true;
      seamMesh.userData.detailOnly = true;
      group.add(seamMesh);
    }
  }

  group.userData.textures = textures;
  group.userData.fabric = fabric;
  return { group, flameMeshes };
}

export function windAtAltitude(altitude, elapsedSeconds) {
  const directionDegrees = 68 + 7 * Math.tanh((altitude - 150) / 210);
  const direction = THREE.MathUtils.degToRad(directionDegrees);
  const speed = 2.35 + 0.0045 * Math.max(altitude, 0) + 0.16 * Math.sin(elapsedSeconds * 0.055 + altitude * 0.011);
  return new THREE.Vector3(Math.sin(direction) * speed, 0, Math.cos(direction) * speed);
}

export function createBalloonFleet(scene, materials) {
  const group = new THREE.Group();
  group.name = "balloon fleet";
  scene.add(group);
  const random = seededRandom(6106);
  const placements = [
    [28, 140, 68, 1.18], [92, -74, 118, 0.9], [-168, -180, 92, 0.84],
    [225, -288, 165, 0.94], [-278, -390, 132, 0.83], [54, -505, 216, 0.86],
    [342, -620, 142, 0.78], [-390, -755, 196, 0.76], [158, -852, 105, 0.72],
    [-122, -965, 232, 0.72], [452, -1010, 248, 0.68],
  ];
  while (placements.length < WORLD.balloonCount) {
    const z = 320 - Math.floor((placements.length - 11) / 7) * 240 - random() * 115;
    const x = -710 + ((placements.length - 11) % 7) * 235 + (random() - 0.5) * 75;
    placements.push([x, z, 95 + random() * 290, 0.48 + random() * 0.26]);
  }

  const states = placements.map(([x, z, agl, scale], index) => {
    const detail = index < WORLD.detailedBalloonCount ? "hero" : index < WORLD.midBalloonCount ? "mid" : "far";
    const visual = createBalloonVisual(index, materials, detail);
    visual.group.scale.setScalar(scale);
    const y = terrainHeight(x, z) + agl;
    visual.group.position.set(x, y, z);
    group.add(visual.group);
    const ambient = 279 - y * 0.0065;
    const trimTemperature = 362 + random() * 8;
    const volume = 2180 * Math.pow(scale, 3);
    const density = 1.19 * Math.exp(-y / 8500);
    const payloadEquivalent = density * volume * (1 - ambient / trimTemperature);
    return {
      index, object: visual.group, flameMeshes: visual.flameMeshes, scale,
      initialPosition: new THREE.Vector3(x, y, z), position: new THREE.Vector3(x, y, z),
      targetY: y + (random() - 0.5) * 9, initialTargetY: y + (random() - 0.5) * 9,
      velocityY: 0, temperature: trimTemperature, trimTemperature, volume, payloadEquivalent,
      frontalArea: 165 * scale * scale, phase: random() * Math.PI * 2, burnerOn: false,
    };
  });
  states.forEach((state) => { state.initialTargetY = state.targetY; });

  function update(deltaSeconds, elapsedSeconds, paused) {
    if (paused) return;
    const dt = Math.min(deltaSeconds, 1 / 30);
    states.forEach((state) => {
      const ambient = 279 - state.position.y * 0.0065;
      const density = 1.19 * Math.exp(-state.position.y / 8500);
      const desiredY = state.targetY + Math.sin(elapsedSeconds * 0.018 + state.phase) * 3.2;
      const error = desiredY - state.position.y;
      const commandedTemperature = state.trimTemperature + THREE.MathUtils.clamp(error * 0.085 - state.velocityY * 2.2, -6, 9);
      state.burnerOn = state.temperature < commandedTemperature - 0.35;
      state.temperature += ((state.burnerOn ? 0.82 : 0) - (state.temperature - ambient) / 510) * dt;
      const liftMass = density * state.volume * (1 - ambient / state.temperature);
      const lift = (liftMass - state.payloadEquivalent) * WORLD.gravity;
      const drag = 0.5 * density * 0.5 * state.frontalArea * state.velocityY * Math.abs(state.velocityY);
      const effectiveMass = state.payloadEquivalent + 0.18 * density * state.volume;
      const acceleration = THREE.MathUtils.clamp((lift - drag) / Math.max(100, effectiveMass), -0.65, 0.75);
      state.velocityY = THREE.MathUtils.clamp(state.velocityY + acceleration * dt, -1.7, 2.1);
      const wind = windAtAltitude(state.position.y, elapsedSeconds);
      state.position.addScaledVector(wind, dt);
      state.position.y += state.velocityY * dt;
      const safeFloor = terrainHeight(state.position.x, state.position.z) + 27 * state.scale;
      if (state.position.y < safeFloor) {
        state.position.y = safeFloor;
        state.velocityY = Math.max(0.12, state.velocityY);
        state.targetY = safeFloor + 22;
      }
      if (Math.abs(state.position.x) > 1450 || state.position.z < -1780 || state.position.z > 760) {
        state.position.copy(state.initialPosition);
      }
      const shear = windAtAltitude(state.position.y + 22 * state.scale, elapsedSeconds).sub(wind);
      state.object.position.copy(state.position);
      state.object.rotation.set(THREE.MathUtils.clamp(-shear.z * 0.018, -0.018, 0.018), 0, THREE.MathUtils.clamp(shear.x * 0.018, -0.018, 0.018));
      state.flameMeshes.forEach((flame, flameIndex) => {
        flame.visible = state.burnerOn && (state.index + flameIndex) % 2 === 0;
        flame.scale.y = flame.visible ? 0.78 + 0.12 * Math.sin(elapsedSeconds * 31 + state.phase + flameIndex) : 0.01;
      });
    });
  }

  function reset() {
    states.forEach((state) => {
      state.position.copy(state.initialPosition);
      state.object.position.copy(state.initialPosition);
      state.targetY = state.initialTargetY;
      state.velocityY = 0;
      state.temperature = state.trimTemperature;
      state.burnerOn = false;
      state.flameMeshes.forEach((flame) => { flame.visible = false; });
    });
  }

  return { group, states, update, reset };
}
