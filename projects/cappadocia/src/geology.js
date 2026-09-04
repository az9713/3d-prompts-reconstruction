import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PALETTE } from "./config.js";
import { clamp01, fbm2, ridged2, seededRandom } from "./noise.js";

export function valleyCenter(z) {
  return 82 * Math.sin(z * 0.0023 + 0.5) + 36 * Math.sin(z * 0.0067 - 0.8);
}

export function terrainHeight(x, z) {
  const mainDistance = Math.abs(x - valleyCenter(z));
  const tributaryDistance = Math.abs(z + 420 - 0.62 * x);
  const mainCut = 78 * Math.exp(-Math.pow(mainDistance / 245, 2));
  const tributaryCut = 34 * Math.exp(-Math.pow(tributaryDistance / 190, 2));
  const plateau = 58 + 22 * fbm2(x / 780, z / 740, 8, 5);
  const dissected = 38 * ridged2(x / 250, z / 230, 17, 5);
  const gullies = 13 * ridged2(x / 78, z / 168, 31, 4) * clamp01(mainDistance / 360);
  const floorDetail = 3.2 * fbm2(x / 34, z / 34, 51, 3);
  return plateau + dissected + gullies - mainCut - tributaryCut + floorDetail - 57;
}

function vertexColor(yNormalized, theta, seed) {
  const layer = 0.5 + 0.5 * Math.sin(yNormalized * 72 + seed * 0.3 + Math.sin(theta * 2) * 1.4);
  const exposure = 0.5 + 0.5 * Math.cos(theta - 1.3);
  return PALETTE.tuffWarm.clone().lerp(PALETTE.tuffLight, 0.28 + layer * 0.28 + exposure * 0.13);
}

function formationRadius(family, t, theta, seed) {
  const baseNoise = 0.05 * Math.sin(theta * 3 + seed) + 0.035 * Math.sin(theta * 7 - seed * 0.7);
  const lean = 0.08 * Math.cos(theta - seed * 0.21) * t;
  const grooves = -0.055 * Math.pow(Math.max(0, Math.sin(theta * (5 + (seed % 4)) + t * 5)), 6);
  const weather = 0.025 * Math.sin(t * 43 + theta * 4 + seed);
  let profile;
  if (family === "hoodoo") {
    profile = 0.72 - 0.42 * t + 0.12 * Math.exp(-Math.pow((t - 0.12) / 0.1, 2));
    profile -= 0.15 * Math.exp(-Math.pow((t - 0.82) / 0.08, 2));
  } else if (family === "blade") {
    profile = 0.8 - 0.58 * Math.pow(t, 0.82) + 0.07 * Math.sin(t * Math.PI * 2.4);
  } else if (family === "shoulder") {
    profile = 0.64 - 0.34 * t + 0.19 * Math.exp(-Math.pow((t - 0.58) / 0.19, 2));
  } else {
    profile = 0.72 - 0.49 * t + 0.11 * Math.sin((1 - t) * Math.PI);
  }
  return Math.max(0.08, profile + baseNoise + lean + grooves + weather);
}

export function createFormationGeometry({ seed, family, height, radius, segments = 40, rings = 34 }) {
  const positions = [];
  const colors = [];
  const uvs = [];
  const indices = [];
  for (let ring = 0; ring <= rings; ring += 1) {
    const t = ring / rings;
    const y = t * height;
    const upslopeBias = t * t * radius * 0.11;
    for (let segment = 0; segment <= segments; segment += 1) {
      const theta = (segment / segments) * Math.PI * 2;
      const profile = formationRadius(family, t, theta, seed);
      const erosion = 1 + 0.055 * fbm2(theta * 0.77 + 10, t * 13, seed, 4);
      const radial = radius * profile * erosion;
      const fracture = Math.abs(Math.sin(theta * 2.5 + seed)) > 0.965 && t > 0.16 ? 0.9 : 1;
      const x = Math.cos(theta) * radial * fracture + upslopeBias;
      const z = Math.sin(theta) * radial * (family === "blade" ? 0.72 : 1);
      positions.push(x, y, z);
      const color = vertexColor(t, theta, seed);
      colors.push(color.r, color.g, color.b);
      uvs.push(segment / segments * 2.2, t * height / 8);
    }
  }
  for (let ring = 0; ring < rings; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = ring * (segments + 1) + segment;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createCaprock(seed, radius, depth) {
  const geometry = new THREE.IcosahedronGeometry(1, 3);
  const position = geometry.attributes.position;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const angle = Math.atan2(z, x);
    const radialNoise = 0.88 + 0.15 * fbm2(angle * 1.2 + 5, y * 3, seed + 100, 4);
    position.setXYZ(
      index,
      x * radius * radialNoise * (1 + 0.13 * Math.sin(angle + seed)),
      y * depth * (0.72 + 0.18 * radialNoise),
      z * radius * radialNoise * (0.88 + 0.12 * Math.cos(seed)),
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

function addCracks(group, height, radius, seed, material) {
  const random = seededRandom(seed * 919);
  const crackCount = 2 + (seed % 3);
  for (let crackIndex = 0; crackIndex < crackCount; crackIndex += 1) {
    const angle = random() * Math.PI * 2;
    const start = 0.25 + random() * 0.45;
    const points = [];
    for (let step = 0; step < 8; step += 1) {
      const t = start + step * 0.035;
      const theta = angle + Math.sin(step * 1.7 + seed) * 0.065;
      const radial = radius * formationRadius("hoodoo", t, theta, seed) * 1.006;
      points.push(new THREE.Vector3(Math.cos(theta) * radial, t * height, Math.sin(theta) * radial));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const crack = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.055 + random() * 0.04, 5, false), material);
    crack.userData.detailOnly = true;
    group.add(crack);
  }
}

function createArchCavity({ width, height, depth, tuffMaterial, caveMaterial }) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  const half = width * 0.74;
  shape.moveTo(-half, -height * 0.5);
  shape.lineTo(half, -height * 0.5);
  shape.lineTo(half, height * 0.18);
  shape.absarc(0, height * 0.18, half, 0, Math.PI, false);
  shape.closePath();
  const hole = new THREE.Path();
  const innerHalf = width * 0.46;
  hole.moveTo(-innerHalf, -height * 0.5);
  hole.lineTo(innerHalf, -height * 0.5);
  hole.lineTo(innerHalf, height * 0.08);
  hole.absarc(0, height * 0.08, innerHalf, 0, Math.PI, false);
  hole.closePath();
  shape.holes.push(hole);
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: depth * 0.6, bevelEnabled: true, bevelSize: 0.22, bevelThickness: 0.18, bevelSegments: 3, curveSegments: 18 }), tuffMaterial);
  rim.castShadow = true;
  rim.receiveShadow = true;
  rim.position.z = -depth * 0.38;
  group.add(rim);

  const tunnelShape = new THREE.Shape();
  tunnelShape.moveTo(-innerHalf, -height * 0.5);
  tunnelShape.lineTo(innerHalf, -height * 0.5);
  tunnelShape.lineTo(innerHalf, height * 0.08);
  tunnelShape.absarc(0, height * 0.08, innerHalf, 0, Math.PI, false);
  tunnelShape.closePath();
  const tunnel = new THREE.Mesh(new THREE.ExtrudeGeometry(tunnelShape, { depth, bevelEnabled: false, curveSegments: 18 }), caveMaterial);
  tunnel.position.z = -depth;
  tunnel.receiveShadow = true;
  group.add(tunnel);
  return group;
}

export function createGeology(scene, materials) {
  const geology = new THREE.Group();
  geology.name = "Cappadocian geology";
  scene.add(geology);

  const terrainGeometry = new THREE.PlaneGeometry(2700, 2450, 210, 190);
  terrainGeometry.rotateX(-Math.PI / 2);
  const terrainPosition = terrainGeometry.attributes.position;
  const terrainColors = new Float32Array(terrainPosition.count * 3);
  for (let index = 0; index < terrainPosition.count; index += 1) {
    const x = terrainPosition.getX(index);
    const z = terrainPosition.getZ(index) - 400;
    const y = terrainHeight(x, z);
    terrainPosition.setXYZ(index, x, y, z);
    const strata = 0.5 + 0.5 * Math.sin(y * 0.17 + fbm2(x / 110, z / 110, 81, 3) * 4);
    const floor = clamp01((70 - Math.abs(x - valleyCenter(z))) / 70);
    const color = PALETTE.tuffWarm.clone().lerp(PALETTE.tuffLight, 0.34 + strata * 0.24 + floor * 0.13);
    terrainColors[index * 3] = color.r;
    terrainColors[index * 3 + 1] = color.g;
    terrainColors[index * 3 + 2] = color.b;
  }
  terrainGeometry.setAttribute("color", new THREE.BufferAttribute(terrainColors, 3));
  terrainGeometry.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeometry, materials.tuffTerrain);
  terrain.name = "connected valley terrain";
  terrain.receiveShadow = true;
  terrain.userData.pbrMaterial = materials.tuffTerrain;
  geology.add(terrain);

  const crackMaterial = new THREE.MeshStandardMaterial({ color: "#4a3029", roughness: 1 });
  const caprockMaterial = materials.caprock;
  const formationSpecs = [
    [-182, 94, "hoodoo", 28, 10, 101, true], [-135, 28, "blade", 38, 12, 137, true],
    [128, 42, "shoulder", 34, 14, 173, true], [188, -46, "hoodoo", 30, 12, 211, true],
    [-206, -88, "shoulder", 42, 15, 257, true], [256, -138, "blade", 49, 16, 293, true],
    [-250, -240, "hoodoo", 48, 16, 331, true], [176, -275, "shoulder", 54, 20, 367, true],
    [-118, -355, "blade", 61, 18, 401, false], [310, -410, "hoodoo", 58, 19, 443, true],
    [-334, -495, "shoulder", 66, 24, 487, false], [98, -555, "blade", 74, 23, 523, false],
    [365, -630, "hoodoo", 67, 22, 569, true], [-380, -720, "blade", 84, 27, 607, false],
    [236, -820, "shoulder", 77, 29, 643, false], [-112, -925, "hoodoo", 92, 31, 683, true],
  ];

  const heroFormations = [];
  formationSpecs.forEach(([x, z, family, height, radius, seed, capped], index) => {
    const ground = terrainHeight(x, z);
    const group = new THREE.Group();
    group.name = `unique ${family} formation ${index + 1}`;
    const body = new THREE.Mesh(createFormationGeometry({ seed, family, height, radius, segments: index < 8 ? 52 : 38, rings: index < 8 ? 44 : 32 }), materials.tuffHero);
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.pbrMaterial = materials.tuffHero;
    group.add(body);
    if (capped) {
      const capRadius = radius * (0.74 + (seed % 9) * 0.035);
      const cap = new THREE.Mesh(createCaprock(seed, capRadius, Math.max(3.4, radius * 0.38)), caprockMaterial);
      cap.position.set(radius * 0.08 * Math.sin(seed), height + radius * 0.05, radius * 0.06 * Math.cos(seed));
      cap.rotation.set(0.05 * Math.sin(seed), seed * 0.13, 0.08 * Math.cos(seed));
      cap.castShadow = true;
      cap.receiveShadow = true;
      cap.userData.pbrMaterial = caprockMaterial;
      group.add(cap);
    }
    if (index < 10) addCracks(group, height, radius, seed, crackMaterial);
    if ([0, 2, 5].includes(index)) {
      const cave = createArchCavity({ width: 3.5 + index * 0.08, height: 5.2 + index * 0.1, depth: 5.8, tuffMaterial: materials.tuffHero, caveMaterial: materials.cave });
      cave.position.set(0, height * 0.25, radius * 0.52);
      cave.scale.setScalar(0.78 + index * 0.015);
      group.add(cave);
    }
    group.position.set(x, ground - 1, z);
    group.rotation.y = (seed % 31) * 0.07;
    geology.add(group);
    heroFormations.push(group);
  });

  const settlementGroup = new THREE.Group();
  settlementGroup.name = "terrain-integrated rock-cut settlement";
  const settlementSpecs = [
    [188, -286, 19, 0.18], [210, -304, 17, -0.08], [231, -322, 15, 0.12],
    [168, -318, 13, -0.14], [254, -350, 18, 0.07], [202, -350, 12, -0.05],
  ];
  settlementSpecs.forEach(([x, z, height, yaw], index) => {
    const ground = terrainHeight(x, z);
    const mass = new THREE.Mesh(createFormationGeometry({ seed: 811 + index * 23, family: index % 2 ? "shoulder" : "hoodoo", height, radius: height * 0.48, segments: 38, rings: 30 }), materials.tuffHero);
    mass.castShadow = true;
    mass.receiveShadow = true;
    mass.userData.pbrMaterial = materials.tuffHero;
    mass.position.set(x, ground - 1, z);
    mass.rotation.y = yaw;
    settlementGroup.add(mass);
    const facadeYaw = Math.atan2(20 - x, 108 - z);
    const cave = createArchCavity({ width: 3.7 + (index % 3) * 0.45, height: 5.1 + (index % 2) * 0.7, depth: 5.5, tuffMaterial: materials.tuffHero, caveMaterial: materials.cave });
    cave.position.set(x - Math.sin(facadeYaw) * height * 0.37, ground + height * 0.29, z - Math.cos(facadeYaw) * height * 0.37);
    cave.rotation.y = facadeYaw;
    cave.scale.setScalar(0.82);
    settlementGroup.add(cave);
  });
  geology.add(settlementGroup);

  const farGeometry = createFormationGeometry({ seed: 991, family: "blade", height: 1, radius: 0.34, segments: 12, rings: 12 });
  const farFormations = new THREE.InstancedMesh(farGeometry, materials.tuffFar, 150);
  farFormations.name = "far formation LOD";
  farFormations.castShadow = false;
  farFormations.receiveShadow = true;
  farFormations.userData.pbrMaterial = materials.tuffFar;
  const helper = new THREE.Object3D();
  const random = seededRandom(2209);
  for (let index = 0; index < 150; index += 1) {
    const z = -550 - random() * 1250;
    const side = random() > 0.5 ? 1 : -1;
    const x = valleyCenter(z) + side * (265 + random() * 610);
    const height = 22 + random() * 44;
    const width = 16 + random() * 22;
    helper.position.set(x, terrainHeight(x, z) - 1, z);
    helper.rotation.set((random() - 0.5) * 0.05, random() * Math.PI * 2, (random() - 0.5) * 0.08);
    helper.scale.set(width, height, width * (0.72 + random() * 0.4));
    helper.updateMatrix();
    farFormations.setMatrixAt(index, helper.matrix);
    const color = PALETTE.tuffWarm.clone().lerp(PALETTE.tuffLight, 0.25 + random() * 0.34);
    farFormations.setColorAt(index, color);
  }
  farFormations.instanceMatrix.needsUpdate = true;
  if (farFormations.instanceColor) farFormations.instanceColor.needsUpdate = true;
  geology.add(farFormations);

  const boulderGeometries = [];
  for (let index = 0; index < 18; index += 1) {
    const geometry = createCaprock(1200 + index * 7, 1.2 + (index % 5) * 0.32, 0.9 + (index % 3) * 0.25);
    const angle = -1.8 + index * 0.17;
    const distance = 72 + (index % 4) * 19;
    const x = Math.sin(angle) * distance + 82;
    const z = Math.cos(angle) * distance + 182;
    geometry.translate(x, terrainHeight(x, z) + 0.3, z);
    boulderGeometries.push(geometry);
  }
  const boulders = new THREE.Mesh(mergeGeometries(boulderGeometries, false), materials.caprock);
  boulderGeometries.forEach((geometry) => geometry.dispose());
  boulders.castShadow = true;
  boulders.receiveShadow = true;
  boulders.userData.pbrMaterial = materials.caprock;
  geology.add(boulders);

  return { group: geology, terrain, heroFormations, farFormations, settlementGroup };
}
