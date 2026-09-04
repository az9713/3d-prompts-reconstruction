# Stonehenge — Shadow & Solstice Explorer

> **Model provenance:** this prototype was created by a GPT-5.6-family coding model from a reconstructed prompt intended to test the GPT-6 Astra behavior shown in [Peter Gostev's video](https://www.youtube.com/watch?v=GQPi39sjNhU). It is not a GPT-6 output and does not reproduce Peter's hidden prompt verbatim.

An interactive Three.js explorer of the **present-day** Stonehenge monument and its surrounding Salisbury Plain landscape. It intentionally preserves gaps, fallen stones, and the incomplete surviving outer sarsen circuit; it does not offer a reconstructed-era mode.

## Run locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. For a production check:

```powershell
npm run build
npm run preview
```

## Controls

- Drag to orbit, scroll to dolly, and use the named camera views or **Reset to Avenue**.
- Choose **Midsummer** or **Midwinter** for the calculated 2026 solstice-event positions.
- Move either solar slider to switch to manual azimuth/elevation; manual values override a selected preset.
- Open the compact **Solar controls** dock to adjust the scene without leaving a large panel over the monument. Toggle the grass wind, visitors, and the alignment guide. The quality menu exchanges dense distant grass/clouds and live shadow-map updates for a cheaper scene while preserving the monument.
- Visitors occupy two separated perimeter lanes outside the earthwork and a third loop along the Avenue. Each lane maintains uniform spacing so people do not intersect one another or the stones.

## Astronomical method and limits

The model uses the English Heritage Stonehenge visitor-site coordinate: **51.1831565223° N, −1.85887471623° W**, and a fixed modern reference year of **2026**.

> **Known accuracy limitation:** this is the visitor-site coordinate rather than the monument coordinate. The reconstruction report recommends approximately 51.179° N, 1.825° W for a future accuracy pass.

Midsummer is calculated for the 2026 June 21 summer-solstice sunrise, and Midwinter for the 2026 December 21 winter-solstice sunset. The included compact solar calculation follows NOAA/Meeus-style solar geometry: a seasonal solar declination is used with the latitude and a solved solar hour angle. Sunrise and sunset use the conventional apparent solar-center altitude of **−0.833°**, combining nominal atmospheric refraction and the solar semidiameter. Azimuth is measured clockwise from north and elevation upward from the flat local horizon.

The scene uses a flat horizon and standard nominal refraction, and it turns each outer sarsen upright into a geometric projected shadow using the current light vector. Atmospheric conditions, local terrain horizon, survey-grade stone geometry/positions, historical landscape changes, and archaeological sight-lines are outside scope. This is a modern astronomical visualization—not an archaeological-survey reconstruction.

### Sources

- [English Heritage — Stonehenge Directions](https://www.english-heritage.org.uk/visit/places/stonehenge/plan-your-visit/directions/) (coordinate)
- [NOAA Global Monitoring Laboratory — Sunrise/Sunset Calculations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF) (solar geometry and 90.833° sunrise/sunset zenith)
- [NOAA Solar Position Calculator](https://gml.noaa.gov/grad/solcalc/azel.html) (azimuth/elevation convention)
