# Defect ledger

Updated 2026-09-03 after browser capture review.

| Severity | Remaining issue | User-visible effect | Disposition |
|---|---|---|---|
| High | Procedural terrain and materials do not reach photographic indistinguishability | The scene reads as a high-detail real-time reconstruction rather than documentary footage, especially in the wide view | Disclosed. Closing this requires field-derived terrain/photogrammetry and calibrated PBR capture, which are not present in the project |
| Medium | Cave interiors are shallow generic tunnels | Openings have real recess and wall thickness, but no room networks, murals or site-specific architecture | Disclosed; a named archaeological reconstruction would require a separate reference package |
| Medium | No balloon-to-balloon collision or wake model | Horizontal paths can converge over long unattended runs, though authored starting positions are separated and ground clearance is enforced | Disclosed; motion is an atmospheric illustration, not flight simulation |
| Medium | Headless software-WebGL capture is slow at 1440×900 Field quality | Automated screenshot generation can take tens of seconds per high-detail frame | Quality ladder works; hero fidelity is intentionally preserved per PROMPT2 priority order |
| Low | Far formation LOD uses one instanced source family | Repetition can be found in the far horizon under deliberate inspection | Accepted only in the far band where the prompt permits imperceptible instancing; density reduces first on lower quality |
| Low | No date-specific solar ephemeris | Clock time cannot be interpreted as a measured sunrise on a particular date | Explicitly labeled authored/illustrative in UI and method notes |

## Closed during rebuild

- Replaced one repeated nine-sided lathe chimney with unique high-resolution near/mid meshes and distant-only instancing.
- Replaced cylindrical caprocks with individually distorted, asymmetrical meshes.
- Replaced flat black cave planes on box buildings with extruded arched rims and recessed tunnel volumes integrated into rock forms.
- Replaced box baskets and minimally detailed envelopes with custom envelopes, cloth relief, seams, wicker, rigging and burner hardware.
- Replaced a single smooth orange heightfield with a connected trunk valley, tributary, dissected ridges, gullies and horizon relief.
- Added neutral clay, surface-normal and shadow inspection modes rather than relying on undocumented visual claims.

