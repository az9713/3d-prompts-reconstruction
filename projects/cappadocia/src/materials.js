import * as THREE from "three";
import { PALETTE } from "./config.js";
import { fbm2, ridged2 } from "./noise.js";

function makeCanvas(size, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  draw(context, size);
  return canvas;
}

function makeTexture(canvas, color = false) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createTuffTextureSet(size = 512) {
  const colorCanvas = makeCanvas(size, (context) => {
    const image = context.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const macro = fbm2(x / 118, y / 94, 7, 5);
        const grain = fbm2(x / 9, y / 11, 29, 3);
        const layer = 0.5 + 0.5 * Math.sin(y * 0.115 + fbm2(x / 70, y / 80, 13, 3) * 6.2);
        const streak = ridged2(x / 22, y / 118, 47, 4);
        const weather = 0.58 * macro + 0.2 * grain + 0.14 * layer + 0.08 * streak;
        image.data[index] = 151 + weather * 72;
        image.data[index + 1] = 108 + weather * 72;
        image.data[index + 2] = 86 + weather * 62;
        image.data[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
    context.globalAlpha = 0.16;
    context.strokeStyle = "#3e2a25";
    for (let y = 20; y < size; y += 53) {
      context.beginPath();
      context.moveTo(0, y);
      for (let x = 0; x <= size; x += 16) context.lineTo(x, y + Math.sin(x * 0.031 + y) * 3);
      context.stroke();
    }
  });

  const roughnessCanvas = makeCanvas(size, (context) => {
    const image = context.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const value = 198 + 50 * fbm2(x / 18, y / 18, 61, 4);
        image.data[index] = image.data[index + 1] = image.data[index + 2] = value;
        image.data[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  });

  const normalCanvas = makeCanvas(size, (context) => {
    const image = context.createImageData(size, size);
    const height = (x, y) => fbm2(x / 11, y / 13, 71, 4) * 0.7 + ridged2(x / 36, y / 8, 83, 3) * 0.3;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const dx = height((x + 1) % size, y) - height((x - 1 + size) % size, y);
        const dy = height(x, (y + 1) % size) - height(x, (y - 1 + size) % size);
        const nx = -dx * 4;
        const ny = -dy * 4;
        const nz = 1;
        const length = Math.hypot(nx, ny, nz);
        image.data[index] = 128 + (nx / length) * 127;
        image.data[index + 1] = 128 + (ny / length) * 127;
        image.data[index + 2] = 128 + (nz / length) * 127;
        image.data[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  });

  return {
    color: makeTexture(colorCanvas, true),
    roughness: makeTexture(roughnessCanvas),
    normal: makeTexture(normalCanvas),
  };
}

export function createTuffMaterial(textureSet, repeat = 8) {
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: textureSet.color,
    roughnessMap: textureSet.roughness,
    normalMap: textureSet.normal,
    normalScale: new THREE.Vector2(0.62, 0.62),
    roughness: 0.93,
    metalness: 0,
    vertexColors: true,
  });
  [material.map, material.roughnessMap, material.normalMap].forEach((texture) => texture.repeat.set(repeat, repeat));
  return material;
}

export function createFabricTextureSet(colors, patternIndex, size = 512) {
  const colorCanvas = makeCanvas(size, (context) => {
    const panelWidth = size / 24;
    context.fillStyle = colors[0];
    context.fillRect(0, 0, size, size);
    for (let panel = 0; panel < 24; panel += 1) {
      const paletteIndex = (panel + patternIndex) % 4;
      context.fillStyle = colors[paletteIndex];
      context.fillRect(panel * panelWidth, 0, panelWidth + 1, size);
      context.fillStyle = "rgba(36,24,20,.23)";
      context.fillRect(panel * panelWidth, 0, 1.25, size);
    }
    context.fillStyle = colors[(patternIndex + 2) % 4];
    const bandY = patternIndex % 2 === 0 ? [124, 308] : [92, 334];
    bandY.forEach((y) => context.fillRect(0, y, size, 30));
    context.globalAlpha = 0.14;
    context.strokeStyle = "#fff4d9";
    for (let y = 0; y < size; y += 3) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(size, y);
      context.stroke();
    }
  });
  const normalCanvas = makeCanvas(size, (context) => {
    const image = context.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const weaveX = Math.sin(x * Math.PI * 0.78);
        const weaveY = Math.sin(y * Math.PI * 0.78);
        const seam = x % Math.round(size / 24) < 2 ? 0.45 : 0;
        image.data[index] = 128 + weaveX * 16 + seam * 38;
        image.data[index + 1] = 128 + weaveY * 16;
        image.data[index + 2] = 235;
        image.data[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  });
  return { color: makeTexture(colorCanvas, true), normal: makeTexture(normalCanvas) };
}

export function createClayMaterial() {
  return new THREE.MeshStandardMaterial({ color: "#b9b4aa", roughness: 0.86, metalness: 0 });
}

export function createNormalDebugMaterial() {
  return new THREE.MeshNormalMaterial({ flatShading: false });
}
