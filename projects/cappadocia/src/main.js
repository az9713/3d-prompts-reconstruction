import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CAMERA_PRESETS, PALETTE, QUALITY, SUN } from "./config.js";
import { createBalloonFleet, windAtAltitude } from "./balloons.js";
import { createGeology, terrainHeight, valleyCenter } from "./geology.js";
import { createClayMaterial, createNormalDebugMaterial, createTuffMaterial, createTuffTextureSet } from "./materials.js";
import { seededRandom } from "./noise.js";
import "./style.css";

const canvas = document.querySelector("#world");
const status = document.querySelector("#status");
const fatalMessage = document.querySelector("#fatalMessage");
const viewSelect = document.querySelector("#viewSelect");
const renderSelect = document.querySelector("#renderSelect");
const lightControl = document.querySelector("#lightControl");
const qualitySelect = document.querySelector("#qualitySelect");
const pauseButton = document.querySelector("#pauseButton");
const resetButton = document.querySelector("#resetButton");
const methodButton = document.querySelector("#methodButton");
const methodPanel = document.querySelector("#methodPanel");
const closeMethod = document.querySelector("#closeMethod");
const timeReadout = document.querySelector("#timeReadout");
const balloonReadout = document.querySelector("#balloonReadout");
const windReadout = document.querySelector("#windReadout");
const altitudeReadout = document.querySelector("#altitudeReadout");
const modeReadout = document.querySelector("#modeReadout");
const debugLegend = document.querySelector("#debugLegend");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
let scene;
let camera;
let controls;
let geology;
let fleet;
let sunLight;
let hemisphereLight;
let skyMaterial;
let sunDisc;
let dust;
let paused = reducedMotion;
let elapsedSeconds = 0;
let transition = null;
const trackedMaterials = [];
const clayMaterial = createClayMaterial();
const normalDebugMaterial = createNormalDebugMaterial();
const shadowDebugMaterial = new THREE.MeshStandardMaterial({ color: "#d7d4cd", roughness: 0.92, metalness: 0 });

function sunDirection(azimuthDegrees, elevationDegrees) {
  const azimuth = THREE.MathUtils.degToRad(azimuthDegrees);
  const elevation = THREE.MathUtils.degToRad(elevationDegrees);
  return new THREE.Vector3(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), -Math.cos(azimuth) * Math.cos(elevation)).normalize();
}

function createHdrEnvironment(direction) {
  const width = 256;
  const height = 128;
  const data = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const elevation = (0.5 - y / (height - 1)) * Math.PI;
    for (let x = 0; x < width; x += 1) {
      const azimuth = (x / (width - 1)) * Math.PI * 2 - Math.PI;
      const ray = new THREE.Vector3(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), -Math.cos(azimuth) * Math.cos(elevation));
      const horizon = Math.exp(-Math.abs(ray.y) * 6.5);
      const sky = Math.max(0, ray.y);
      const sunDot = Math.max(0, ray.dot(direction));
      const sunCore = Math.pow(sunDot, 1800) * 38;
      const aureole = Math.pow(sunDot, 28) * 1.4;
      const index = (y * width + x) * 4;
      data[index] = 0.22 + sky * 0.22 + horizon * 0.72 + sunCore + aureole;
      data[index + 1] = 0.28 + sky * 0.34 + horizon * 0.44 + sunCore * 0.54 + aureole * 0.48;
      data[index + 2] = 0.36 + sky * 0.48 + horizon * 0.26 + sunCore * 0.2 + aureole * 0.18;
      data[index + 3] = 1;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  generator.compileEquirectangularShader();
  const target = generator.fromEquirectangular(texture);
  texture.dispose();
  generator.dispose();
  return target.texture;
}

function createSky(direction) {
  skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      zenith: { value: PALETTE.skyZenith.clone() }, horizon: { value: PALETTE.skyHorizon.clone() },
      lower: { value: new THREE.Color("#a06d60") }, sunDirection: { value: direction.clone() },
      sunColor: { value: new THREE.Color("#ffd3aa") },
    },
    vertexShader: `varying vec3 vDirection; void main(){vec4 world=modelMatrix*vec4(position,1.0);vDirection=normalize(world.xyz-cameraPosition);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform vec3 zenith;uniform vec3 horizon;uniform vec3 lower;uniform vec3 sunDirection;uniform vec3 sunColor;varying vec3 vDirection;void main(){vec3 d=normalize(vDirection);float y=clamp(d.y,-0.2,1.0);vec3 base=mix(lower,horizon,smoothstep(-0.14,0.08,y));base=mix(base,zenith,smoothstep(-0.01,0.3,y));float mu=max(dot(d,normalize(sunDirection)),0.0);float aureole=pow(mu,20.0)*0.22;float disc=pow(mu,1500.0)*3.2;float horizonHaze=exp(-abs(y)*18.0)*0.08;gl_FragColor=vec4(base+sunColor*(aureole+disc+horizonHaze),1.0);}`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3500, 48, 26), skyMaterial);
  sky.frustumCulled = false;
  sky.name = "physically coherent dawn sky";
  scene.add(sky);
}

function createMaterials() {
  const tuffTextures = createTuffTextureSet(256);
  const materials = {
    tuffHero: createTuffMaterial(tuffTextures, 5), tuffTerrain: createTuffMaterial(tuffTextures, 16), tuffFar: createTuffMaterial(tuffTextures, 3),
    caprock: new THREE.MeshStandardMaterial({ color: "#786052", map: tuffTextures.color, roughnessMap: tuffTextures.roughness, normalMap: tuffTextures.normal, normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.97 }),
    cave: new THREE.MeshStandardMaterial({ color: "#3b2a26", roughness: 1, side: THREE.DoubleSide }),
    wicker: new THREE.MeshStandardMaterial({ color: "#83542d", roughness: 0.82 }), wickerDark: new THREE.MeshStandardMaterial({ color: "#4b2d1d", roughness: 0.9 }),
    wickerRim: new THREE.MeshStandardMaterial({ color: "#a27242", roughness: 0.78 }), metal: new THREE.MeshStandardMaterial({ color: "#383737", roughness: 0.38, metalness: 0.72 }),
    tank: new THREE.MeshStandardMaterial({ color: "#8d332d", roughness: 0.42, metalness: 0.38 }), rope: new THREE.MeshStandardMaterial({ color: "#4d3828", roughness: 1 }),
    seam: new THREE.MeshStandardMaterial({ color: "#ede1c9", roughness: 0.85 }), flame: new THREE.MeshBasicMaterial({ color: "#ffb45f", transparent: true, opacity: 0.9, toneMapped: false }),
  };
  Object.values(materials).forEach((material) => trackedMaterials.push(material));
  return materials;
}

function createDustSystem() {
  const random = seededRandom(941);
  const count = QUALITY.field.dust;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const z = -1150 + random() * 1500;
    const x = valleyCenter(z) + (random() - 0.5) * 460;
    positions[index * 3] = x; positions[index * 3 + 1] = terrainHeight(x, z) + 1 + random() * 22; positions[index * 3 + 2] = z;
    phases[index] = random() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: "#d9b58f", size: 0.68, transparent: true, opacity: 0.2, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return { points, phases, random };
}

function updateDust(deltaSeconds) {
  if (paused) return;
  const position = dust.points.geometry.attributes.position;
  const wind = windAtAltitude(18, elapsedSeconds);
  for (let index = 0; index < dust.points.geometry.drawRange.count; index += 1) {
    let x = position.getX(index) + wind.x * deltaSeconds * 0.18;
    let y = position.getY(index) + Math.sin(elapsedSeconds * 0.3 + dust.phases[index]) * deltaSeconds * 0.04;
    let z = position.getZ(index) + wind.z * deltaSeconds * 0.18;
    if (x > 730 || z > 480) { z = -1120 + dust.random() * 1200; x = valleyCenter(z) - 220; y = terrainHeight(x, z) + 2 + dust.random() * 18; }
    position.setXYZ(index, x, y, z);
  }
  position.needsUpdate = true;
}

function collectRenderableMeshes() {
  const meshes = [];
  scene.traverse((object) => {
    if (object.isMesh && object.material !== skyMaterial && object !== sunDisc && !object.material.transparent) {
      object.userData.pbrMaterial ||= object.material;
      meshes.push(object);
    }
  });
  return meshes;
}

function applyRenderMode(mode) {
  collectRenderableMeshes().forEach((mesh) => {
    if (mode === "pbr") mesh.material = mesh.userData.pbrMaterial;
    if (mode === "clay") mesh.material = clayMaterial;
    if (mode === "material") mesh.material = normalDebugMaterial;
    if (mode === "shadow") mesh.material = shadowDebugMaterial;
  });
  skyMaterial.uniforms.zenith.value.copy(mode === "shadow" ? new THREE.Color("#aeb5b8") : PALETTE.skyZenith);
  skyMaterial.uniforms.horizon.value.copy(mode === "shadow" ? new THREE.Color("#d1cbc1") : PALETTE.skyHorizon);
  scene.fog.density = mode === "material" || mode === "clay" ? 0.00018 : 0.00042;
  debugLegend.hidden = mode === "pbr";
  debugLegend.textContent = ({ clay: "Neutral clay · geometry and silhouette", material: "Surface-normal debug · RGB = XYZ", shadow: "Shadow debug · sun and contact" })[mode] || "";
  modeReadout.textContent = ({ pbr: "PBR", clay: "Clay", material: "Normal", shadow: "Shadow" })[mode];
}

function updateDawn(value) {
  const amount = Number(value) / 100;
  const elevation = 2.4 + amount * 7.8;
  const azimuth = SUN.azimuthDegrees + amount * 2.2;
  const direction = sunDirection(azimuth, elevation);
  skyMaterial.uniforms.sunDirection.value.copy(direction);
  sunLight.position.copy(direction).multiplyScalar(1700);
  sunLight.target.position.set(0, 20, -340);
  sunLight.intensity = 2.6 + amount * 1.3;
  hemisphereLight.intensity = 1.75 + amount * 0.55;
  renderer.toneMappingExposure = 1.18 + amount * 0.2;
  sunDisc.position.copy(direction).multiplyScalar(2700);
  sunDisc.lookAt(camera.position);
  const minute = 5 + Math.round(amount * 17);
  timeReadout.textContent = `06:${String(minute).padStart(2, "0")}`;
}

function setQuality(name) {
  const quality = QUALITY[name];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
  sunLight.shadow.mapSize.set(quality.shadow, quality.shadow);
  sunLight.shadow.map?.dispose();
  sunLight.shadow.map = null;
  geology.farFormations.count = quality.farFormations;
  dust.points.geometry.setDrawRange(0, quality.dust);
  fleet.states.forEach((state) => { state.object.visible = state.index < quality.balloons; });
  balloonReadout.textContent = String(quality.balloons);
}

function transitionToPreset(name, immediate = false) {
  const preset = CAMERA_PRESETS[name];
  if (!preset) return;
  if (immediate || reducedMotion) {
    camera.position.copy(preset.position); controls.target.copy(preset.target); camera.fov = preset.fov; camera.updateProjectionMatrix(); controls.update(); transition = null; return;
  }
  transition = { startPosition: camera.position.clone(), startTarget: controls.target.clone(), startFov: camera.fov, endPosition: preset.position.clone(), endTarget: preset.target.clone(), endFov: preset.fov, progress: 0 };
}

function updateCamera(deltaSeconds) {
  if (transition) {
    transition.progress = Math.min(1, transition.progress + deltaSeconds * 0.85);
    const eased = 1 - Math.pow(1 - transition.progress, 3);
    camera.position.lerpVectors(transition.startPosition, transition.endPosition, eased);
    controls.target.lerpVectors(transition.startTarget, transition.endTarget, eased);
    camera.fov = THREE.MathUtils.lerp(transition.startFov, transition.endFov, eased);
    camera.updateProjectionMatrix();
    if (transition.progress >= 1) transition = null;
  }
  const minimumY = terrainHeight(camera.position.x, camera.position.z) + 3.2;
  if (camera.position.y < minimumY) camera.position.y = minimumY;
  controls.update();
}

function attachInterface() {
  viewSelect.addEventListener("change", () => transitionToPreset(viewSelect.value));
  renderSelect.addEventListener("change", () => applyRenderMode(renderSelect.value));
  lightControl.addEventListener("input", () => updateDawn(lightControl.value));
  qualitySelect.addEventListener("change", () => setQuality(qualitySelect.value));
  pauseButton.addEventListener("click", () => { paused = !paused; pauseButton.textContent = paused ? "Resume" : "Pause"; pauseButton.setAttribute("aria-pressed", String(paused)); });
  resetButton.addEventListener("click", () => {
    elapsedSeconds = 0; paused = reducedMotion; pauseButton.textContent = paused ? "Resume" : "Pause"; pauseButton.setAttribute("aria-pressed", String(paused));
    viewSelect.value = "hero"; renderSelect.value = "pbr"; lightControl.value = "42"; qualitySelect.value = "field";
    fleet.reset(); updateDawn(42); setQuality("field"); applyRenderMode("pbr"); transitionToPreset("hero");
  });
  methodButton.addEventListener("click", () => methodPanel.showModal());
  closeMethod.addEventListener("click", () => methodPanel.close());
  controls.addEventListener("start", () => { transition = null; });
  window.addEventListener("resize", () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight, false); });
}

function dispose() {
  scene.traverse((object) => object.geometry?.dispose());
  trackedMaterials.forEach((material) => material.dispose());
  scene.environment?.dispose();
  controls.dispose(); renderer.dispose();
}

async function init() {
  if (!canvas || !window.WebGLRenderingContext) throw new Error("A WebGL-capable browser is required.");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setSize(window.innerWidth, window.innerHeight, false);
  scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(PALETTE.fog, 0.00042);
  camera = new THREE.PerspectiveCamera(47, window.innerWidth / window.innerHeight, 0.35, 5000);
  controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = 0.055; controls.rotateSpeed = 0.31;
  controls.zoomSpeed = 0.58; controls.panSpeed = 0.42; controls.minDistance = 5.5; controls.maxDistance = 1600; controls.maxPolarAngle = Math.PI * 0.493;

  const authoredSun = sunDirection(SUN.azimuthDegrees, SUN.elevationDegrees);
  createSky(authoredSun); scene.environment = createHdrEnvironment(authoredSun); scene.environmentIntensity = 0.72;
  hemisphereLight = new THREE.HemisphereLight("#bfd5df", "#80675f", 2.0); scene.add(hemisphereLight);
  sunLight = new THREE.DirectionalLight(SUN.color, 3.8); sunLight.position.copy(authoredSun).multiplyScalar(1700); sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048); sunLight.shadow.camera.left = -620; sunLight.shadow.camera.right = 620;
  sunLight.shadow.camera.top = 520; sunLight.shadow.camera.bottom = -520; sunLight.shadow.camera.near = 10; sunLight.shadow.camera.far = 3000;
  sunLight.shadow.bias = -0.00017; sunLight.shadow.normalBias = 0.55; scene.add(sunLight, sunLight.target);

  const sunDistance = 2700;
  const sunAngularRadius = THREE.MathUtils.degToRad(SUN.angularDiameterDegrees * 0.5);
  sunDisc = new THREE.Mesh(new THREE.CircleGeometry(Math.tan(sunAngularRadius) * sunDistance, 64), new THREE.MeshBasicMaterial({ color: "#ffd7ad", transparent: true, opacity: 0.95, fog: false, toneMapped: false }));
  sunDisc.position.copy(authoredSun).multiplyScalar(sunDistance); scene.add(sunDisc);
  const materials = createMaterials(); geology = createGeology(scene, materials); fleet = createBalloonFleet(scene, materials); dust = createDustSystem();
  transitionToPreset("hero", true); updateDawn(42); setQuality("field"); applyRenderMode("pbr"); attachInterface();
  window.addEventListener("pagehide", dispose, { once: true });

  const clock = new THREE.Clock();
  let pausedFrame = 0;
  function animate() {
    requestAnimationFrame(animate);
    const deltaSeconds = Math.min(clock.getDelta(), 0.05);
    pausedFrame = paused ? pausedFrame + 1 : 0;
    if (!paused) elapsedSeconds += deltaSeconds;
    fleet.update(deltaSeconds, elapsedSeconds, paused); updateDust(deltaSeconds); updateCamera(deltaSeconds); sunDisc.lookAt(camera.position);
    const agl = Math.max(0, camera.position.y - terrainHeight(camera.position.x, camera.position.z));
    altitudeReadout.textContent = `${Math.round(agl)} m AGL`; windReadout.textContent = `ENE ${windAtAltitude(camera.position.y, elapsedSeconds).length().toFixed(1)} m/s`;
    if (!paused || pausedFrame % 4 === 0 || transition) renderer.render(scene, camera);
  }
  animate();
  requestAnimationFrame(() => requestAnimationFrame(() => status.classList.add("is-ready")));
}

init().catch((error) => {
  console.error(error);
  fatalMessage.textContent = error instanceof Error ? error.message : "The scene could not be prepared.";
  status.classList.add("is-error");
});
