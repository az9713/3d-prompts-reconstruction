import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#dbe4e1');
scene.fog = new THREE.FogExp2('#dbe4e1', 0.0063);
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 430);
camera.position.set(45, 25, 59);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.maxDistance = 130;
controls.minDistance = 14;
controls.maxPolarAngle = Math.PI * 0.47;
controls.target.set(0, 5.2, 0);

const clock = new THREE.Clock();
const groups = { grass: new THREE.Group(), visitors: new THREE.Group(), clouds: new THREE.Group(), guide: new THREE.Group(), shadow: new THREE.Group() };
Object.values(groups).forEach((group) => scene.add(group));
const material = {
  chalk: new THREE.MeshStandardMaterial({ color: '#a49d88', roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ color: '#716f62', roughness: 0.94, metalness: 0.02 }),
  darkStone: new THREE.MeshStandardMaterial({ color: '#59594f', roughness: 1 }),
  earth: new THREE.MeshStandardMaterial({ color: '#6f7651', roughness: 1 }),
  bank: new THREE.MeshStandardMaterial({ color: '#7b8157', roughness: 1 }),
  shadow: new THREE.MeshBasicMaterial({ color: '#343f37', transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide }),
  guide: new THREE.LineBasicMaterial({ color: '#b78539', transparent: true, opacity: 0.86 }),
};

const sun = new THREE.DirectionalLight('#fff4cf', 2.7);
sun.position.set(35, 45, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -58; sun.shadow.camera.right = 58; sun.shadow.camera.top = 58; sun.shadow.camera.bottom = -58;
sun.shadow.bias = -0.00045;
scene.add(sun);
scene.add(new THREE.HemisphereLight('#e8f4f2', '#657041', 2.3));

const sunOrb = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff6d1', transparent: true, opacity: 0.86 }));
scene.add(sunOrb);
const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(), color: '#fff1bf', transparent: true, opacity: 0.54, depthWrite: false }));
sunHalo.scale.set(16, 16, 1); scene.add(sunHalo);

function radialTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 1, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,235,.96)'); g.addColorStop(.18, 'rgba(255,247,203,.54)'); g.addColorStop(1, 'rgba(255,247,203,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function seeded(seed) { const value = Math.sin(seed * 91.371) * 43758.5453; return value - Math.floor(value); }
function terrainHeight(x, z) { return 0.3 * Math.sin(x * 0.052) * Math.cos(z * 0.047) + 0.17 * Math.sin((x + z) * .11); }

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(230, 230, 96, 96);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i += 1) p.setZ(i, terrainHeight(p.getX(i), -p.getY(i)) - 0.26);
  geometry.computeVertexNormals();
  const field = new THREE.Mesh(geometry, material.earth); field.rotation.x = -Math.PI / 2; field.receiveShadow = true; scene.add(field);
  const disk = new THREE.Mesh(new THREE.CircleGeometry(31, 80), new THREE.MeshStandardMaterial({ color: '#7e8558', roughness: 1 })); disk.rotation.x = -Math.PI / 2; disk.position.y = .03; disk.receiveShadow = true; scene.add(disk);
}
createTerrain();

function createEarthworks() {
  const ringGeo = new THREE.TorusGeometry(28.6, 1.35, 8, 84);
  const bank = new THREE.Mesh(ringGeo, material.bank); bank.rotation.x = Math.PI / 2; bank.position.y = .24; bank.receiveShadow = true; scene.add(bank);
  const ditch = new THREE.Mesh(new THREE.TorusGeometry(24.8, .5, 6, 84), new THREE.MeshStandardMaterial({ color: '#687049', roughness: 1 }));
  ditch.rotation.x = Math.PI / 2; ditch.position.y = .1; scene.add(ditch);
  const avenueMat = new THREE.MeshStandardMaterial({ color: '#87905f', roughness: 1 });
  const avenue = new THREE.Mesh(new THREE.PlaneGeometry(10, 114), avenueMat); avenue.rotation.x = -Math.PI / 2; avenue.rotation.z = -THREE.MathUtils.degToRad(49); avenue.position.set(29, .075, -33); avenue.receiveShadow = true; scene.add(avenue);
}
createEarthworks();

function roughBox(width, height, depth, seedValue, mat = material.stone) {
  const geometry = new THREE.BoxGeometry(width, height, depth, 2, 4, 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i); const edgeFactor = Math.abs(y) / height;
    position.setX(i, position.getX(i) + (seeded(i + seedValue) - .5) * .16 * (1 + edgeFactor));
    position.setZ(i, position.getZ(i) + (seeded(i * 4 + seedValue) - .5) * .18 * (1 + edgeFactor));
  }
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, mat);
}

const outerStones = [];
function addStandingStone(x, z, angle, height, width, depth, index) {
  const stone = roughBox(width, height, depth, index); stone.position.set(x, height / 2 + .05, z); stone.rotation.y = angle; stone.castShadow = stone.receiveShadow = true; scene.add(stone);
  outerStones.push({ x, z, height, width }); return stone;
}
function addLintel(a, b, index) {
  const ax = a.position.x, az = a.position.z, bx = b.position.x, bz = b.position.z;
  const length = Math.hypot(bx - ax, bz - az) + .28; const lintel = roughBox(length, .92, 1.34, index, material.darkStone);
  lintel.position.set((ax + bx) / 2, Math.min(a.position.y, b.position.y) + a.geometry.parameters.height / 2 + .13, (az + bz) / 2);
  lintel.rotation.y = -Math.atan2(bz - az, bx - ax); lintel.castShadow = lintel.receiveShadow = true; scene.add(lintel);
}

function createMonument() {
  const ring = []; const missing = new Set([3, 7, 11, 15, 19, 24, 28]);
  for (let i = 0; i < 30; i += 1) {
    if (missing.has(i)) { ring.push(null); continue; }
    const theta = (i / 30) * Math.PI * 2;
    const radius = 16.1 + (seeded(i) - .5) * .65;
    const stone = addStandingStone(Math.sin(theta) * radius, -Math.cos(theta) * radius, -theta, 5.8 + seeded(i + 9) * 1.2, 1.55 + seeded(i + 14) * .38, 1.12 + seeded(i + 18) * .25, i);
    ring.push(stone);
  }
  for (let i = 0; i < ring.length; i += 1) if (ring[i] && ring[(i + 1) % 30] && ![0, 5, 13, 20, 26].includes(i)) addLintel(ring[i], ring[(i + 1) % 30], 80 + i);
  const trilithons = [
    { x: -7.2, z: -1.1, rot: .22, h: 7.2 }, { x: 1.2, z: -5.3, rot: -.20, h: 7.65 }, { x: 7.3, z: 1.6, rot: -.38, h: 6.85 }, { x: -1.0, z: 6.3, rot: -.75, h: 6.2 },
  ];
  trilithons.forEach((t, i) => {
    const dx = Math.cos(t.rot) * 2.05, dz = Math.sin(t.rot) * 2.05;
    const left = addStandingStone(t.x - dx, t.z - dz, t.rot + Math.PI / 2, t.h, 1.65, 1.22, 140 + i * 3);
    const right = addStandingStone(t.x + dx, t.z + dz, t.rot + Math.PI / 2, t.h * (i === 3 ? .82 : 1), 1.65, 1.22, 141 + i * 3);
    if (i !== 3) addLintel(left, right, 142 + i * 3);
  });
  const blue = new THREE.MeshStandardMaterial({ color: '#5d6470', roughness: .94 });
  [[-11, 3, 3.8, .18], [10, 8, 4.3, -.65], [2, 11, 5.2, 1.05], [-17, -6, 4.7, -.45]].forEach(([x, z, size, rot], index) => {
    const fallen = roughBox(size, 1.05, 1.34, 190 + index, index === 3 ? blue : material.darkStone); fallen.position.set(x, .75, z); fallen.rotation.set((seeded(index) - .5) * .28, rot, (seeded(index + 3) - .5) * .38); fallen.castShadow = fallen.receiveShadow = true; scene.add(fallen);
  });
  const heel = roughBox(2.0, 5.5, 1.55, 232, material.stone); heel.position.set(20.9, 2.78, -18.1); heel.rotation.y = -.78; heel.castShadow = heel.receiveShadow = true; scene.add(heel);
}
createMonument();

function createFence() {
  const fenceMaterial = new THREE.MeshStandardMaterial({ color: '#4d4b3d', roughness: 1 }); const postGeo = new THREE.CylinderGeometry(.07, .09, 1.15, 5);
  [-1, 1].forEach((side) => { for (let i = 0; i < 28; i += 1) { const distance = 37 + i * 2.75; const x = Math.sin(THREE.MathUtils.degToRad(49)) * distance + side * 6; const z = -Math.cos(THREE.MathUtils.degToRad(49)) * distance; const post = new THREE.Mesh(postGeo, fenceMaterial); post.position.set(x, .58, z); scene.add(post); } });
}
createFence();

function makeGrass(count, radius, seedOffset) {
  const geometry = new THREE.PlaneGeometry(.07, .82, 1, 3); geometry.translate(0, .41, 0);
  const materialGrass = new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, uniforms: { time: { value: 0 }, wind: { value: 1 }, colorLow: { value: new THREE.Color('#59683b') }, colorHigh: { value: new THREE.Color('#9ba85e') } }, vertexShader: `attribute float phase; attribute float scale; varying float vHeight; uniform float time; uniform float wind; void main(){ vHeight=position.y/.82; vec3 p=position; p.x += sin(time*.84+phase+position.y*3.2)*.27*vHeight*wind; p.z += cos(time*.58+phase*.73+position.y*2.)*.10*vHeight*wind; p.y*=scale; vec4 mv=modelViewMatrix*instanceMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; }`, fragmentShader: `uniform vec3 colorLow; uniform vec3 colorHigh; varying float vHeight; void main(){ vec3 c=mix(colorLow,colorHigh,clamp(vHeight,0.,1.)); gl_FragColor=vec4(c,.92); }` });
  const mesh = new THREE.InstancedMesh(geometry, materialGrass, count); mesh.frustumCulled = true; mesh.castShadow = false; mesh.receiveShadow = true;
  const phases = new Float32Array(count), scales = new Float32Array(count); const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i += 1) { const u = seeded(i + seedOffset), v = seeded(i * 3 + seedOffset); const r = Math.sqrt(u) * radius; const a = v * Math.PI * 2; dummy.position.set(Math.cos(a) * r, terrainHeight(Math.cos(a) * r, Math.sin(a) * r), Math.sin(a) * r); dummy.rotation.y = seeded(i * 8) * Math.PI; dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); phases[i] = seeded(i * 11 + 4) * 20; scales[i] = .55 + seeded(i * 9) * .9; }
  geometry.setAttribute('phase', new THREE.InstancedBufferAttribute(phases, 1)); geometry.setAttribute('scale', new THREE.InstancedBufferAttribute(scales, 1)); groups.grass.add(mesh); return mesh;
}
const grassHigh = makeGrass(5000, 100, 5); const grassLow = makeGrass(1900, 98, 701); grassLow.visible = false;

function createClouds() {
  const cloudMat = new THREE.MeshBasicMaterial({ color: '#eff4f0', transparent: true, opacity: .42, depthWrite: false });
  for (let c = 0; c < 7; c += 1) { const cloud = new THREE.Group(); for (let i = 0; i < 5; i += 1) { const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + seeded(c * 19 + i) * 4, 12, 8), cloudMat); puff.position.set((i - 2) * 4, seeded(i + c) * 1.7, seeded(i * 2 + c) * 2); puff.scale.y = .34; cloud.add(puff); } cloud.position.set(-85 + c * 29, 32 + seeded(c) * 14, -80 + seeded(c + 2) * 48); cloud.userData.speed = .5 + seeded(c + 17) * .72; groups.clouds.add(cloud); }
}
createClouds();

function createVisitors() {
  const makeRingRoute = (radius, phase) => new THREE.CatmullRomCurve3(Array.from({ length: 16 }, (_, index) => { const angle = phase + index / 16 * Math.PI * 2; return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius); }), true, 'catmullrom', .35);
  const avenueAzimuth = THREE.MathUtils.degToRad(49); const avenueDirection = new THREE.Vector3(Math.sin(avenueAzimuth), 0, -Math.cos(avenueAzimuth)); const avenueLateral = new THREE.Vector3(Math.cos(avenueAzimuth), 0, Math.sin(avenueAzimuth));
  const avenuePoint = (distance, offset) => avenueDirection.clone().multiplyScalar(distance).add(avenueLateral.clone().multiplyScalar(offset));
  const routes = [
    makeRingRoute(34.5, .15),
    makeRingRoute(39.5, .33),
    new THREE.CatmullRomCurve3([avenuePoint(45, 5.5), avenuePoint(68, 5.5), avenuePoint(92, 5.5), avenuePoint(92, -5.5), avenuePoint(68, -5.5), avenuePoint(45, -5.5)], true, 'catmullrom', .28),
  ];
  const routeSpeeds = [.0038, -.00315, .00275];
  const jacketColors = ['#bd7c31', '#264d5a', '#975544', '#d1ae50', '#405e3b'];
  const silhouette = visitorTexture();
  for (let i = 0; i < 36; i += 1) {
    const routeIndex = i % routes.length; const laneIndex = Math.floor(i / routes.length);
    const person = new THREE.Group(); const jacket = new THREE.Mesh(new THREE.CapsuleGeometry(.19, .58, 3, 7), new THREE.MeshStandardMaterial({ color: jacketColors[i % jacketColors.length], roughness: 1 })); jacket.position.y = .67;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 7), new THREE.MeshStandardMaterial({ color: i % 4 === 0 ? '#9d674e' : '#d0a27d', roughness: 1 })); head.position.y = 1.23;
    const feet = new THREE.Mesh(new THREE.RingGeometry(.2, .31, 12), new THREE.MeshBasicMaterial({ color: '#d5a34b', transparent: true, opacity: .68, side: THREE.DoubleSide, depthWrite: false })); feet.rotation.x = -Math.PI / 2; feet.position.y = .045;
    const silhouetteSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: silhouette, color: jacketColors[i % jacketColors.length], transparent: true, alphaTest: .08, depthWrite: false, depthTest: true })); silhouetteSprite.center.set(.5, 0); silhouetteSprite.position.y = .08; silhouetteSprite.scale.set(1.28, 2.08, 1);
    person.add(jacket, head, feet, silhouetteSprite); person.scale.setScalar(1.05 + seeded(i) * .3); person.userData = { phase: seeded(i + 90), speed: routeSpeeds[routeIndex], curve: routes[routeIndex], progress: (laneIndex / 12 + routeIndex * .019) % 1 }; groups.visitors.add(person);
  }
}
createVisitors();

function visitorTexture() {
  const image = document.createElement('canvas'); image.width = image.height = 64; const context = image.getContext('2d'); context.fillStyle = '#fff'; context.beginPath(); context.arc(32, 13, 10, 0, Math.PI * 2); context.fill(); context.beginPath(); context.roundRect(21, 25, 22, 29, 7); context.fill(); context.fillRect(19, 31, 5, 21); context.fillRect(40, 31, 5, 21); const texture = new THREE.CanvasTexture(image); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function updateVisitors(elapsed) { groups.visitors.children.forEach((person) => { const d = person.userData; const progress = ((d.progress + elapsed * d.speed) % 1 + 1) % 1; const nextProgress = ((progress + Math.sign(d.speed) * .003) % 1 + 1) % 1; const position = d.curve.getPointAt(progress), next = d.curve.getPointAt(nextProgress); person.position.copy(position); person.position.y = terrainHeight(person.position.x, person.position.z) + .03; person.lookAt(next.x, person.position.y, next.z); person.rotation.z = Math.sin(elapsed * 5 + d.phase * 12) * .035; person.children[2].rotation.z = elapsed * .72 + d.phase * Math.PI * 2; person.children[3].position.y = .08 + Math.sin(elapsed * 5 + d.phase * 11) * .025; }); }

function createGuide() {
  const direction = new THREE.Vector3(Math.sin(THREE.MathUtils.degToRad(49)), 0, -Math.cos(THREE.MathUtils.degToRad(49)));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-direction.x * 47, .18, -direction.z * 47), new THREE.Vector3(direction.x * 66, .18, direction.z * 66)]), material.guide); groups.guide.add(line);
  [15, 29, 45, 61].forEach((distance) => { const marker = new THREE.Mesh(new THREE.RingGeometry(.22, .35, 20), new THREE.MeshBasicMaterial({ color: '#b78539', transparent: true, opacity: .92, side: THREE.DoubleSide })); marker.rotation.x = -Math.PI / 2; marker.position.set(direction.x * distance, .19, direction.z * distance); groups.guide.add(marker); });
}
createGuide();

const sunState = { azimuth: 138, elevation: 29, preset: null, wind: true, visitors: true, guide: true, quality: 'high' };
const SOLAR_REFERENCE_YEAR = 2026;
const STONEHENGE_LATITUDE = 51.1831565223;
function dayOfYear(month, day) { return Math.round((Date.UTC(SOLAR_REFERENCE_YEAR, month - 1, day) - Date.UTC(SOLAR_REFERENCE_YEAR, 0, 0)) / 86400000); }
function solarDeclination(day) { return 23.44 * Math.sin(THREE.MathUtils.degToRad((360 / 365) * (day - 81))); }
function solsticePosition(month, day, sunrise) {
  const referenceDay = dayOfYear(month, day);
  const latitude = THREE.MathUtils.degToRad(STONEHENGE_LATITUDE); const declination = THREE.MathUtils.degToRad(solarDeclination(referenceDay)); const altitude = THREE.MathUtils.degToRad(-.833); const cosineHourAngle = (Math.sin(altitude) - Math.sin(latitude) * Math.sin(declination)) / (Math.cos(latitude) * Math.cos(declination)); const hourAngle = (sunrise ? -1 : 1) * Math.acos(THREE.MathUtils.clamp(cosineHourAngle, -1, 1));
  const azimuth = (THREE.MathUtils.radToDeg(Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(latitude) - Math.tan(declination) * Math.cos(latitude))) + 180 + 360) % 360;
  return { azimuth, elevation: -.833 };
}
const presets = { midsummer: solsticePosition(6, 21, true), midwinter: solsticePosition(12, 21, false) };

function createShadow() {
  while (groups.shadow.children.length) { const child = groups.shadow.children.pop(); child.geometry.dispose(); }
  const elevation = THREE.MathUtils.degToRad(Math.max(sunState.elevation, 1.4)); const azimuth = THREE.MathUtils.degToRad(sunState.azimuth); const shadowDirection = new THREE.Vector3(-Math.sin(azimuth), 0, Math.cos(azimuth));
  outerStones.forEach((stone) => { const length = THREE.MathUtils.clamp(stone.height / Math.tan(elevation), 3, 75); const width = stone.width * 1.13; const geometry = new THREE.PlaneGeometry(width, length); const mesh = new THREE.Mesh(geometry, material.shadow); mesh.rotation.x = -Math.PI / 2; mesh.rotation.z = Math.atan2(-shadowDirection.x, shadowDirection.z); mesh.position.set(stone.x + shadowDirection.x * length / 2, .065, stone.z + shadowDirection.z * length / 2); groups.shadow.add(mesh); });
}
function updateSun() {
  const az = THREE.MathUtils.degToRad(sunState.azimuth), el = THREE.MathUtils.degToRad(sunState.elevation); const direction = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)); sun.position.copy(direction.multiplyScalar(105)); sun.target.position.set(0, 0, 0); scene.add(sun.target); sunOrb.position.copy(direction).multiplyScalar(116); sunHalo.position.copy(sunOrb.position); const dayMix = THREE.MathUtils.clamp((sunState.elevation + 3) / 30, 0, 1); scene.background.setRGB(.72 + dayMix * .14, .77 + dayMix * .14, .75 + dayMix * .15); scene.fog.color.copy(scene.background); sun.intensity = .65 + dayMix * 2.2; sunOrb.material.opacity = .35 + dayMix * .55; document.querySelector('#sun-label').textContent = sunState.preset === 'midsummer' ? 'Midsummer sunrise · 2026' : sunState.preset === 'midwinter' ? 'Midwinter sunset · 2026' : 'Manual solar position'; document.querySelector('#sun-reading').textContent = `azimuth ${sunState.azimuth.toFixed(1)}° · elevation ${sunState.elevation.toFixed(1)}°`; document.querySelector('#compact-sun').textContent = `${sunState.azimuth.toFixed(0)}° / ${sunState.elevation.toFixed(0)}°`; createShadow();
}

const azimuthInput = document.querySelector('#azimuth'), elevationInput = document.querySelector('#elevation');
function manualSolar() { sunState.azimuth = Number(azimuthInput.value); sunState.elevation = Number(elevationInput.value); sunState.preset = null; document.querySelectorAll('.preset').forEach((button) => button.classList.remove('active')); document.querySelector('#azimuth-out').textContent = `${sunState.azimuth}°`; document.querySelector('#elevation-out').textContent = `${sunState.elevation}°`; updateSun(); }
azimuthInput.addEventListener('input', manualSolar); elevationInput.addEventListener('input', manualSolar);
document.querySelectorAll('.preset').forEach((button) => button.addEventListener('click', () => { const key = button.dataset.preset, preset = presets[key]; sunState.preset = key; sunState.azimuth = preset.azimuth; sunState.elevation = preset.elevation; azimuthInput.value = Math.round(preset.azimuth); elevationInput.value = preset.elevation; document.querySelector('#azimuth-out').textContent = `${preset.azimuth.toFixed(1)}°`; document.querySelector('#elevation-out').textContent = `${preset.elevation.toFixed(1)}°`; document.querySelectorAll('.preset').forEach((item) => item.classList.toggle('active', item === button)); updateSun(); }));

function bindToggle(id, key, target) { const button = document.querySelector(id); button.addEventListener('click', () => { sunState[key] = !sunState[key]; button.classList.toggle('active', sunState[key]); button.setAttribute('aria-pressed', sunState[key]); target.visible = sunState[key]; }); }
bindToggle('#wind', 'wind', groups.grass); bindToggle('#visitors', 'visitors', groups.visitors); bindToggle('#guide', 'guide', groups.guide);
document.querySelector('#quality').addEventListener('change', (event) => { sunState.quality = event.target.value; grassHigh.visible = sunState.quality === 'high'; grassLow.visible = sunState.quality !== 'high'; renderer.shadowMap.autoUpdate = sunState.quality === 'high'; groups.clouds.visible = sunState.quality === 'high'; });
const controlDock = document.querySelector('.controls'); const controlDisclosure = document.querySelector('#controls-toggle'); controlDisclosure.addEventListener('click', () => { const collapsed = controlDock.classList.toggle('collapsed'); controlDisclosure.setAttribute('aria-expanded', String(!collapsed)); });

const views = { avenue: { p: [45, 25, 59], t: [0, 5.2, 0] }, circle: { p: [2, 28, 33], t: [0, 4, 0] }, heel: { p: [35, 11, -38], t: [6, 4, -5] }, plain: { p: [-66, 42, 53], t: [0, 2, 0] } };
let viewTween = null;
function setView(name) { const v = views[name]; viewTween = { start: performance.now(), fromP: camera.position.clone(), fromT: controls.target.clone(), toP: new THREE.Vector3(...v.p), toT: new THREE.Vector3(...v.t) }; document.querySelectorAll('.views button').forEach((button) => button.classList.toggle('active', button.dataset.view === name)); }
document.querySelectorAll('.views button').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelector('#reset').addEventListener('click', () => setView('avenue'));
document.querySelector('#info').addEventListener('click', () => { const panel = document.querySelector('#method'); panel.hidden = false; document.querySelector('#info').setAttribute('aria-expanded', 'true'); }); document.querySelector('#close-method').addEventListener('click', () => { document.querySelector('#method').hidden = true; document.querySelector('#info').setAttribute('aria-expanded', 'false'); });

function animate() { requestAnimationFrame(animate); const elapsed = clock.getElapsedTime(); groups.grass.children.forEach((mesh) => mesh.material.uniforms.time.value = elapsed); groups.grass.children.forEach((mesh) => mesh.material.uniforms.wind.value = sunState.wind ? 1 : 0); groups.clouds.children.forEach((cloud) => { cloud.position.x += cloud.userData.speed * .008; if (cloud.position.x > 100) cloud.position.x = -100; }); if (sunState.visitors) updateVisitors(elapsed); if (viewTween) { const raw = Math.min((performance.now() - viewTween.start) / 940, 1); const ease = 1 - Math.pow(1 - raw, 3); camera.position.lerpVectors(viewTween.fromP, viewTween.toP, ease); controls.target.lerpVectors(viewTween.fromT, viewTween.toT, ease); if (raw === 1) viewTween = null; } controls.update(); renderer.render(scene, camera); }
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
updateSun(); animate();
