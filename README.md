# PiezoCalc

PiezoCalc is an installable Progressive Web App (PWA) for vibrating wire
piezometer (VWP) pore pressure calculation. It is a browser-based sibling of
the [CLI Pore Pressure Calculator](../CLI-Pore-Pressure-Calculator), and is
the more feature-rich of the two: it supports **four** calibration equation
variants (versus the CLI's two) and adds rated-pressure warning bands that
flag when a reading is approaching or exceeding a sensor's rated pressure.

The whole app is a single self-contained HTML file
(`pore_pressure_calculator_v11.html`) plus a manifest and service worker that
make it installable on a phone or desktop like a native app.

## Running it locally

You need Node.js (any reasonably recent version) only to serve the files —
there is no build step and no other dependency.

```
node ppc-serve.js
```

Optionally pass a port number (defaults to `8080`):

```
node ppc-serve.js 3000
```

The server prints a local URL and a network URL, e.g.:

```
Serving <this folder>
  local:   http://localhost:8080/
  network: http://192.168.1.23:8080/   (open this on the phone)
```

Open the `local` URL on the same machine, or the `network` URL from a phone
or other device on the same Wi-Fi/LAN. Because the app ships a
`ppc-manifest.webmanifest` and a service worker (`ppc-sw.js`), the browser
will offer an "Install" / "Add to Home Screen" prompt — installing it gives
you an app-like icon and (after the first load) offline use.

## Requirements

- Node.js, to run the tiny static file server in `ppc-serve.js` (it only uses
  Node's built-in `http`, `fs`, `path`, `os` modules — no `npm install`
  needed).
- Nothing else. The app itself is a single HTML file with inline CSS/JS; no
  external network calls or CDN dependencies at runtime.

## Physics / Equations

All formulas and thresholds below were confirmed directly against the JS in
`pore_pressure_calculator_v11.html`.

### Steinhart-Hart thermistor equation (Ohms → °C)

```js
function ohms2c(R, A, B, C) {
  A = A||DA; B = B||DB; C = C||DC;
  if (R <= 0) return NaN;
  const l = Math.log(R);
  return 1/(A + B*l + C*l*l*l) - 273.15;
}
```
i.e. `T(°C) = 1 / (A + B·ln(R) + C·ln(R)³) − 273.15`, using the `−273.15`
Kelvin→Celsius offset. Default coefficients (`DA`, `DB`, `DC`):

```js
const DA = 1.4051e-3, DB = 2.369e-4, DC = 1.019e-7;
```

### Frequency ↔ digits

```js
function hz2dig(hz) { return hz*hz/1000; }
function dig2hz(d)  { return Math.sqrt(d*1000); }
```
i.e. `digits = Hz² / 1000` and `Hz = sqrt(digits × 1000)`.

### Equation variants (`EQS` object)

PiezoCalc supports four named calibration equation variants, each with its
own formula and note exactly as defined in the code:

```js
const EQS = {
  linear_a:     {label:'Linear A',     kind:'linear',
                 formula:'P = G × (R0 − Ri) + K × (Ti − T0) + D',
                 note:'Standard vibrating wire form. Pressure is referenced to the zero reading R0.'},
  linear_b:     {label:'Linear B',     kind:'linear',
                 formula:'P = G × (Ri − R0) + K × (Ti − T0) + D',
                 note:'As Linear A but with the reading difference reversed (positive gauge factor sheets).'},
  polynomial_a: {label:'Polynomial A', kind:'poly',
                 formula:'P = A·Ri² + B·Ri + C + K × (Ti − T0) + D',
                 note:'Absolute polynomial. The calibration constant C sets the datum; R0 is not subtracted.'},
  polynomial_b: {label:'Polynomial B', kind:'poly',
                 formula:'P = (A·Ri² + B·Ri + C) − (A·R0² + B·R0 + C) + K × (Ti − T0) + D',
                 note:'Zero-referenced polynomial. The polynomial is also evaluated at R0 and subtracted.'}
};
```

Symbols, as used across all four variants:
- `G` — linear gauge factor
- `R0` — zero-reading reference value (in whichever unit `equation_units`
  specifies — Hz or digits; see below)
- `Ri` — current reading, in the same unit as `R0`
- `K` — temperature coefficient
- `Ti` — current temperature, °C
- `T0` — temperature at the zero reading, °C
- `D` — offset
- `A`, `B`, `C` — polynomial coefficients (`poly_coefficient_A/B/C`)

Note that unlike the CLI tool's polynomial equation, PiezoCalc's Polynomial A
and Polynomial B variants both include the `+ D` offset term. Also note that
`Ri`/`R0` here are evaluated in whichever unit the sensor's `equation_units`
field specifies (`hertz` or `digits`) — see `eqVal`/`eqUnits` in
`pFromDigits()` — not fixed to digits as in the CLI tool's polynomial form.

`linear`/`polynomial` (without a suffix) are accepted as legacy aliases and
normalized to `linear_a` / `polynomial_a` respectively (`normEq()`).

### Rated-pressure warning bands (`ratedInfo()`)

For a sensor with a configured `rated_pressure_kpa`, PiezoCalc computes
`pct = P / rated × 100` and classifies the current reading:

| Threshold (`pct`) | Label | CSS class |
|---|---|---|
| `< 80%` | under 80% of rated | `p-ok` |
| `>= 80%` | approaching rated | `p-near` |
| `>= 100%` | over rated | `p-warn` |
| `>= 125%` | over 1.25x rated | `p-over` |
| `>= 150%` | OVER 1.5x rated | `p-crit` |

(Thresholds are checked from highest to lowest in the code, so a reading at,
say, 160% of rated is reported as "OVER 1.5x rated", not any of the lower
bands.) If no `rated_pressure_kpa` is configured for a sensor, `ratedInfo()`
returns `null` and no banding is shown.
