# gsp-conv — The Geometer's Sketchpad (.gsp) ⇄ GeoGebra (.ggb)

[中文](README.md) | English

Bidirectional converter that preserves **dynamic/constructive relations** (not just coordinates)
where possible: midpoints, intersections, perpendicular/parallel lines, angle bisectors,
transformations, point-on-path, distances, slopes, etc. are emitted as GeoGebra *commands*
and, in reverse, as GSP *construction objects*.

## Requirements
- Node.js ≥ 18 (tested on v24).

## Usage

```bat
:: single file (.gsp -> .ggb)
node bin\cli.js input.gsp
node bin\cli.js input.gsp -o out.ggb

:: single file (.ggb -> .gsp)
node bin\cli.js input.ggb -o out.gsp

:: force a direction
node bin\cli.js input.gsp --to gsp

:: batch a whole folder (every .gsp/.ggb), output dir defaults to <folder>\converted
node bin\cli.js "D:\Some\Folder" --outdir "D:\Out"

:: quieter output
node bin\cli.js input.gsp -q

:: self-contained smoke test (no corpus needed)
node test\smoke.js

:: terminal UI (pure Node + ANSI, no third-party deps)
node bin\tui.js
```

No third-party dependencies; Node.js ≥ 16 only. Diagnostic scripts take the corpus path as their
first argument or read it from the `GSP_DIR` environment variable (see `SETUP.md` for the full
list of path variables and for packaging a clean hand-off zip with `tools\package.ps1`).

`bin/tui.js` is an interactive terminal UI: browse and pick a `.gsp`/`.ggb` file or folder,
switch the conversion direction and output location, run conversions and inspect the report /
warnings (`w` for warning details, `o` to open the output folder in the file manager). On a
non-TTY (pipes / CI) it degrades to a line-based numbered menu, so it stays scriptable; it can
also be started with `npm run tui`.

## Architecture

| File | Role |
|---|---|
| `src/zip.js` | ZIP read/write for the `.ggb` container (`unzip`/`zip`/`crc32`). |
| `src/gsp.js` | `.gsp` reader: decodes the `GSP4` record chain into an IR (intermediate representation). |
| `src/ggb.js` | `irToGgb` (IR → GeoGebra XML → `.ggb`) and `ggbToIR` (`.ggb` → IR). |
| `src/convert.js` | Conversion entry point shared by the CLI and the TUI (`convertBuffer`). |
| `src/tui-util.js` | TUI helpers: directory listing, batch job planning, CJK display width/truncation. |
| `src/ir2gsp.js` | IR → `.gsp` writer. Clones real per-type record blocks from `src/gsp-template.json`, patches parents/coords/params/labels, and writes a valid `GSP4` file. |
| `src/gsp-template.json` | Template library: header/tail + 215 real object-block skeletons covering ~120 GSP type codes (built by `tools/build-template.js`). |
| `bin/cli.js` | Command-line front end. |
| `bin/tui.js` | Interactive terminal UI (pure Node + ANSI); degrades to a line-based menu on a non-TTY (pipes/CI). |

### Intermediate representation
Each object has `{ id, label, kind, srcType, parents[], coords|null, params[], value, color }`.
Coordinates are normalised to **GeoGebra units**; `SCALE = 50` GSP logical units per GGB unit.

## GSP container facts (reverse-engineered)
- Magic `GSP4`, then a chain of `u32 payloadLen | u32 tag | payload` records (little-endian).
- `2000` object start (28 B; `u16[0]` = type), `2002` parent ids, `2003` params
  (`u32 type echo` + doubles), `2005` label (22-byte prefix + `u16 len` + string),
  `2007` object end, `2201` point coords, `2311`/`2306`–`2310` type-specific content.
- Header/tail bookkeeping: `tag 1000` carries the **object count at byte offset 24** —
  GSP *validates* this on load. `tag 9000`/`9005` in the tail are **not** validated.
- Header/tail must come from a clean, simple, known-good file (we use `未命名1.gsp`).
  Complex source files carry per-object header lists that make good templates poor donors.

## Validation
- `gsp → ggb`: output is well-formed XML (verified with .NET `XmlDocument`) **and opens in a
  real GeoGebra Classic 5.4** (`D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe`), rendering
  points/segments/numerics in the algebra view. Verified per-file with `tools\ggbcheck.ps1`.
- `ggb → gsp`: generated files were opened in the real **几何画板 5.06** (`D:\Sketchpad5`)
  and render correctly; both directions round-trip.
- The `.ggb` **header/settings block must use exactly the element names and enum values
  GeoGebra accepts**. In particular `<kernel>` must use `<angleUnit val="degree"/>`,
  `<coordStyle>`, `<angleFromInvTrig>`; **not** `<angleUnit val="0"/>`, `<coordMode>`,
  `<missingsVal>`, `<locusMode>`, `<probabilityType>`. `<scripting>` must be
  `<scripting blocked="false" disabled="false"/>`. A wrong header makes GeoGebra 5.4 reject
  the file with "打开文件失败" even though the `<construction>` objects are valid (isolated with
  `tools\hybrid.js` header/body cross-tests). The header is modeled on a known-good file.

## Type semantics (verified against named control sketches)
The object type codes were ground-truthed with the small, name-descriptive `.gsp` samples from
the `m-ezekiel/GeometersSketchpad` repository (e.g. `polygon_reflections.gsp`,
`area_parallelogram.gsp`, `hexagon_by_rotations.gsp`, `angle_bisector.gsp`). Confirmed mappings:
- `t8` = polygon interior (vertex parents) → `Polygon(...)`.
- `t34` = reflection (preimage + mirror line/segment/point) → `Reflect(...)`; a **circle** mirror is
  reflection *in a circle* = **inversion**, which GeoGebra's `Reflect(<Object>, <Circle>)` also
  performs, so it is emitted straight through. Reflections whose mirror is an affine image of a
  line/segment rebuild the mirror's supporting line.
- `t41` / `t113` = angle (3 points, middle = vertex) → `Angle(A,B,C)`; `t120` = its measurement.
- `t64` = circle (center + on-point or radius segment) → `Circle(...)`.
- `t17` = fixed-offset point (parent + pixel offset `(dx,dy)`, y-down) → `(parent)+(dx/50,-dy/50)`.
- `t15` on a circle stores the position as a **(cos,sin) unit direction** (**y-up**, whereas point
  coordinates are y-down) or as a single parameter (animation state, not a decodable position);
  on a segment/line it stores the parameter `t`.
- `t15` on a **segment/polygon** → `Point(path)` plus explicit `<coords x y z>`, i.e. a
  *free-on-path* point. GeoGebra only animates a path point whose `AlgoPointOnPath` has no
  parameter (`isChangeable() == (param == null)`), and it restores the position — and thus the
  path parameter — from `<coords>` (`GeoPoint.setCoords` → `path.pointChanged`).
  `Point(path,t)` is geometrically right but permanently non-animatable, so it is only a
  fallback for when the position cannot be resolved numerically (`gspPosXY`).
- `t15` on a **circle** → `Point(circle)` (no parameter), a *free point on the circle*, so the
  constraint is preserved and the point is animatable. When the position is stored as a
  (cos,sin) unit direction and both the center and radius resolve numerically, an explicit
  `<coords>` is added. The stored direction lives in a **y-up** frame while GSP's point
  coordinates are y-down, so the position is center + radius·(px, −py) (verified against a
  GSP render of `ref-ctrl/angle_bisector.gsp`). When the position instead uses the
  **one-parameter** form (whose value is animation state, not a decodable position), or the
  center/radius cannot be resolved, no `<coords>` is emitted and the initial path parameter
  is left to GeoGebra rather than guess.
- `t15` on an **affine image of a segment** → `Point(path,t)`. GeoGebra's segment path
  parameter is exactly φ(X,A,B), matching GSP (verified against the GeoGebra manual).
  GeoGebra's *line* parameter is a nonlinear remap, so points on lines are not emitted this way.
- `t62` = action button (always carries button record `2310`). The record's first `u16`
  (at offset 12) is the kind: `0` hide, `1` show, `2` animate, `3` move, `4` scroll,
  `7` simultaneous/toggle, `8`/`9` unknown; offsets 20/22 are the button's sketch
  `(left,top)`. Emitted as a GeoGebra `<button>` with a click script (`<ggbscript>`):
  kind `0`/`1` → `SetVisibleInView(target,1,false/true)`, kind `2` → `StartAnimation(target,true)`.
  An animate button is kept only for targets GeoGebra can actually animate: a free-on-path point
  (segment/polygon) or a circle free-on-path point carrying `<coords>` — functions, transformed
  paths and plain numbers/parameters are skipped (a `GeoNumeric` also needs an active slider
  interval to be animatable).
  Kinds `3`/`4`/`7`/`8`/`9` have no faithful GeoGebra equivalent and are skipped.
  **Not** a polygon (the old polygon mis-mapping was removed).
- `t58`/`t59` = coordinate axes (`Axis4`); `rich[2309]` u32 selects horizontal (1) / vertical (0).
  Emitted as a `Line` through the axis origin. `t52`/`t54`/`t55` = coordinate unit points
  (`UnitPoint`/`SquareUnitPoint`/`RectangularUnitPoint` in the JavaSketchpad truth).
- `t61` = coordinate system (`gCoordSys`); `t67` = `PlotFixedXY` (point at fixed `(x,y)` in a
  coordinate system) → `origin + (x·ux, -y·uy)`; `t49` = `CoordinatePair` → dynamic `"(x, y)"` text.
- **Sketch coordinate frame.** A `t61` coordinate system is defined by two `t58` axes, each with an
  origin point and a unit point. The origin is the common base of the unit points (resolved through
  `t52`/`t54`/`t55` chains by `unitPointOrigin`), and the unit vectors are the origin→unit offsets.
  The unit **scale** comes from `unitScaleOf`: `t52` (horizontal `UnitPoint`) and `t55`
  (`RectangularUnitPoint`) use their stored distance, but **`t54` (`SquareUnitPoint`) inherits the
  scale of its parent unit point** — its stored value is a leftover (usually the 1 cm default,
  37.795) and must not be read as the y scale, or the frame is squashed and every coordinate is
  misplaced. GSP **functions plot in frame units while ordinary points/segments live in sketch-pixel
  space**, which is why a plain pixel mapping misplaces every function relative to its points. When a
  sketch contains functions (`t71`/`t78`/`t72`) **and exactly one** coordinate system **and** the
  frame is non-degenerate (unit ratio within `[0.2, 5]`), `sketchFrame()` switches the whole
  conversion to frame coordinates — points, lines, segments, free numbers, the `coordSystem` view and
  the `yscale` aspect all follow. Otherwise the plain pixel mapping is kept (and the axes are drawn as
  ordinary lines), so files without functions are unaffected.
- **Constant functions.** A function whose expression has no free variable (e.g. GSP's constant
  `f(x)=√3`) is emitted as `<label>(x)=<expr>`. Without the variable prefix GeoGebra 5.4 loads the
  `type="function"` element as a **number** and renders it as a slider instead of drawing its graph.
- **Measurement numbers are not drawn.** Every GSP measurement read-out (slope / length / angle /
  ratio → GeoGebra numeric) is emitted with `<show object="false">`. GeoGebra renders *every* shown
  number as a slider-like figure in the graphics view, which is exactly the "数字变成函数/图形" symptom;
  GSP shows such measurements as text labels. The value still appears in the algebra view under "Numbers".
  Free numbers (parameters) keep `<show object="true">` so they remain draggable sliders, preserving
  the dynamic relation.
- **Function plots (`t72`) and points on them (`t15`).** `t72`'s `tag 2306` record holds the plotted
  x-domain `[xmin, xmax]` in frame units; the plot's first parent is the plotted function. A `t15`
  point on a plot stores the domain fraction `t`, so it is emitted as `(x0, f(x0))` with
  `x0 = xmin + t·(xmax-xmin)`, referencing the function object (not the plot). The `t72` plot itself
  is skipped — GeoGebra draws it from the function.
- Points on straights use the exact GSP reference pairs (verified by CFR-decompiling `jsp5.jar`):
  segment/line → endpoints; parallel → `P∓d/2`; perpendicular → `P∓perp(d)/2`; angle bisector →
  the `√9000/(2·SCALE)` formula; polygon → per-edge `offset/n` (`n` = vertex count).
  **NB:** `.gsp` stores `perpLine`/`parallelLine` parents as `[throughPoint, baseStraight]`
  (corpus-confirmed: t5's most common signature is `[midpoint, segment]`), matching GeoGebra's
  `PerpendicularLine`/`ParallelLine`(Point, Line) argument order.
- `t24` = deep iteration point, `t35`/`t89`/`t77`/`t32` = loci / custom tools / samplers;
  intentionally left unmapped (mapping them blindly would emit wrong constructions).
- **Affine-transform family** (ground-truthed with user-authored marked-transformation control
  sketches in `ref-ctrl/jsp-samples/mark_*.gsp+.htm`, aligned by construction order). The CFR
  decompilation of `jsp5.jar` gives the exact class→spec→arity mapping:

  | type | class (decomp) | JSP spec | parents | GeoGebra |
  |---|---|---|---|---|
  | `t16` | `VectorTranslation` | `VectorTranslation` | preimage + A + B | `Translate(pre, Vector(A,B))` |
  | `t27` | `Rotation` | `Rotation` | preimage + center (+ fixed angle) | `Rotate(pre, θ°, center)` |
  | `t28` | `MarkedAngleRotation` | `Rotation/MarkedAngle` | preimage + center + A + B + C | `Rotate(pre, Angle(A,B,C), center)` |
  | `t29` | `MeasuredAngleRotation` | `Rotation/MeasuredAngle` | preimage + center + angle-measure | `Rotate(pre, Angle(A,B,C), center)` |
  | `t30` | `Dilation` | `Dilation` | preimage + center (+ ratio) | `Dilate(pre, k, center)` |
  | `t31` | `Dilation2S` | `Dilation/SegmentRatio` | preimage + center + numSeg + denomSeg | `Dilate(pre, Length(s1)/Length(s2), center)` |
  | `t33` | `DilationMR` | `Dilation/MarkedRatio` | preimage + center + ratio-measure | `Dilate(pre, <ratio>, center)` |
  | `t34` | `Reflection` | `Reflection` | preimage + mirror | `Reflect(...)` |

  `t28` (979 in corpus) and `t31` are fully reconstructed. `t29`/`t33` resolve the marker first to a
  3-point angle (`t41`/`t113`/`t120`) or a measured ratio (`t47`, see below); otherwise they fall back to
  the marker's own decoded `tag 2311` program — i.e. the marked value itself (a marked **angle** is used
  in radians, matching GeoGebra's internal angle representation; a marked **ratio** is dimensionless).
  Only markers whose value the decoder cannot recover are skipped.

  **`t47` = `SimpleMeasure` "Ratio"** (decompiled `SimpleMeasure.java` + `computed3PtRatio.java`), emitted
  as a GeoGebra **numeric** (not just as a dilation marker):
  - *Ratio/Segments* (measureType 8, two segment parents) → `Length(s1)/Length(s2)`;
  - *Ratio/Points* (measureType 11, three point parents `[A,B,C]`) → `|AC|/|AB|`, made **negative when
    angle BAC > 90°**. The sign equals the sign of the dot product A→B · A→C (orientation-independent).
    It is written with coordinate differences (`x()`/`y()`) rather than `Vector()`/`Distance()`: GeoGebra
    types an expression of the form `P + t*(Q-P)` (how points on segments/lines are emitted) as a
    **vector**, so `Vector(P,r)`/`Distance(P,r)` on such an object compute the wrong thing. Concretely:
    `If((x(B)-x(A))*(x(C)-x(A)) + (y(B)-y(A))*(y(C)-y(A)) < 0, -1, 1) *
    sqrt((x(C)-x(A))^2+(y(C)-y(A))^2) / sqrt((x(B)-x(A))^2+(y(B)-y(A))^2)`.
  A `t33` whose marker is a `t47` (often wrapped in a `t48` label) references the emitted numeric object.
  Unsupported `t47` parent shapes are still skipped rather than guessed.
- **`t21`** **was identified on 2026-10-02: it is a polar translation (`PolarTranslation`), not a
  rotation.** tag 2003 (60 B): `+4`=−sinθ, `+12`=cosθ, `+20`=θ (display only, unreliable; always use
  `atan2(-p[0], p[1])`), `+32`=**translation distance d1 (in file coordinates)**, `+40`=the same
  distance in centimetres. Semantics: `image = parent + d1·(cosθ, −sinθ)` (file frame is y-down).
  The earlier guess "rotation about the implicit/marked centre" is disproven by ground truth
  (`mark_center_rotate_fixed.gsp` yields `t27`). **The object is still skipped; decoding/emission
  is pending.**
  `t30` stores the ratio in `params[0]`; `t27` stores `(-sinθ, cosθ, θ, 0)` and the angle
  is derived as `atan2(-p[0], p[1])·180/π` (GSP is y-down, GeoGebra y-up).

## JavaSketchpad text (ground truth for text/function/measure)
Sketchpad can export a sketch as an interactive web page ("File → Save As → file type
**JavaSketchpad**", `*.htm`; registered copies only). That page carries the whole construction
as a plain-text `Construction` applet parameter:

```
{1} Point(310,195)[color(109,116,114)];
{7} Function(15,170,'y = f(x) = 1 / (1 + sgn(sin(x)))...', '1 x @sin_ @sgn_ 1 + / ')()[black];
{9} Point on object(8,.95)[black];
```

`src/jsp.js` reads this format (`extractConstruction` / `parseConstruction`), replicating the
jsp5.jar parser (`Sketch.parseConstruction`); `tools/jspextract.js` is the CLI. Unlike the `.gsp`
binary, the text keeps expression strings, labels and measure metadata in the clear, so it is the
intended ground truth for the undecoded `tag 2311` object graph (see HANDOFF). Sample:
`ref-ctrl/jar/testfile.html`.

Pairing a `.gsp` with its exported `.htm` confirmed the object order is **construction order on
both sides** (JavaSketchpad simply *drops* objects it cannot render, e.g. measures/buttons), so the
two lists align element-by-element. This immediately decoded the inline text format and, crucially,
revealed that a `2311` program is the **same expression** the `.htm` writes in postfix, re-encoded in
**in-order form with explicit parentheses** — the key that cracked the `2311` decoder
(see *Known limitations*).

```bat
node tools\jspextract.js page.htm            :: human summary
node tools\jspextract.js page.htm --json     :: parsed object array
node tools\jspextract.js page.htm --out o.json
```

## Known limitations
- Free-number **values** *are* recovered: a GSP free number/parameter stores its value as a
  constant program in `2311`, so a parameter `a = 2` is emitted as a free number `2` (previously
  assumed 0 with a warning).
- **Fixed-text annotations** (type 0 objects carrying a `tag 2300` record) *are* decodable:
  the message is stored inline as plain UTF-8 wrapped in light markup (`<T23x…>` text runs,
  `<VL`/`<H`/`<SR…>` containers), and is emitted as a GeoGebra `Text` object. `decodeGspText()`
  in `src/gsp.js` strips the markup; verified byte-for-byte against the paired JavaSketchpad
  exports (see `ref-ctrl/jsp-samples`).
- **Calculate / function expressions (`tag 2311`) are decoded.** A `2311` payload ends with a token
  program of `COUNT*2` bytes (`COUNT` = u16 at offset 12 of the inner record that starts
  `07 09 00 00`). Each token is a little-endian u16 whose high byte is a class: `0x00` literal
  characters/digits (`. ( )` π e `x`), `0x01`/`0x02` unit tags on the preceding number, `0x10` binary
  operators (`+ - * / ^`), `0x20` predefined function, `0x60` parent reference, `0x70`
  parent-as-function reference. The program is the expression in **in-order form** (a re-encoding of the postfix the JavaSketchpad export writes) using
  **standard operator precedence** (so `-x^2` is `-(x²)`, not `(-x)²`). `src/expr.js`
  decodes it; programs containing an undecoded token (`0x1005`, `t122`) are skipped, never guessed.
- **Predefined functions** (`0x20` payload, established from corpus captions/behaviour):
  `0 sin, 1 cos, 2 tan, 3 asin, 4 acos, 5 atan, 6 abs, 7 sqrt, 8 ln, 9 log10, 10 sgn, 11 round,
  12 trunc`. GSP trig uses the sketch's **angle unit**; the sketches that use it are in radians
  (verified via `演奏原理`'s `sin(264·2π·x)` and `正弦型函数`'s `sin(2x+π/3)`), so degree-tagged
  literals are converted (`?101` ⇒ ×π/180). GeoGebra evaluates trig in radians, so the mapping is
  direct. `trunc` has no GeoGebra equivalent and is emitted as `sgn(x)*floor(abs(x))`.
  GSP **function** (type 71), **derivative** (type 78) and free-number **function** objects are
  emitted as GeoGebra `Function` objects; **plots** (type 72) are skipped because GeoGebra draws the
  function itself.
- Objects that still need unmapped `2311` values of measures/`t94`/`t90`/`t21` are skipped
  (with cascading dependents). `t29`/`t33` markers are no longer in this list: they resolve to a
  3-point angle / measured ratio, or fall back to the marker's own decoded `2311` value (see the
  affine-transform table above). `t47` is now mapped in full (`t47` is no longer a skip cause).
- Some variable-length records omit one trailing pad byte from their stored length. This
  affects `tag 1300` (embedded PNG) and `tag 9009` (document metadata/list record). Without
  skipping the pad, every following record is off by one (tags show as `0x3EF00`, `0x38700`,
  ...). `parseRecords` now skips a pad byte only when the tag at the declared boundary is
  implausibly shifted (`>= 0x10000`) and a normal 16-bit tag appears one byte later.
- `.ggb → .gsp` maps the verified reverse of each semantic: `Polygon→t8`, `Reflect→t34` (mirror
  may be an inline `Line(a,b)`/`Segment(a,b)`, resolved back to the endpoint-sharing line/segment
  object), `Rotate(pre, Angle(A,B,C), c)→t28`, `Dilate(pre, Length(s1)/Length(s2), c)→t31`,
  `Angle→t41`, `Distance→t37`, `Length→t36`, `Slope→t87`. A perpendicular `Foot` has no
  verified GSP object type and is skipped rather than mis-emitted.
- Generated labels are assigned only after **every explicit label is reserved**, so an unnamed
  object can no longer steal a later object's explicit name (previously an unnamed segment could
  take `O` before the explicit point `O` was seen, breaking its dependents).
- Some `perpLine`/`parallelLine` objects (t5/t6) have a **circle** as their base (433 in the local
  1430-file corpus, e.g. `PerpendicularLine(M, t)` with `t` a circle). GSP's exact semantics for
  "perpendicular/parallel to a circle" is unconfirmed, so these are emitted as-is (GeoGebra opens
  the file but leaves that object undefined) rather than guessed.
- A circle point stored with **one parameter** (`t15`) does not expose a decodable position: the
  value does not match the point's rendered angle in the corpus (it is animation state / a
  constraint handle). Such points are kept as `Point(circle)` (correct constraint and
  animatability) with the initial position left to GeoGebra — the value is **not** guessed.
  Points stored as a (cos,sin) unit direction restore their exact position
  (center + radius·(px, −py); the stored direction is y-up while GSP point coords are y-down).
- The GSP view is not auto-fitted after conversion.
- **Known typing caveat:** points on a segment/line path are emitted as `P + t*(Q-P)`. GeoGebra 5.4
  types that arithmetic form as a **vector** (not a point), even though the coordinates are correct.
  It is coerced to a point in most contexts (segment endpoints, dilation centers), but commands that
  distinguish points from vectors — `Vector(P,r)`, `Distance(P,r)`, `Angle(P,r,S)` — misbehave on such
  objects. New expressions that consume these points should use `x()`/`y()` coordinate arithmetic (as
  the `t47` ratio does) until the point-on-path emission is switched to the point-typed
  `Point(<path>, t)` form.

## Development tools (`tools/`)
`build-template.js` (build the skeleton library), `try-conv.js` (smoke test), `reserialize.js`
(byte-identity check), `splice.js` / `rebuild.js` (record surgery), `dump-one.js` / `dump-hdr.js`
(record inspection), `patch2003.js` / `patch-double.js` (perturbation experiments),
`validate.js` (extract `geogebra.xml`), `pack.js` (repack a `.geogebra.xml` into a `.ggb`),
`hybrid.js` (splice header/body from two geogebra.xml files), `ggbcheck.ps1` (open a `.ggb` in
GeoGebra 5.4 and report success by window title; auto-detects the usual install paths),
`corpus.js` (recursive corpus conversion + semantic keep-rate report), `emitstats.js` (per-type
emit/skip breakdown), `regress.ps1` (multi-file conversion + GeoGebra open check),
`stats-counts.js`, `shot.ps1` (screenshot an opened GSP file), `jspextract.js` (extract/parse the
JavaSketchpad `Construction` text from an exported `.htm`).
Diagnostics added for the reflection/straight work: `t34probe.js` (classify every `t34` whose
mirror is unsupported), `t34host.js`, `parentprofile.js` (parent-kind histogram per type),
`perpbases.js` (perp/parallel base kinds), `rawobjs.js` / `objlist.js` (raw / resolved object
dumps), `xmlexpr.js` (print `<expression>` lines from a `.ggb`).
Transform/type diagnostics: `alignpair.js` (align a `.gsp` with its exported `.htm` by construction
order), `tsamples.js` (list sample objects of given types with parent/label/params), `rawdump.js`
(raw record dump per object), `docrecs.js` (document-level records), `markerclass.js` /
`diag2933.js` (classify `t29`/`t33` transform markers and their emit decision), `probe47.js`
(ratio-measure candidates), `t34probe.js`. `test/markerdec.js` classifies `t29`/`t33` markers by how
their `2311` program decodes; `test/find2933.js` lists the smallest sketches containing decodable ones.
`t47` ratio work: `test/probe47.js` (parent-shape census + `t33` marker shapes), `test/t47hdr.js`
(header-field census per parent shape), `test/meashdr.js` (header/params of measure types),
`test/t47raw.js` (raw records of `t47`), `test/emit47.js` (list sketches whose `t33` resolved to a
3-point ratio), `test/elemdump.js` (dump the raw `<element>` XML of a `.ggb` by label).
`tag 2311` decoder work: `exprcode.js` / `exprcov.js` (JSP↔2311 correlation / decode coverage),
`tokhist.js` (token class/payload histogram), `codescan.js` / `codefind.js` / `namescan.js`
(locate objects using a given predefined code / label text), `predefscan.js` / `predefset.js` /
`predefmap.js` / `excl.js` (isolate single-function sketches), `predefdump.js` (dump decoded
templates that use a given predefined code), `rawprog.js` / `dumpexpr.js`
(raw hex + decoded programs per object), `ggbtypes.js` (element-type census across `.ggb`),
`one.js` (convert one `.gsp` by name and dump its expressions), `skips.js` (per-type skip reasons).
Coordinate-frame / function work: `frameaudit.js` (frame detection census), `framefn.js` /
`framelist.js` (frame ratios for function sketches), `frameprobe.js` (inspect extreme frames),
`pick.js` (copy named corpus sketches to ASCII filenames), `shotgsp.ps1` / `shotggb.ps1`
(window-rect screenshots of a Sketchpad / GeoGebra window).
Hand-off: `package.ps1` (build a clean distributable zip), `test/smoke.js` (self-contained smoke
test using the bundled `t.gsp`); see `SETUP.md`.
