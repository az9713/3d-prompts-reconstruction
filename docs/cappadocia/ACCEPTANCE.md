# Acceptance results

This ledger separates mechanical browser checks from visual judgment. Screenshot filenames are relative to `artifacts/`. Final timestamps and console results are produced by `tests/acceptance.py`.

| # | Criterion | Result | Evidence / limitation |
|---:|---|---|---|
| 1 | First frame communicates premise without explanation | Pass | `hero.png`: balloons, basket scale, connected eroded valley, hoodoos and dawn light are visible before interaction |
| 2 | Resembles intended reference class, not a procedural diorama | Partial | Composition and geology are subject-specific, but procedural surfaces remain visibly real-time rather than photographically indistinguishable; see `DEFECTS.md` |
| 3 | Hero and near-field geometry survive close inspection | Pass with limitation | `close-up.png` and `clay.png` show balloon gores/seams, tapered woven basket, ropes, frame, burner hardware and non-identical rock meshes; cave interiors are simplified |
| 4 | Hero materials show macro, meso and micro variation | Pass | Tuff has macro color fields, strata/streaks and granular normals; fabric has colored panels, seams, wrinkles and weave normals |
| 5 | No hero visibly exposes an unchanged primitive | Pass | Hero envelope, basket, formation and caprock meshes are custom or heavily displaced; cylinders are confined to narrow ropes, reeds and hardware |
| 6 | No obvious repeated near-field silhouette | Pass | Sixteen seeded near/mid meshes use four families and independent asymmetry; only far LOD is instanced |
| 7 | Shadowed surfaces retain detail | Pass | `hero.png` and `shadow.png`; cool environment/hemisphere fill retains strata and relief |
| 8 | Sun, illumination, shadows, reflections and values agree | Pass with limitation | One direction drives sky, visible disc, HDR environment and direct light; authored values are not a date-specific ephemeris |
| 9 | Motion has plausible causes, constraints, speeds and collisions | Partial | Buoyancy, heat loss, drag, wind and terrain clearance are modeled; balloon-to-balloon collisions and wakes are omitted |
| 10 | Relative scale and subject-specific spatial relationships | Pass with limitation | Metre units, published small-formation ranges, valleys, ridges and embedded settlement; no survey-coordinate fidelity |
| 11 | Controls are clear and reversible | Pass | Browser suite changes five views, four modes, dawn, quality and pause |
| 12 | Reset restores authored state | Pass | Browser assertions verify camera/mode/quality/count and physics reset |
| 13 | Presets avoid clipping/disorientation | Pass | Five named presets exercised; terrain clearance enforced continuously |
| 14 | Laptop and narrow usability | Pass | 1440×900 and 390×844 captures; no horizontal overflow |
| 15 | Quality reduction preserves hero/world identity | Pass | Far density, dust, pixel ratio and shadow resolution reduce before hero assets |
| 16 | No console errors, blank canvas or severe stalls | Partial | No application console errors or uncaught page errors. Headless Chromium emitted software-WebGL readback/context-teardown warnings, and high-quality screenshot capture is slow |
| 17 | Production build runs locally | Pass | `npm run build`; Vite production preview exercised |
| 18 | References, assets, assumptions and limits documented | Pass | `REFERENCES.md`, `METHOD.md`, `DEFECTS.md` and visible dialog |
| 19 | Delta-specific close and wide frames evaluated | Pass with disclosed shortfall | `close-up.png` and `wide.png`; documentary photorealism shortfall disclosed |
| 20 | Failed criteria disclosed | Pass | Partials are explicit here and in `DEFECTS.md` |

## Visual validation set

- Reference comparison: `reference-concept.png` versus `hero.png`
- First-frame hero: `hero.png`
- Close geometric inspection: `close-up.png`
- Neutral clay: `clay.png`
- Material debug: `material-debug.png`
- Shadow and illumination: `shadow.png`
- Wide world: `wide.png`
- Narrow interface: `narrow.png`
