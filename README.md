# PiezoCalc

PiezoCalc (the **Pore Pressure Calculator**) is an installable Progressive Web
App (PWA) for the full field workflow around vibrating wire piezometers (VWP):
planning an installation, designing the grout, converting sensor calibration
sheets into pressures, taking and logging readings, and keeping a site diary.

The whole app is a single self-contained file (`index.html`) with inline
CSS/JS and no external network calls. A web manifest and service worker make
it installable on a phone or desktop and fully usable offline once loaded.
All data lives in the browser's `localStorage` on the device — nothing is sent
anywhere.

## Running it

It is hosted on GitHub Pages at
**<https://decidium.github.io/piezocalc/>** — open that on a phone or desktop
and use the browser's *Install* / *Add to Home Screen* prompt for an app-like
icon and offline use.

To run it locally instead you only need Node.js (no build step, no
`npm install` — the server uses Node's built-in modules only):

```
node ppc-serve.js          # serves on http://localhost:8080/
node ppc-serve.js 3000      # ...or on a chosen port
```

The server prints a `local` URL for the same machine and a `network` URL to
open from a phone on the same Wi-Fi/LAN.

## What it does

The app is organised around an **installation** (identified by a logger or
borehole ID). Everything below is stored per installation and the navigation
bar switches between the main areas.

### Installations & sensors (Setup)

- Create a new installation or reopen a recent one; a **Setup** screen lists
  recently used installation IDs.
- Manage the **sensor list** for the installation: each sensor carries its
  piezo ID, calibration equation and coefficients, zero reading (`R0`/`T0`),
  `equation_units` (Hz or digits) and an optional `rated_pressure_kpa`.
- **Import / export** the sensor set as JSON so a calibrated installation can
  be moved between devices or archived.

### Calibration equations

Four named calibration variants are supported, matching the forms found on
manufacturer sheets:

| Variant | Formula |
|---|---|
| **Linear A** | `P = G·(R0 − Ri) + K·(Ti − T0) + D` |
| **Linear B** | `P = G·(Ri − R0) + K·(Ti − T0) + D` |
| **Polynomial A** | `P = A·Ri² + B·Ri + C + K·(Ti − T0) + D` |
| **Polynomial B** | `P = (A·Ri² + B·Ri + C) − (A·R0² + B·R0 + C) + K·(Ti − T0) + D` |

`Ri`/`R0` are evaluated in whichever unit the sensor's `equation_units`
specifies. Bare `linear` / `polynomial` are accepted as legacy aliases for
`linear_a` / `polynomial_a`. Temperature comes from the reading in °C, or is
derived from thermistor resistance via the 5 kΩ Steinhart-Hart model.

### Taking readings

- **Single reading** for the active sensor: enter frequency (Hz or digits) and
  temperature (°C or thermistor ohms); the pressure, head and a live preview
  are shown, then logged with an optional comment and timestamp.
- **Reading sheet** for every sensor at once, organised into numbered
  **rounds**. Tab across the grid to fill it in, add one comment for the round
  or per-piezo comments, and log the whole sheet in one action. Rows are
  colour-banded against each sensor's rated pressure.
- **Field zero**: re-establish a sensor's `R0`/`T0` from a fresh reading, with
  a preview of the effect before you confirm.

### Rated-pressure warning bands

For any sensor with a `rated_pressure_kpa`, each result is classified by
`P / rated`:

| `P / rated` | Label |
|---|---|
| `< 80%` | under 80% of rated |
| `≥ 80%` | approaching rated |
| `≥ 100%` | over rated |
| `≥ 125%` | over 1.25× rated |
| `≥ 150%` | OVER 1.5× rated |

### Overpressure check

Back-solves each sensor's own calibration equation (linear or polynomial) to
report the reading — in digits and Hz, plus equivalent head — that corresponds
to the rated pressure and to chosen multiples of it, so a datalogger alarm
threshold can be set before deployment.

### Readings log

Per-sensor table of every logged reading with view, **CSV export** and clear.
The home screen also shows the latest reading per piezo and a pore-pressure
vs. time chart. Existing readings can be **imported from CSV**.

### Unit converter

Grouped conversions with adjustable decimal places:

- **Pressure**: kPa, hPa, bar, psi, atm, mmHg, mH2O, ftH2O, inH2O
- **Gauge / temperature factors**: `… / digit` and `… / °C` in psi, kPa, hPa,
  bar, mH2O
- **Vibrating wire**: Hz, digits (`Hz² / 1000`), period (ms)
- **Thermistor**: 5 kΩ ohms ↔ °C (Steinhart-Hart)
- **Temperature**: °C, °F, K

### Installation planner

Plans the physical string in the borehole:

- Borehole depth/diameter, galv trimmy piece length, stickup, toe depth and
  piece numbering direction.
- Any number of alcathene trimmy lines, plus an annular-fit check against the
  borehole.
- Piezometer target depths (add rows, space evenly, or clear).
- Produces an **installation schedule** (each piezo's depth, which trimmy
  piece it falls on, distance from that piece's toe/top and the nearest joint,
  with a joint-clearance warning) exportable as CSV, and a scaled
  **installation drawing** you can download as SVG or print to PDF.

### Grouting

- **Borehole volume**: annulus between the hole and the galv trimmy over the
  grouted interval, less alcathene and other displacement, plus a
  wastage/overbreak allowance. Geometry can be imported from the planner.
- **Bentonite-cement mix design**: presets (Mikkelsen & Green Mix A / Mix B,
  a stiff cement-bentonite W/C 1.5, a 6 % bentonite slurry) or a custom batch.
  Scales the batch to a target grout volume, either rounding up to whole
  batches or scaling exactly, and reports water / cement / bentonite
  quantities and whole bag counts, with mixing-order guidance.

### Site notes

A single timestamped diary for the whole installation — free-text entries with
date/time, shown newest-first and grouped by day, with export. Recent notes
also surface on the home screen.

## Requirements

- **To use it**: any modern browser. Nothing to install beyond the optional
  *Add to Home Screen*.
- **To serve it locally**: Node.js, for the small static file server in
  `ppc-serve.js` (built-in `http`, `fs`, `path`, `os` only).
- No runtime dependencies, CDNs or network calls.

## Files

| File | Purpose |
|---|---|
| `index.html` | the entire application (HTML + inline CSS/JS) |
| `ppc-manifest.webmanifest` | PWA manifest (name, icons, shortcuts) |
| `ppc-sw.js` | service worker — offline cache of the app shell |
| `ppc-icon-*.png` | app icons (192, 512, maskable 512) |
| `ppc-serve.js` | zero-dependency static server for local use |
