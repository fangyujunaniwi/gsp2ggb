# gsp2ggb — The Geometer's Sketchpad (.gsp) ⇄ GeoGebra (.ggb)

[中文](README.md) | English

Convert **The Geometer's Sketchpad** `.gsp` files and **GeoGebra** `.ggb` files in both directions,
preserving **dynamic construction relations** wherever possible — midpoints, intersections,
perpendicular/parallel lines, angle bisectors, translations/rotations/dilations/reflections,
points on paths, distances and measurements are emitted as GeoGebra *commands*, not just frozen
coordinates. So in GeoGebra, dragging a free point still moves the whole figure.

## What it is good for
- Bring Sketchpad courseware into GeoGebra for editing or presentation.
- Take a GeoGebra document back to Sketchpad.
- Convert a whole folder of documents at once.

## Highlights
- **Bidirectional**: `.gsp → .ggb` and `.ggb → .gsp`.
- **Keeps constructive relations**: emitted as GeoGebra commands (`Midpoint`, `Intersect`,
  `Rotate`, `Reflect`, …) instead of dead coordinates.
- **Keeps interactivity**: points on segments/polygons/circles stay draggable and animatable, and
  action buttons (hide / show / animate / move / simultaneous) become GeoGebra button scripts.
- **Zero dependencies**: Node.js only, no `npm install`.
- **CLI + terminal UI (TUI)**: use whichever you prefer.
- **Never guesses**: objects that cannot be identified reliably are **skipped with a warning**
  (along with anything that depends on them), so the output file always opens — no silently wrong
  geometry.

## Requirements
- **Node.js 18 or newer** (tested on Node 24). Nothing else to install.
- The conversion itself is cross-platform; the screenshot/open-check scripts in the docs are
  Windows-only.

No Node yet? Grab the LTS build from <https://nodejs.org/>.

## Quick start

```bat
:: single file: .gsp -> .ggb (same name, different extension)
node bin\cli.js input.gsp

:: choose the output file
node bin\cli.js input.gsp -o out.ggb

:: reverse: .ggb -> .gsp
node bin\cli.js input.ggb -o out.gsp
```

When it finishes, open the generated `.ggb` in GeoGebra. (GeoGebra does **not** need to be
installed for the conversion to run.)

## Common commands

```bat
:: convert a whole folder of .gsp/.ggb; without --outdir it writes to <folder>\converted
node bin\cli.js "D:\my-sketches" --outdir "D:\out"

:: force a direction (default is inferred from the extension)
node bin\cli.js input.gsp --to gsp

:: quiet output
node bin\cli.js input.gsp -q

:: machine-readable output
node bin\cli.js input.gsp --json

:: self-test: no assets needed, just checks the program itself is healthy
node test\smoke.js
```

Other CLI options: `-o/--out`, `--outdir`, `--to ggb|gsp`, `-q/--quiet`, `--json`, `-h`.
A successful self-test prints `SMOKE PASSED`.

With npm scripts you can also use `npm run convert -- input.gsp -o out.ggb`, `npm run selftest`
and `npm run stats`.

## Terminal UI (TUI)

Prefer menus over typing?

```bat
node bin\tui.js
:: or
npm run tui
```

Browse and pick a `.gsp`/`.ggb` file or a whole folder, switch the conversion direction and output
location, run conversions and read the report. Press `w` for warning details and `o` to open the
output folder in your file manager. It also works in pipes/CI (it degrades to a line-based numbered
menu), so it stays scriptable.

## Reading the result
- **Open the generated `.ggb`**: points, lines, circles, polygons and measurements should render
  correctly, and dragging a free point should move the figure.
- **Nothing visible?** The converter does not auto-fit the view. Zoom in GeoGebra, or use the
  "Show All Objects" item in the View menu to locate the figure.
- **Some objects missing?** Check the warnings (or press `w` in the TUI). This is intentional:
  anything that cannot be identified is skipped rather than guessed, so the file always opens and
  the rest stays correct.

## Supported vs. intentionally not converted (short version)
**Supported**: points, segments, lines, circles, polygons, midpoints, all intersection kinds,
perpendicular/parallel lines, angle bisectors, translations/rotations/dilations/reflections,
points on paths, axes and unit points, functions and points on their plots, measurements
(length/distance/angle/ratio/area/perimeter/radius, …), text annotations and action buttons
(hide/show/animate/move/simultaneous).

**Intentionally not converted** (skipped with a warning): Sketchpad's **iteration / list /
custom-tool** family and a few button kinds (e.g. "scroll"); objects that depend on them are
skipped too.

The full per-type list and explanations are in [`TYPE_TABLE.md`](TYPE_TABLE.md) and
[`Tech_Details.md`](Tech_Details.md).

## FAQ

**Why are some objects missing?**
Objects whose meaning cannot be determined reliably are skipped with a warning, and dependents are
removed too, so the output always opens. See the warnings.

**Numbers in GeoGebra look like sliders or figures?**
Sketchpad measurement read-outs (length, angle, …) are intentionally kept **out of the graphics
view**; they still appear in the algebra view. Free numbers used as adjustable parameters stay as
draggable sliders — that is part of the dynamic behaviour.

**Why is a circle point's position not exactly the same?**
When the initial position cannot be recovered reliably from the file, we only guarantee the point
is **still on the circle and animatable**; the initial position is left to GeoGebra rather than
guessed.

**Does it need the internet?**
No. Everything runs locally and no file is uploaded.

## Documentation
| File | Contents |
|---|---|
| `README.md` / `README_EN.md` | This page — user guide (Chinese / English) |
| [`Tech_Details.md`](Tech_Details.md) | Technical details: type semantics, container format, ground truth, known limitations, dev tools (**in Chinese**) |
| [`TYPE_TABLE.md`](TYPE_TABLE.md) | Quick reference for every GSP object type (`tXX`) and binary record (tag) |
| [`HANDOFF.md`](HANDOFF.md) | Developer hand-off: progress, coverage baseline, next steps (Chinese) |
| [`SETUP.md`](SETUP.md) | Deployment: local paths, environment variables, packaging (Chinese) |

## Disclaimer

- This is an **unofficial** open-source tool. It is **not affiliated with, authorized, sponsored or
  endorsed by** Pearson (*The Geometer's Sketchpad*) or the GeoGebra project.
- "The Geometer's Sketchpad (GSP)", "GeoGebra" and their names/logos belong to their respective owners.
- This tool **performs file-format conversion only** and **does not include or distribute** any of the
  above software. Obtain those programs legally and comply with their licences.
- Conversion results are **not guaranteed** to match the original document exactly or to be usable
  (many objects are intentionally skipped — see "Supported vs. intentionally not converted" above).
  Always review the output yourself. The author accepts **no liability** for any loss arising from
  the use of this tool.
- Only convert files you have the **legal right** to use; do not use this tool for infringement.

## License
**MIT** — see [`LICENSE`](LICENSE).
