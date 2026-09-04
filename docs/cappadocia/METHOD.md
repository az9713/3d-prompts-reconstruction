# Method and limitations

## Coordinate system and scale

One Three.js unit is one metre. `+X` is east, `+Y` is up, and `+Z` is south. The camera near plane is 0.35 m. The main terrain patch spans roughly 2.7 km east–west by 2.45 km north–south.

## Geology and world construction

The terrain is a continuous displaced mesh. A meandering trunk valley and one tributary are subtracted from a folded plateau; ridged multi-octave fields add drainage-like dissection and gullies. This is process-inspired procedural relief, not a DEM or erosion simulation.

Near and middle-distance formations are independent high-resolution radial meshes. Four radius families, seed-specific asymmetry, slope bias, fluting, fracture notches, stratified vertex color, multiscale tuff maps, surface-normal relief and unique distorted caprock produce non-identical silhouettes. Published Cappadocian measurement ranges guided the smallest families. Larger forms are deliberate landscape-scale artistic extrapolations. Only distant formations use instancing.

Cave openings are not opaque planes. Each uses a bevelled, extruded stone rim around an arched hole plus a recessed tunnel volume and back surface. They are embedded into formations aligned to terrain. This is a parallax-capable visual construction, not constructive-solid-geometry excavation or an archaeological plan.

## Materials

Tuff uses locally generated base-color, roughness and tangent-space normal maps plus height-related vertex color. Macro mottling, mesoscopic strata/streaks and microscopic granular normal relief are separated by frequency. These patterns are plausible weathering cues, not spectroscopic material measurements. Caprock, wicker, rope and hardware have separate PBR responses. No remote textures are loaded.

Balloon envelopes use a 24-gore custom mesh. The closest three add modeled seam tubes and small radial wrinkles; the fabric map adds weave-scale normal relief and colored panels. Baskets are custom tapered shells with modeled vertical reeds, horizontal woven bands, a thick rim, support frame, twin burners, tank and rope connections. Mid-range balloons retain rigging but omit woven detail. Far balloons reduce to envelope and basket silhouette.

## Lighting and astronomy

The authored state uses a solar azimuth of 108.5° clockwise from north and elevation of 5.8°. A later dawn control spans approximately 2.4–10.2° elevation. The sky shader, visible solar disc, directional light and a locally generated floating-point equirectangular environment share the same authored direction. The disc diameter is approximately 0.53°. ACES filmic tone mapping and a cool hemisphere fill retain shadow detail.

The control is not tied to a date, daylight-saving rule or measured weather record. Its displayed clock is narrative. Therefore the application does not claim ephemeris accuracy.

## Balloon motion

Gravity is 9.80665 m/s². Each balloon has an assigned volume, ambient density varying exponentially with height, a trim temperature, payload-equivalent mass and quadratic vertical drag. A thermostatic controller pulses the burner around a target altitude. Horizontal motion samples an altitude-dependent ENE wind of roughly 2–5 m/s. Ground clearance is enforced against the procedural terrain and out-of-world states reset to their authored positions.

This is a conservative visual approximation. It omits envelope pressure fields, fabric deformation under load, fuel mass change, pilot decision-making, launch/landing procedures, wake turbulence, gust spectra, valley-flow measurement, aviation separation standards and balloon-to-balloon collision dynamics. It must not be used for training or navigation.

## Camera and quality

Five presets cover the authored first frame, human-scale valley floor, close construction inspection, rock-cut settlement and whole-valley survey. Orbit controls clamp dolly distance and polar angle; every frame also enforces a minimum 3.2 m terrain clearance.

The quality ladder reduces, in order, distant formation count, visible far balloons, dust, device pixel ratio and shadow-map resolution. It never replaces or decimates the hero balloon or authored near geology.

## Accessibility and lifecycle

All controls are keyboard-focusable and labeled. `prefers-reduced-motion` starts the simulation paused and makes preset transitions immediate. Pause and reset are explicit. Generated geometries, materials, textures, controls, environment map and renderer are disposed on page hide.

## Known uncertainties

- The terrain does not reproduce exact Göreme coordinates or named valleys.
- Hoodoo heights beyond the published field range are artistic landscape-scale forms.
- Cave shapes are generic recessed arched openings without interior architecture.
- The wind profile is plausible but not measured.
- The authored clock and Sun are illustrative, not a date-specific astronomical solution.
- No photogrammetric, LiDAR, HDRI, or field-calibrated reflectance data were used.

