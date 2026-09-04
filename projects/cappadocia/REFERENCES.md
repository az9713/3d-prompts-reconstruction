# References and asset provenance

Checked 2026-09-03. External references inform the model; none are fetched by the application at runtime.

## Authoritative and technical references

| Reference | Institution / author | Use in the implementation | Status |
|---|---|---|---|
| [Göreme National Park and the Rock Sites of Cappadocia](https://whc.unesco.org/en/list/357/) | UNESCO World Heritage Centre | Connected ridges, valleys and pinnacles; erosion-sculpted volcanic landscape; integration of rock-hewn cells, churches and troglodyte settlements | Verified reference-derived |
| [World Heritage nomination evaluation 357](https://whc.unesco.org/archive/advisory_body_evaluation/357.pdf) | ICOMOS / UNESCO | Tuff sculpted by natural erosion; human architecture created by excavation rather than assembly | Verified reference-derived |
| [Fairy chimney development in Cappadocian ignimbrites](https://open.metu.edu.tr/handle/11511/17659) | M. Naci Sayın, Middle East Technical University, 2008 | Field ranges: 9.7–13.7 m basal diameter, 8.41–21.73 m height, 60–70° slopes, 5.45–42.72 m spacing, slight upslope asymmetry; role of welding, ignimbrite thickness and topographic slope | Verified reference-derived; used as a scale/family constraint, not copied coordinates |
| [General Solar Position Calculations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF) | NOAA Global Monitoring Division | Conventions for solar azimuth/elevation and the relationship between visible sun and illumination | Verified method reference; the scene values are authored rather than date-specific |
| [Balloon Flying Handbook FAA-H-8083-11](https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/FAA-H-8083-11.pdf) | U.S. Federal Aviation Administration | Hot-air lift, equilibrium/neutral buoyancy, burner heating, cooling, and wind dependence | Verified institutional source; implementation is a simplified visual approximation |

## Runtime assets

| Local filename | Source / creator | License | Transformations | Runtime use |
|---|---|---|---|---|
| None | — | — | — | The application has no external images, models, HDRIs, fonts, terrain files, or network calls. Geometry, PBR maps, fabric patterns, and the float HDR environment are generated locally and deterministically in code. |

## Documentation-only visual benchmark

| Local filename | Source / creator | License / rights note | Transformations | Use |
|---|---|---|---|---|
| `artifacts/reference-concept.png` | Generated for this project with OpenAI's built-in image-generation tool on 2026-09-03 | AI-generated project artifact; not an externally licensed photograph | None after generation | Composition and fidelity target only. It is not displayed by or shipped into the runtime scene. |

## Provenance boundary

The benchmark is not evidence that the real-time implementation matches a real location. Procedural meshes are deterministic artistic interpretations constrained by published proportions and processes. The rock-cut settlement does not reproduce a named church, dwelling, floor plan, mural, or archaeological configuration.

