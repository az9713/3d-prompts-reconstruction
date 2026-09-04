import * as THREE from "three";

export const WORLD = Object.freeze({
  metersPerUnit: 1,
  east: new THREE.Vector3(1, 0, 0),
  up: new THREE.Vector3(0, 1, 0),
  south: new THREE.Vector3(0, 0, 1),
  latitude: 38.6431,
  longitude: 34.8289,
  authoredLocalTime: "06:12",
  balloonCount: 42,
  detailedBalloonCount: 3,
  midBalloonCount: 11,
  gravity: 9.80665,
});

export const SUN = Object.freeze({
  azimuthDegrees: 108.5,
  elevationDegrees: 5.8,
  angularDiameterDegrees: 0.53,
  color: 0xffd2a4,
});

export const PALETTE = Object.freeze({
  skyZenith: new THREE.Color("#8ba9b8"),
  skyHorizon: new THREE.Color("#f2b884"),
  ground: new THREE.Color("#8f604f"),
  fog: new THREE.Color("#b48a7b"),
  tuffPale: new THREE.Color("#b98b6d"),
  tuffWarm: new THREE.Color("#8d5b49"),
  tuffLight: new THREE.Color("#d5ad88"),
  caprock: new THREE.Color("#544238"),
  shadow: new THREE.Color("#514957"),
  accent: new THREE.Color("#ef9b67"),
});

export const CAMERA_PRESETS = Object.freeze({
  hero: {
    label: "First light",
    position: new THREE.Vector3(155, 94, 318),
    target: new THREE.Vector3(-26, 68, -245),
    fov: 47,
  },
  ground: {
    label: "Valley floor",
    position: new THREE.Vector3(42, 20, 155),
    target: new THREE.Vector3(-78, 38, -220),
    fov: 55,
  },
  close: {
    label: "Close pass",
    position: new THREE.Vector3(-38, 90, 238),
    target: new THREE.Vector3(30, 75, 138),
    fov: 44,
  },
  settlement: {
    label: "Rock-cut settlement",
    position: new THREE.Vector3(124, 50, -40),
    target: new THREE.Vector3(205, 41, -286),
    fov: 50,
  },
  wide: {
    label: "Valley survey",
    position: new THREE.Vector3(490, 410, 560),
    target: new THREE.Vector3(0, 20, -360),
    fov: 48,
  },
});

export const QUALITY = Object.freeze({
  field: { pixelRatio: 1.7, farFormations: 150, balloons: 42, dust: 700, shadow: 2048 },
  travel: { pixelRatio: 1.35, farFormations: 104, balloons: 32, dust: 360, shadow: 1536 },
  quiet: { pixelRatio: 1, farFormations: 64, balloons: 24, dust: 120, shadow: 1024 },
});

export const BALLOON_PALETTES = Object.freeze([
  ["#efe1bf", "#a13f31", "#294d58", "#d79550"],
  ["#ead3a5", "#25515d", "#b74d35", "#6f2f31"],
  ["#e7d3b7", "#884238", "#c8904f", "#334a54"],
  ["#f0dfc3", "#b65e3d", "#486b70", "#7a3835"],
  ["#d7b779", "#743b35", "#f0dfbd", "#3f6570"],
  ["#edd6ad", "#4f6b69", "#b34d36", "#d18c4e"],
  ["#e6cfaa", "#8f3b32", "#315260", "#bf874d"],
]);
