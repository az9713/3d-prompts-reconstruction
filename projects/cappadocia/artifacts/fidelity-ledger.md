# Fidelity comparison ledger

Compared at the native generated-concept size (1680×945) and implementation acceptance size (1440×900) on 2026-09-03.

| Comparison point | Concept evidence | Render evidence | Resolution |
|---|---|---|---|
| First-frame hierarchy | Near balloon, valley, hoodoos and dawn are immediately legible | `hero.png` includes the same four layers, with a closer left balloon and restrained UI | Matched in structure; balloon does not crop overhead as aggressively to keep basket visible |
| Sky and shadow readability | Pale blue zenith, amber horizon, detailed cool shadows | `hero.png` uses a blue-to-amber shader, PMREM environment and filled shadows | Fixed after initial capture exposed an orange-only sky and crushed tuff |
| Balloon construction | Fabric gores, seam lines, basket and rigging readable | `close-up.png` shows modeled gores, seam tubes, wrinkles, woven basket, ropes and burner frame together | Matched at real-time fidelity; people in the basket are intentionally omitted |
| Geological variety | Connected dissected terrain and visibly non-identical near formations | `hero.png`, `clay.png` and `wide.png` show continuous valleys plus unique seeded near/mid meshes | Replaced the prior repeated nine-sided lathe/cylinder system; distant-only instancing remains disclosed |
| Rock-cut settlement | Cavities visibly belong to eroded rock masses | `wide.png` and the Rock-cut settlement preset show extruded rims and recessed volumes on terrain-aligned formations | Mechanism matched; architecture remains generic rather than site-specific |
| Material frequency | Rock strata/cracks and cloth weave remain distinct | PBR, normal-debug and clay views separate color, surface normal and geometry evidence | Added multiscale tuff maps and fabric normals; no field-calibrated scans |
| Interface role | World dominates the frame | Canvas remains full-bleed; compact controls occupy a narrow bottom rail and collapse to two columns at 390×844 | Matched; all labels remain keyboard-accessible |

The implementation is compositionally faithful to the benchmark, but not photographically indistinguishable from it. That unresolved gap is recorded in `DEFECTS.md` and `ACCEPTANCE.md`.

