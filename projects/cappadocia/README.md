# Cappadocia · First Ascent

> **Model provenance:** this prototype was created by a GPT-5.6-family coding model from reconstructed prompts intended to test the GPT-6 Astra behavior shown in [Peter Gostev's video](https://www.youtube.com/watch?v=GQPi39sjNhU). It is not a GPT-6 output and does not reproduce Peter's hidden prompt verbatim.

A reference-grounded, interactive Three.js dawn flight over a connected Cappadocian valley. The experience opens directly on the authored hero view and includes five camera presets, four inspection modes, a reversible quality ladder, pause, reset, responsive controls, and a visible disclosure panel.

This is an artistic reconstruction constrained by published geology and balloon-flight principles. It is not photogrammetry, a survey, a flight simulator, or a navigational product. Read [METHOD.md](./METHOD.md), [REFERENCES.md](./REFERENCES.md), [ACCEPTANCE.md](./ACCEPTANCE.md), and [DEFECTS.md](./DEFECTS.md) before making accuracy claims.

## Requirements

- Node.js 20 or later
- npm 10 or later
- A current browser with WebGL 2 support

## Install and run

```powershell
npm install
npm run dev
```

Open the local address printed by Vite. The configured development host is `127.0.0.1`.

## Production build

```powershell
npm run build
npm run preview -- --port 4183
```

The production files are written to `dist/`. The preview command serves the built files at `http://127.0.0.1:4183` when that port is free.

## Browser acceptance suite

With the production preview running:

```powershell
$env:APP_URL='http://127.0.0.1:4183'
python tests\acceptance.py
```

The suite checks WebGL startup, page identity, all camera/inspection controls, pause, quality reduction, method disclosure, reset, narrow-screen overflow, console errors, and the requested validation screenshots. It requires Python Playwright with Chromium installed.

## Controls

- Drag: orbit
- Right-drag: pan
- Mouse wheel or trackpad: dolly
- Camera: first light, valley floor, close pass, rock-cut settlement, valley survey
- Inspection: PBR, neutral clay, surface normals, shadow study
- Dawn progression: moves the authored sun, disc, direct light, and sky together
- Quality: reduces distant formations, fleet size, dust, pixel ratio, and shadow resolution before hero geometry
- Pause: stops balloon physics and dust advection
- Reset: restores the authored first frame and simulation state

## Project structure

- `src/config.js` — units, authored sun, quality ladder, camera presets
- `src/noise.js` — deterministic seeded noise
- `src/materials.js` — local tuff and fabric texture generation
- `src/geology.js` — connected terrain, unique formation meshes, caprock and recessed cavities
- `src/balloons.js` — envelope, wicker, rigging, burners, fleet and buoyancy approximation
- `src/main.js` — renderer, HDR environment, lighting, inspection modes, camera and lifecycle
- `tests/acceptance.py` — browser checks and capture sequence
- `artifacts/` — visual benchmark and validation captures
