# gsp-conv 技术细节（Tech Details）

> 本文件面向**开发者 / 逆向工程**：容器格式、对象类型语义、真值来源、验证方式与已知限制。
> 面向普通用户的使用说明见 [`README.md`](README.md) / [`README_EN.md`](README_EN.md)；
> 全部 `tXX` 类型速查见 [`TYPE_TABLE.md`](TYPE_TABLE.md)；开发进度与基线见 [`HANDOFF.md`](HANDOFF.md)。
>
> 文档地图：用户向 = `README.md` / `README_EN.md`｜技术细节 = 本文件｜类型表 = `TYPE_TABLE.md`｜
> 交接 = `HANDOFF.md`｜部署 = `SETUP.md`。

## 目录
- [架构](#架构)
- [中间表示](#中间表示)
- [GSP 容器事实（逆向所得）](#gsp-容器事实逆向所得)
- [验证](#验证)
- [类型语义与映射](#类型语义与映射)
- [JavaSketchpad 文本（真值来源）](#javasketchpad-文本真值来源)
- [已知限制](#已知限制)
- [开发工具（`tools/`）](#开发工具tools)

---

## 架构

| 文件 | 作用 |
|---|---|
| `src/zip.js` | `.ggb` 容器的 ZIP 读写（`unzip`/`zip`/`crc32`）。 |
| `src/gsp.js` | `.gsp` 读取器：把 `GSP4` 记录链解码为 IR（中间表示）。 |
| `src/ggb.js` | `irToGgb`（IR → GeoGebra XML → `.ggb`）与 `ggbToIR`（`.ggb` → IR）。 |
| `src/convert.js` | CLI 与 TUI 共用的转换入口（`convertBuffer`）。 |
| `src/tui-util.js` | TUI 辅助：目录浏览、批量任务规划、CJK 显示宽度/截断。 |
| `src/ir2gsp.js` | IR → `.gsp` 写入器。从 `src/gsp-template.json` 克隆各类型真实记录块，改父引用/坐标/参数/标签，写出合法的 `GSP4` 文件。 |
| `src/gsp-template.json` | 模板库：文件头/尾 + 215 个真实对象块骨架，覆盖约 120 个 GSP 类型码（由 `tools/build-template.js` 生成）。 |
| `bin/cli.js` | 命令行前端。 |
| `bin/tui.js` | 交互式终端界面（纯 Node + ANSI）；非 TTY（管道/CI）时退化为逐行编号菜单。 |

### 中间表示
每个对象为 `{ id, label, kind, srcType, parents[], coords|null, params[], value, color }`。
坐标统一归一化为 **GeoGebra 单位**；`SCALE = 50`，即每个 GGB 单位等于 50 个 GSP 逻辑单位。

---

## GSP 容器事实（逆向所得）
- 魔数 `GSP4`，随后是 `u32 payloadLen | u32 tag | payload` 记录链（小端）。
- `2000` 对象起始（28 字节；`u16[0]` = 类型；`u16[+2] == 4` 表示该对象**隐藏**），
  `2002` 父对象 id，`2003` 参数（`u32 类型回显` + doubles），`2005` 标签
  （22 字节前缀 + `u16 len` + 字符串），`2007` 对象结束，`2201` 点坐标，
  `2311`/`2306`–`2310` 各类型专属内容。
- 文件头/尾的记账：`tag 1000` 在**字节偏移 24** 处携带**对象数量**——GSP 加载时会*校验*它。
  文件尾的 `tag 9000`/`9005` **不**校验。
- 文件头/尾必须取自干净、简单、已知可用的文件（我们使用 `未命名1.gsp`）。复杂源文件带有
  逐对象的文件头列表，会使原本良好的模板文件不适合作为供体。
- 部分变长记录比其存储长度少一个尾部填充字节（见「已知限制」）。

---

## 验证
- `gsp → ggb`：输出为格式良好的 XML（用 .NET `XmlDocument` 验证），**并**能在真实的
  GeoGebra Classic 5.4（`D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe`）中打开，
  在代数区渲染点/线段/数值。逐文件用 `tools\ggbcheck.ps1` 验证。
- `ggb → gsp`：生成文件在真实的**几何画板 5.06**（`D:\Sketchpad5`）中打开并正确渲染；
  两个方向均可往返。
- `.ggb` 的**文件头/设置块必须严格使用 GeoGebra 接受的元素名与枚举值**。特别是 `<kernel>`
  必须用 `<angleUnit val="degree"/>`、`<coordStyle>`、`<angleFromInvTrig>`；**不能**用
  `<angleUnit val="0"/>`、`<coordMode>`、`<missingsVal>`、`<locusMode>`、`<probabilityType>`。
  `<scripting>` 必须为 `<scripting blocked="false" disabled="false"/>`。文件头写错会让
  GeoGebra 5.4 以“打开文件失败”拒绝该文件，尽管 `<construction>` 中的对象本身合法
  （已用 `tools\hybrid.js` 做文件头/正文交叉试验隔离定位）。文件头以已知可用文件为蓝本。
- 覆盖率与解码率基线：`node tools\emitstats.js "<语料根>"`、`node tools\exprcov.js "<语料根>"`。

---

## 类型语义与映射

> 全部 `tXX` 类型（含未映射项、记录 tag 说明与**编号跳空**）的速查表见 [`TYPE_TABLE.md`](TYPE_TABLE.md)。
对象类型码用 `m-ezekiel/GeometersSketchpad` 仓库中命名清晰的小样例 `.gsp`
（如 `polygon_reflections.gsp`、`area_parallelogram.gsp`、`hexagon_by_rotations.gsp`、
`angle_bisector.gsp`）做了真值校验。已确证的映射：

### 基本图形
- `t8` = 多边形内部（父为顶点）→ `Polygon(...)`。
- `t34` = 反射（原像 + 镜面线/线段/点）→ `Reflect(...)`；**圆**镜面是*关于圆*的反射 =
  **反演**，GeoGebra 的 `Reflect(<Object>, <Circle>)` 同样执行此操作，故直接透传。镜面是一条
  线/线段的仿射像时，反射会重建该镜面的支撑直线。
- `t41` / `t113` = 角（3 点，中间为顶点）→ `Angle(A,B,C)`；`t120` = 它的测量值。
- `t17` = 固定偏移点（父对象 + 像素偏移 `(dx,dy)`，y 向下）→ `(parent)+(dx/50,-dy/50)`。

### 圆
- `t3`/`t4`/`t64` = 圆（**圆心 + 圆上点 / 半径线段 / 半径数值**）→ `Circle(...)`。GSP 的父序
  不固定（半径测量常排在第 0 位），而 GeoGebra 的 `Circle` 语法要求**第一个参数是点**
  （`[<Point>, <Radius Number>|<Segment>|<Point>]`），故取“两个父里是点的那一个”作圆心；
  两边都不是点则跳过（2026-10-02 修正：此前一律用 `parents[0]` 会发出 `Circle(数值, 点)` 之类的非法圆）。

### 路径上的点（`t15`）
- `t15` 在圆上时，位置存为 **(cos,sin) 单位方向**（y 向上，而点坐标为 y 向下）；在线段/直线上时，存为参数 `t`。
- `t15` 在**线段/多边形**上 → `Point(path)` 外加显式 `<coords x y z>`，即一个*路径上的自由点*。
  GeoGebra 只对 `AlgoPointOnPath` 无参数（`isChangeable() == (param == null)`）的路径点进行
  动画，并从 `<coords>` 复原位置——进而复原路径参数（`GeoPoint.setCoords` →
  `path.pointChanged`）。`Point(path,t)` 几何上正确但永远不可动画，因此仅作为位置无法数值
  求解时的兜底（`gspPosXY`）。
- `t15` 在**圆**上 → `Point(圆)`（无参数），即一个*圆上的自由点*，从而保持约束关系且可动画。
  当位置存为 (cos,sin) 单位方向、且圆心与半径都能数值求解时，再附显式 `<coords>`：存的方向为
  **y 向上**（而点坐标为 y 向下），故位置为 圆心 + 半径·(px, −py)（已对照
  `ref-ctrl/angle_bisector.gsp` 的 GSP 渲染验证：G 的 py>0 且画在圆心上方）。若存的是
  **单参数**形式（其值在语料中与点实际渲染角度不符，是动画状态/约束句柄，不是可解码的位置），
  或圆心/半径不可求解，则**不发** `<coords>`，把初始路径参数交给 GeoGebra——宁可不还原
  初始位置，也不猜测。
- `t15` 在**线段的仿射像**上 → `Point(path,t)`。GeoGebra 的线段路径参数恰为 φ(X,A,B)，
  与 GSP 一致（对照 GeoGebra 手册验证过）。GeoGebra 的*直线*参数是非线性重映射，故直线上
  的点不这样发射。
- `t15` 在**圆的仿射像**上（旋转/平移等变换后的圆）→ `Point(<变换后的圆>)`，即一个*变换圆上的
  自由点*：保持约束关系与可动画性。其位置参数存于**基圆**的参照系，需复合变换才能换算，故
  **不附 `<coords>`**，初始位置交给 GeoGebra（与单参数圆同策略，不猜）。
- **函数图像（`t72`）及其上的点（`t15`）。** `t72` 的 `tag 2306` 记录保存以框架单位表示的绘制
  x 定义域 `[xmin, xmax]`；该图像的第一个父对象是所绘函数。`t15` 点存的是定义域比例 `t`，故发射
  为 `(x0, f(x0))`，其中 `x0 = xmin + t·(xmax-xmin)`，引用函数对象（而非图像）。`t72` 图像本身
  跳过——GeoGebra 会自行由函数绘制。
- **`t95` = 路径上的点（按另一父给出的参数）**：父 `[值, 路径]`（值常为 `t94` 路径位置或计算值）
  → `Point(路径, 值)`。**已落地线段路径**（GeoGebra 线段路径参数 = GSP 的 φ∈[0,1]）；多边形/圆/弧等
  宿主的参数换算未验证，暂跳过。渲染真值：`滑块变速.gsp`（`R` 与 `Q` 在各自线段上比例相同 = 0.24）。
- **`t76` = 迭代 `x_{k+1}=f(x_k)`**（2026-10-03 用 4 份真值草图定性）：父
  `[原象, 初象(=f(原象)), …额外初象/子对象]`，**迭代次数在 `tag 2314` 偏移 16**（u32）。
  `f` 由「原象→初象」的构造隐式给出 → 发 GeoGebra `IterationList(f, iv, {原象}, n)`（把初象表达式里的
  原象替换为迭代变量 `iv`）。已真机验证（点旋转/平移/带子对象/数值迭代；迭代点数与 GSP 渲染一致）。
  **`t89`（深度迭代/多映射，语料大头）尚需真值**（见 `ref-ctrl/jsp-samples/README-真值草图-iteration.md`）。
- 直线类对象上的点使用 GSP 精确参考点对（经 CFR 反编译 `jsp5.jar` 验证）：线段/直线 → 两端点；
  平行 → `P∓d/2`；垂直 → `P∓perp(d)/2`；角平分线 → `√9000/(2·SCALE)` 公式；多边形 → 逐边
  `offset/n`（`n` = 顶点数）。**注意：** `.gsp` 将 `perpLine`/`parallelLine` 的父对象存为
  `[throughPoint, baseStraight]`（语料确认：t5 最常见的签名是 `[midpoint, segment]`），与
  GeoGebra 的 `PerpendicularLine`/`ParallelLine`(点, 线) 参数顺序一致。

### 动作按钮（`t62`）
- `t62` = 动作按钮（总是带有按钮记录 `2310`）。该记录偏移 12 处的第一个 `u16` 为种类：
  `0` 隐藏、`1` 显示、`2` 动画、`3` 移动、`4` 滚动、`7` 同时/切换、`8`/`9` 未知；偏移
  20/22 为按钮在画板中的 `(left,top)`。发射为带点击脚本（`<ggbscript>`）的 GeoGebra `<button>`：
  - 种类 `0`/`1` → `SetVisibleInView(target,1,false/true)`；
  - 种类 `2` → `StartAnimation(target,true)`，仅对 GeoGebra 真能动画的目标保留（线段/多边形上的
    自由路径点，以及带 `<coords>` 的圆上自由点；函数、变换后的路径、普通数字/参数一律跳过，
    `GeoNumeric` 还需激活的滑块区间）；
  - 种类 `3`（移动）→ 父为 `[源, 目标]` 成对（`moveAction` 把源拖向目标；语料实测二进制为
    构造器 `(dest,source)` 的反序），发 `SetCoords(源, x(目标), y(目标))`（GeoGebra 手册：点移到
    最接近的可行位置，对路径上的点亦生效）；源必须可移动、目标必须是点；
  - 种类 `7`（同时）→ 父是被触发的按钮，发一个按钮并把各存活被触发按钮的脚本**内联**拼接；
  - 种类 `4`/`8`/`9`（滚动/未知）没有忠实等价物，跳过。
  **不是**多边形（旧的“多边形”误映射已移除）。

### 坐标架 / 轴 / 单位点
- `t58`/`t59` = 坐标轴（`Axis4`）；`rich[2309]` 的 u32 选择水平（1）/竖直（0）。发射为过轴
  原点的 `Line`。`t52`/`t54`/`t55` = 坐标单位点（JavaSketchpad 真值中的
  `UnitPoint`/`SquareUnitPoint`/`RectangularUnitPoint`）。
- `t61` = 坐标系（`gCoordSys`）；`t67` = `PlotFixedXY`（坐标系中固定 `(x,y)` 处的点）→
  `origin + (x·ux, -y·uy)`；`t49` = `CoordinatePair` → 动态 `"(x, y)"` 文本。
- **画板坐标框架。** 一个 `t61` 坐标系由两条 `t58` 轴定义，每条轴各有一个原点和一个单位点。
  原点是各单位点的共同基点（由 `unitPointOrigin` 沿 `t52`/`t54`/`t55` 链解析），单位向量即
  原点→单位点的偏移。单位**尺度**来自 `unitScaleOf`：`t52`（水平 `UnitPoint`）和 `t55`
  （`RectangularUnitPoint`）使用其存储的距离，但 **`t54`（`SquareUnitPoint`）继承其父单位点的
  尺度**——它存储的值是残留（通常是 1 cm 默认值 37.795），绝不能被当作 y 尺度读取，否则框架
  会被压扁，所有坐标都会错位。GSP 的**函数以框架单位绘制，而普通点/线段处于画板像素空间**，
  这就是单纯像素映射会把每个函数相对其点错位的原因。当一个画板同时含函数
  （`t71`/`t78`/`t72`）**且恰好只有一个**坐标系**且**框架非退化（单位比在 `[0.2, 5]` 内）时，
  `sketchFrame()` 会把整个转换切换到框架坐标——点、线、线段、自由数字、`coordSystem` 视图以及
  `yscale` 纵横比全部跟随。否则保留纯像素映射（轴则画成普通直线），因此不含函数的文件不受影响。

### 表达式与度量
- **计算/函数表达式（`tag 2311`）已解码。** `2311` 载荷以一个 `COUNT*2` 字节的 token 程序结尾
  （`COUNT` = 以 `07 09 00 00` 开头的内层记录偏移 12 处的 u16）。每个 token 为小端 u16，其高
  字节是类别：`0x00` 字面字符/数字（`. ( )` π e `x`），`0x01`/`0x02` 作用于前一数字的单位标记，
  `0x10` 二元运算符（`+ - * / ^`），`0x20` 预定义函数，`0x60` 父对象引用，`0x70` 父对象作为
  函数的引用。程序是表达式的**中序形式**（对 JavaSketchpad 导出所写后缀形式的重编码），使用
  **标准运算符优先级**（故 `-x^2` 是 `-(x²)` 而非 `(-x)²`）。由 `src/expr.js` 解码；含未解码
  token（`0x1005`、`t122`）的程序会跳过，绝不猜测。
- **预定义函数**（`0x20` 载荷，依据语料标题/行为确定）：
  `0 sin, 1 cos, 2 tan, 3 asin, 4 acos, 5 atan, 6 abs, 7 sqrt, 8 ln, 9 log10, 10 sgn, 11 round,
  12 trunc`。GSP 三角使用画板的**角度单位**；使用它的画板为弧度（经 `演奏原理` 的
  `sin(264·2π·x)` 与 `正弦型函数` 的 `sin(2x+π/3)` 验证），故带角度标记的字面量会被换算
  （`?101` ⇒ ×π/180）。GeoGebra 以弧度计算三角，故映射直接。`trunc` 没有 GeoGebra 等价物，
  发射为 `sgn(x)*floor(abs(x))`。GSP 的**函数**（71 类）、**导数**（78 类）以及自由数字**函数**
  对象发射为 GeoGebra `Function` 对象；**图像**（72 类）跳过，因为 GeoGebra 会自行绘制函数。
- **常量函数。** 表达式不含自由变量的函数（如 GSP 的常量 `f(x)=√3`）发射为
  `<label>(x)=<expr>`。若没有变量前缀，GeoGebra 5.4 会把 `type="function"` 元素加载为**数字**
  并渲染成滑块，而不是绘制其图像。
- **测量读数不绘制。** 每个 GSP 测量读数（斜率/长度/角度/比值 → GeoGebra 数值）都发射为
  `<show object="false">`。GeoGebra 会把*每个*显示的数字都渲染成图形区里类似滑块的图形，这正是
  “数字变成函数/图形”的症状；GSP 则把这类测量显示为文字标签。数值仍会出现在代数区 “Numbers” 下。
  自由数字（参数）保留 `<show object="true">`，以便仍是可拖动滑块，保留动态关系。
- **`2307` 测量族**（`SimpleMeasure`，种类由 measureType 决定）批量落地：
  - `t36` 线段长 → `Length`；`t37` 两点距离 → `Distance`；
  - `t38` 点到直线距离（mT3）→ `Distance(点,线)`；
  - `t39` 周长（mT4，多边形）→ `Perimeter(...)`；`t40` 圆周长 → `Circumference(...)`；
  - `t42` 面积（mT6）→ `Area(...)`；`t46` 半径（mT9）→ `Radius(...)`；
  - `t65` 横坐标（mT13）→ `(x(P)-originX)/unitX`；`t66` 纵坐标（mT14）→ `-(y(P)-originY)/unitY`；
  - `t86` 坐标距离（mT15）→ `sqrt(((Ax-Bx)/ux)²+((Ay-By)/uy)²)`；
  - `t69` = `PlotXY`（3 父 `[x 表达式, y 表达式, 坐标系]`）→ `(originX + x·unitX, originY − y·unitY)`；
    `t70` = 它的变体，并入同一分支。**此前 `t69` 被误映射为 `Calc`**，几近全跳过。
  - `t94` = **`PointOnObject` 的「点在宿主路径上的相对位置」**（数值）：当点为 `pointOnPath`
    且与其宿主路径相同、宿主为线段/多边形（含仿射像）时发 **`PathParameter(p)`**（JSP 样本
    `Point on object(3, 0.174345)` 与点的 `2003` 参数逐位相符）。宿主为直线/圆、或 `p1` 不是
    点的宿主时仍跳过（未验证）。
- **`t47` = `SimpleMeasure` 的“Ratio”**（反编译 `SimpleMeasure.java` +
  `computed3PtRatio.java`），发射为 GeoGebra **数值**（不仅是作为伸缩标记）：
  - *比值/线段*（measureType 8，两个线段父对象）→ `Length(s1)/Length(s2)`；
  - *比值/点*（measureType 11，三个点父对象 `[A,B,C]`）→ `|AC|/|AB|`，**当角 BAC > 90° 时为负**。
    符号等于点积 A→B · A→C 的符号（与方向无关）。
    它用坐标差（`x()`/`y()`）书写而非 `Vector()`/`Distance()`：GeoGebra 会把形如 `P + t*(Q-P)`
    （线段/直线上点的发射形式）的表达式判为**向量**，因此对这类对象调用
    `Vector(P,r)`/`Distance(P,r)` 会算错。具体为：
    `If((x(B)-x(A))*(x(C)-x(A)) + (y(B)-y(A))*(y(C)-y(A)) < 0, -1, 1) *
    sqrt((x(C)-x(A))^2+(y(C)-y(A))^2) / sqrt((x(B)-x(A))^2+(y(B)-y(A))^2)`。
  标记为 `t47` 的 `t33`（常被 `t48` 标签包裹）引用发射出的数值对象。不支持的 `t47` 父对象
  形态仍会跳过而非猜测。

### 仿射变换族
（用 `ref-ctrl/jsp-samples/mark_*.gsp+.htm` 中用户制作的标记变换对照样例、按
构造顺序对齐，做了真值校验）。对 `jsp5.jar` 的 CFR 反编译给出精确的类→规格→元数映射：

| 类型 | 类（反编译） | JSP 规格 | 父对象 | GeoGebra |
|---|---|---|---|---|
| `t16` | `VectorTranslation` | `VectorTranslation` | 原像 + A + B | `Translate(pre, Vector(A,B))` |
| `t21` | — | `PolarTranslation` | 原像（+ 固定向量） | `Translate(pre, Vector((vx,vy)))` |
| `t24` | `FixedAngleMarkedDistance` | `Translation/FixedAngle/MarkedDistance` | 原像 + 距离值（+ 固定角） | `Translate(pre, v·Vector((cosθ,sinθ)))` |
| `t27` | `Rotation` | `Rotation` | 原像 + 中心（+ 固定角） | `Rotate(pre, θ°, center)` |
| `t28` | `MarkedAngleRotation` | `Rotation/MarkedAngle` | 原像 + 中心 + A + B + C | `Rotate(pre, Angle(A,B,C), center)` |
| `t29` | `MeasuredAngleRotation` | `Rotation/MeasuredAngle` | 原像 + 中心 + 角度测量 | `Rotate(pre, Angle(A,B,C), center)` |
| `t30` | `Dilation` | `Dilation` | 原像 + 中心（+ 比值） | `Dilate(pre, k, center)` |
| `t31` | `Dilation2S` | `Dilation/SegmentRatio` | 原像 + 中心 + 比分子段 + 比分母段 | `Dilate(pre, Length(s1)/Length(s2), center)` |
| `t33` | `DilationMR` | `Dilation/MarkedRatio` | 原像 + 中心 + 比值测量 | `Dilate(pre, <比值>, center)` |
| `t34` | `Reflection` | `Reflection` | 原像 + 镜面 | `Reflect(...)` |

`t28`（语料中 979 个）与 `t31` 已完全重建。`t29`/`t33` 先解析标记为三点角
（`t41`/`t113`/`t120`）或测量比值（`t47`，见下）；否则回退到标记自身解码出的 `tag 2311`
程序，再回退到标记的**结构化测量 plan**（`t36` 长度 / `t37` 距离 / `t41` 角 / `t65/t66` 等，
复用 `planOf`，不猜语义）——即标记值本身（标记**角**以弧度使用，与 GeoGebra 内部角度表示一致；
标记**比值**为无量纲）。**`t33` 另加护栏：中心必须是点**，否则该二进制 `t33` 并非
`DilationMR` 的直接结构（存在无法归约为 `[原像,中心,比值]` 的同类型号对象），一律跳过而非误发。
只有解码器无法恢复其值的标记会被跳过。**2026-10-02** 修复了解码器「`pi`/`e` 常量之后的角度单位
标记未被消费」的解析 bug（此前 `2*pi<ang>0/{n}` 这类程序整类报 `trailing tokens`），`t29` 发射
由 1,054 升至 2,512。

**`t21` = 极坐标平移（`PolarTranslation`），不是旋转**（2026-10-02 破案并落地）。tag 2003
（60 B）：`+4`=−sinθ、`+12`=cosθ、`+20`=θ（仅展示用，不可靠；θ 一律取 `atan2(-p[0], p[1])`）、
`+32`=**平移距离 d1（文件坐标单位）**、`+40`=同一距离的厘米数。语义为
`image = parent + d1·(cosθ, −sinθ)`（文件 y 向下）；`d1` 与点坐标同单位，故发射前须按同一比例
折算（无 frame 用 `/SCALE`，有 frame 用 `frame.disp`），发 `Translate(pre, Vector((vx,vy)))`。
旧推断「绕隐式/标记中心旋转」已被真值否定（`mark_center_rotate_fixed.gsp` 产出的是 `t27`）。

**`t24` = 定角 + 标记距离平移（`FixedAngleMarkedDistance`）**（2026-10-03 用真值草图确认并落地）。
记录 = **2 父 + `(-sinθ, cosθ, θ)`**，父 `[原像, 距离值]`；`.htm` 对应
`Translation/FixedAngle/MarkedDistance(pre, dist, θ)`。语义为 `image = pre + v·(cosθ, −sinθ)`
（文件 y 向下），v = 被标记的距离值。**v 由父对象（多为 `t48` 计算值 / `t36` 长度 / `t37` 距离等）
发射为 GeoGebra 数值，其单位已与坐标一致**，故发 `Translate(pre, v·Vector((cosθ,sinθ)))`，
v **不再乘/除 `SCALE`**。真值草图（`ref-ctrl/jsp-samples/translate_fixedangle*`）实测：
θ=90° 时 `P'−P` 的文件坐标位移 `(0,−313.1)` 恰等于线段 AB 的长度（313.08）。
同一轮还顺带定性了两个小类型：**`t22`** = 标记角（3 点 `[A,B,C]`）+ 固定距离，父
`[原像, A, B, C]`；**`t25`** = 标记角 + 标记距离，父 `[原像, A, B, C, 距离值]`（暂未落地）。
若草图处于**非等比坐标框架**下，方向与距离的缩放会不一致，故该类保持跳过（不猜）。

### 弧对象（2026-10-03 用真值草图 + 渲染定性；JSP 不导出弧）
- **`t79` = 圆上的弧**：父 `[圆, P1, P2]`，**P1/P2 = 选择顺序**，发 `Arc(圆, P1, P2)`。
  渲染实测：从 P1 到 P2 的方向与 GeoGebra `Arc(conic,P1,P2)` 的**逆时针**约定一致（无需交换）。
  真值草图 `ref-ctrl/jsp-samples/arc_circle_PQ.gsp` / `arc_circle_QP.gsp`（父序随选择顺序翻转）。
- **`t80` = 以圆心与两点画弧**：父 `[圆心, P1, P2]`（实测 parents[0] 与 P1/P2 等距=圆心），
  发 GeoGebra **`CircularArc(圆心, P1, P2)`**（正是“以圆心 M、A 起 B 止的弧”）。
- **`t81` = 过三点的弧**：父 `[P1, P2, P3]`=选择顺序（P1 起点、P2 在弧上、P3 终点），
  发 GeoGebra **`CircumcircularArc(P1, P2, P3)`**。真值草图 `arc_center_two_points.gsp`；
  实测弧长 37.94（= 该构型应有的 332.6°）且端点/走向与 GSP 渲染一致。
- `t43` = 弧的角度 → `Angle(弧)`；`t44` = 弧长 → `Length(弧)`（两者都接受弧对象）。

---

## JavaSketchpad 文本（真值来源）
画板可将画板导出为交互式网页（“文件 → 另存为 → 文件类型 **JavaSketchpad**”，`*.htm`；
仅注册版可用）。该页面把整个构造以纯文本 `Construction` applet 参数携带：

```
{1} Point(310,195)[color(109,116,114)];
{7} Function(15,170,'y = f(x) = 1 / (1 + sgn(sin(x)))...', '1 x @sin_ @sgn_ 1 + / ')()[black];
{9} Point on object(8,.95)[black];
```

`src/jsp.js` 读取该格式（`extractConstruction` / `parseConstruction`），复刻 jsp5.jar 的
解析器（`Sketch.parseConstruction`）；`tools/jspextract.js` 是 CLI。与 `.gsp` 二进制不同，
该文本以明文保留表达式字符串、标签与测量元数据，因此是解码 `tag 2311` 对象图（见 HANDOFF）
的既定真值。样例：`ref-ctrl/jar/testfile.html`。

把 `.gsp` 与导出的 `.htm` 配对后确认：两侧对象顺序**都是构造顺序**（JavaSketchpad 只是*丢弃*
无法渲染的对象，如测量/按钮），因此两个列表逐元素对齐。这立刻解出了内联文本格式，并且关键地
揭示了：`2311` 程序就是 `.htm` 以后缀形式写出的**同一个表达式**，重新编码为**中序形式并带
显式括号**——这正是破解 `2311` 解码器的钥匙（见*已知限制*）。

```bat
node tools\jspextract.js page.htm            :: 人类可读摘要
node tools\jspextract.js page.htm --json     :: 解析后的对象数组
node tools\jspextract.js page.htm --out o.json
```

---

## 已知限制
- 自由数字的**值**确实会恢复：GSP 的自由数字/参数把其值存为 `2311` 中的常量程序，故参数
  `a = 2` 会发射为自由数字 `2`（此前假定为 0 并告警）。
- **固定文本标注**（携带 `tag 2300` 记录的 0 类对象）确实可解码：消息以明文 UTF-8 内联存储，
  包裹在轻量标记中（`<T23x…>` 文本段，`<VL`/`<H`/`<SR…>` 容器），发射为 GeoGebra `Text`
  对象。`src/gsp.js` 中的 `decodeGspText()` 会剥除标记；已对照配对的 JavaSketchpad 导出逐字节
  验证（见 `ref-ctrl/jsp-samples`）。
- **GSP5 的迭代/列表/自定义工具族**（`t77`/`t89`/`t88`/`t90`/`t75`/`t32`，以及 `t10`）会被跳过：
  `t77`+`t89`＝迭代步/列表数据（`t88` 为迭代出的点），`t32`/`t75` 为自定义工具/迭代实例；
  **`t10`＝迭代/自定义工具的「变量槽」**（1 个父=初始值、无参数/坐标、标签=变量名，如 `p12`/`边数`），
  其值随迭代步骤变化，别名成父对象会算错，故跳过。JSP 会把它们内联展开、无真值可对表，故**不猜测**。
  **`t35`＝轨迹（Locus）现已映射**：反编译 `Sampler/gPointLocus` 得父序
  `[被跟踪点, 驱动路径, 驱动点, …]`，发 GeoGebra `Locus(被跟踪点, 驱动点)`（驱动点须在其路径上；
  无嵌套轨迹、被跟踪点确依赖驱动点时才发）。
- **数字永不使用科学计数法**：GeoGebra 会把 `1e-9` 读成 `1×e−9`（`e`＝欧拉数），故 `fmt()` 将
  `|v|<1e-12` 归零、其余指数形式展开为纯小数。这是修复 `t21` 平移像 `A'` 错位的关键。
- 仍需未映射 `2311` 值的测量/`t90` 对象会被跳过（连同级联的依赖者）。`t29`/`t33` 标记已不在
  此列：它们解析为三点角/测量比值，或回退到标记自身解码出的 `2311` 值。`t47` 现已完整映射。
- 部分变长记录比其存储长度少一个尾部填充字节。这影响 `tag 1300`（内嵌 PNG）与 `tag 9009`
  （文档元数据/列表记录）。若不跳过该填充，后续每条记录都会偏移一字节（tag 显示为 `0x3EF00`、
  `0x38700`……）。`parseRecords` 现在仅在声明边界处的 tag 明显错位（`>= 0x10000`）且其后一
  字节处出现正常 16 位 tag 时才跳过填充字节。
- `.ggb → .gsp` 映射每个语义已验证的逆：`Polygon→t8`、`Reflect→t34`（镜面可能为内联
  `Line(a,b)`/`Segment(a,b)`，会解析回共享端点的线/线段对象）、`Rotate(pre, Angle(A,B,C), c)→t28`、
  `Dilate(pre, Length(s1)/Length(s2), c)→t31`、`Angle→t41`、`Distance→t37`、`Length→t36`、
  `Slope→t87`。垂直的 `Foot` 没有已验证的 GSP 对象类型，会跳过而非误发射。
- 生成标签只在**所有显式标签都预留之后**才分配，故未命名对象不再能窃取后续对象的显式名字
  （此前未命名线段可能抢在显式点 `O` 之前占用 `O`，破坏其依赖者）。
- 部分 `perpLine`/`parallelLine` 对象（t5/t6）的基准是**圆**（本地 1430 文件语料中 433 个，
  例如 `PerpendicularLine(M, t)` 中 `t` 为圆）。GSP 对“垂直于/平行于圆”的确切语义未确认，故按
  原样发射（GeoGebra 能打开文件，但该对象未定义）而非猜测。
- 圆上点若以**单参数**存储（`t15` 1 个参数），**不暴露可解码的位置**：其值在语料中与点的实际
  渲染角度不符（它是动画状态/约束句柄；`angle_bisector` 的 E 存 2.344061 却位于约 −0.14 rad）。
  这类点保留为 `Point(圆)`（约束关系与可动画性正确），初始位置交由 GeoGebra 选取，而**不猜测**；
  以 (cos,sin) 单位方向存储的点则可精确复原位置（方向为 y 向上：圆心 + 半径·(px, −py)）。
  点在**变换后的圆**上时同样保留为 `Point(<变换后的圆>)`（其位置参数存于基圆参照系，不换算 `<coords>`）。
  `gspPosXY` 现已能解析**变换点**（`t16`/`t21`/`t27`/`t30`/`t17`，以及点镜 `t34`），
  故圆/路径的**圆心与半径**即使由变换点给出也能解出，位置更常被复原（例：`阴阳鱼` 的圆上点）。
- 转换后不会自动适配 GSP 视图。
- **已知类型注意事项：** 线段/直线路径上的点发射为 `P + t*(Q-P)`。GeoGebra 5.4 把该算术形式判为
  **向量**（而非点），尽管坐标正确。它在多数上下文中会被强制为点（线段端点、伸缩中心），但区分
  点与向量的命令——`Vector(P,r)`、`Distance(P,r)`、`Angle(P,r,S)`——对这类对象会行为异常。消费
  这些点的新表达式应使用 `x()`/`y()` 坐标运算（如 `t47` 比值那样），直到路径点发射改为点类型的
  `Point(<path>, t)` 形式。

---

## 开发工具（`tools/`）
`build-template.js`（构建骨架库）、`try-conv.js`（冒烟测试）、`reserialize.js`（字节一致性检查）、
`splice.js` / `rebuild.js`（记录手术）、`dump-one.js` / `dump-hdr.js`（记录检查）、
`patch2003.js` / `patch-double.js`（扰动实验）、`validate.js`（导出 `geogebra.xml`）、
`pack.js`（把 `.geogebra.xml` 重打包为 `.ggb`）、`hybrid.js`（拼接两个 geogebra.xml 的文件头/正文）、
`ggbcheck.ps1`（在 GeoGebra 5.4 中打开 `.ggb` 并按窗口标题报告成功；自动探测常见安装路径）、
`corpus.js`（递归语料转换 + 语义保留率报告）、`emitstats.js`（逐类型发射/跳过明细）、
`regress.ps1`（多文件转换 + GeoGebra 打开检查）、`stats-counts.js`、`shot.ps1`（截取已打开 GSP
文件的截图）、`jspextract.js`（从导出的 `.htm` 中提取/解析 JavaSketchpad `Construction` 文本）。

为反射/直线工作新增的诊断：`t34probe.js`（对每个镜面不支持的 `t34` 归类）、`t34host.js`、
`parentprofile.js`（逐类型的父对象种类直方图）、`perpbases.js`（垂线/平行的基准种类）、
`rawobjs.js` / `objlist.js`（原始/解析后的对象转储）、`xmlexpr.js`（打印 `.ggb` 中的
`<expression>` 行）。

变换/类型诊断：`alignpair.js`（按构造顺序把 `.gsp` 与其导出的 `.htm` 对齐）、`tsamples.js`
（列出给定类型的样例对象及其父/标签/参数）、`rawdump.js`（逐对象原始记录转储）、`docrecs.js`
（文档级记录）、`markerclass.js` / `diag2933.js`（对 `t29`/`t33` 变换标记及其发射决策归类）、
`probe47.js`（比值测量候选）、`t34probe.js`。`test/markerdec.js` 按 `t29`/`t33` 标记的 `2311`
程序解码方式归类；`test/find2933.js` 列出含可解码标记的最小画板。

`t47` 比值工作：`test/probe47.js`（父对象形态普查 + `t33` 标记形态）、`test/t47hdr.js`
（逐父形态的文件头字段普查）、`test/meashdr.js`（测量类型的文件头/参数）、`test/t47raw.js`
（`t47` 的原始记录）、`test/emit47.js`（列出 `t33` 解析为三点比值的画板）、`test/elemdump.js`
（按标签转储 `.ggb` 的原始 `<element>` XML）。

`tag 2311` 解码器工作：`exprcode.js` / `exprcov.js`（JSP↔2311 关联 / 解码覆盖率）、`tokhist.js`
（token 类别/载荷直方图）、`codescan.js` / `codefind.js` / `namescan.js`（定位使用给定预定义码/
标签文本的对象）、`predefscan.js` / `predefset.js` / `predefmap.js` / `excl.js`（隔离单函数画板）、
`predefdump.js`（转储使用给定预定义码的解码模板）、`rawprog.js` / `dumpexpr.js`（逐对象的原始
十六进制 + 解码程序）、`ggbtypes.js`（跨 `.ggb` 的元素类型普查）、`one.js`（按名称转换单个
`.gsp` 并转储其表达式）、`skips.js`（逐类型跳过原因）。

坐标框架/函数工作：`frameaudit.js`（框架检测普查）、`framefn.js` / `framelist.js`（函数画板的
框架比）、`frameprobe.js`（检查极端框架）、`pick.js`（把指定语料画板复制为 ASCII 文件名）、
`shotgsp.ps1` / `shotggb.ps1`（画板 / GeoGebra 窗口的窗口矩形截图）。

交付：`package.ps1`（构建干净的可分发 zip）、`test/smoke.js`（使用随附 `t.gsp` 的自包含冒烟
测试）；见 `SETUP.md`。
