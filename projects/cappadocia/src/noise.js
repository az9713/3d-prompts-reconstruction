export function seededRandom(seed = 610) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hash2(x, y, seed = 0) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

export function valueNoise2(x, y, seed = 0) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  const low = a + (b - a) * fx;
  const high = c + (d - c) * fx;
  return low + (high - low) * fy;
}

export function fbm2(x, y, seed = 0, octaves = 5) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let normalization = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    value += valueNoise2(x * frequency, y * frequency, seed + octave * 19) * amplitude;
    normalization += amplitude;
    frequency *= 2.03;
    amplitude *= 0.5;
  }
  return value / normalization;
}

export function ridged2(x, y, seed = 0, octaves = 4) {
  return 1 - Math.abs(fbm2(x, y, seed, octaves) * 2 - 1);
}

export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

