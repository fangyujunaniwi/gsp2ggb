# 交接说明 HANDOFF — gsp-conv

> 本文件用于在另一台电脑上继续本项目。生成时间：2026-09-26；最近更新：2026-10-02。
>
> **接手先跑（自检，项目根 = 本目录）**：
> ```powershell
> node test/smoke.js                    # 应输出 SMOKE PASSED（无需语料）
> node tools/emitstats.js "<语料根>"    # 全树基线：objects=400149 emitted=283056 rate=70.74%（2026-10-04）
> node tools/exprcov.js  "<语料根>"     # 2311 解码覆盖率 57079/57112 = 99.9%
> ```
>
> **验证生成的 `.ggb` 会不会在 GeoGebra 里报“打开文件失败”**（GeoGebra 对非法表达式只在对话框里
> 提示、文件仍算能打开，所以必须检测该对话框）：
> ```powershell
> powershell -ExecutionPolicy Bypass -File tools/ggbcheck.ps1 -File <file.ggb> -WaitSec 25 `
>   -Exe "D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe"     # 看 RESULT ... err=False 才算干净
> ```
> 语法约束的实测结论见 `ref-ctrl/ggb-syntax/README.md`（命令名大小写、`ParallelLine` 不存在、
> 保留标签 `x_`/`y_`、`min`/`max` 须大写 等）。

## 项目目标
把 **几何画板 `.gsp` ⇄ GeoGebra `.ggb`** 双向转换，做成 **CLI 工具**（仅 Node.js）。
尽量保留**动态/构造关系**（中点、交点、垂线、点在路径上……）为**构造指令**，而非只存坐标。

- 单文件：`node bin\cli.js input.gsp -o out.ggb`
- 批量目录：`node bin\cli.js "D:\Folder" --outdir "D:\Out"`
- 终端界面：`node bin\tui.js`（纯 Node + ANSI；非 TTY 退化为逐行菜单）
- 参数：`-o` / `--outdir` / `--to ggb|gsp` / `-q` / `--json`
- 方向由扩展名决定（`--to` 可强制）。

## 关键事实（逆向所得，务必保留）
1. `.ggb` = ZIP，内含 `geogebra.xml`。写入用 `zip.js`（stored 即可，GeoGebra 能读）。
2. `.ggb` 头部/设置块**必须使用 GeoGebra 接受的元素名和枚举值**：
   - `<kernel>`：`<angleUnit val="degree"/>`、`<coordStyle>`、`<angleFromInvTrig>`。
   - **不要** `<angleUnit val="0"/>`、`<coordMode>`、`<missingsVal>`、`<locusMode>`、`<probabilityType>`。
   - `<scripting blocked="false" disabled="false"/>`，不要旧的 applet `<surface>` 块。
   - 头部结构照抄已知可用文件（`src/ggb.js` 的 `header()` 已改好）。
3. GSP 记录格式：从偏移 4 起 `u32 len | u32 tag | payload`（LE）。
4. **`tag 1300`（内嵌预览图）记录：payload = `u32 宽 | u32 高 | PNG`，`len = 8 + PNG长度`，
   但记录实际尾部多 1 个填充字节（`len` 未计入）**。不跳过它，后续所有记录错位 1 字节
   （表现为出现 `0x3EF00/0x38700/0x38600` 等"怪异 tag"，其实是 1007/903/902 左移 8 位）。
   `src/gsp.js` 的 `parseRecords` 已自动识别跳过。
5. 另有一类错位出现在 tag 9009/902 等之前（不止 1300 之后），**尚未解决**，见"待办"。
6. 坐标映射：`SCALE = 50`（GSP 逻辑单位/GGB 单位），`ggb_y = -gsp_y/50`；GSP 输出坐标平移到正值画布（MARGIN=120）。
7. GSP 父引用必须是**输出序数**（跳过对象后的全局 1-based），写入前要重映射。
8. GSP 校验：`tag 1000` 载荷偏移 24 处的 u32 == 对象数；头部/尾部取自简单干净文件（`未命名1.gsp`）。
9. 未识别类型：跳过 + 警告 + 级联删除依赖对象，保证输出能打开。
10. **GeoGebra 按钮与脚本**（由 CFR 反编译 `org/geogebra/common/l/b.class` 确证）：
    `<element type="button">` 的点击行为存在**子元素**里，**子元素名即 `ScriptType` 名**
    （`ggbscript` / `javascript`），属性 `val` 是 CLICK 事件脚本，另有 `onUpdate`/`onDragEnd`/`onChange`；
    按钮位置用 `<absoluteScreenLocation x= y=>`（相对绘图区像素），显示文字可用 `<caption>` +
    `<labelMode val="3"/>`。5.4 **脚本不会在加载时执行或校验**，只在按钮**被点击**时执行（人工点击已确认），
    出错时弹窗写「脚本第 1 行出错(调用来源: <按钮标签>)」，可见脚本确实绑在该按钮上、按点击触发。
    （`命令` 属性表 `org/geogebra/common/jre/properties/command.properties` 证实 `SetCoords` 语法为
    `[ <Object>, <x>, <y> ]`／`[ <Object>, <x>, <y>, <z> ]`，官方手册补充“点会被移到**最接近的可行位置**”，
    且对路径上的点/滑块同样生效；公开的工作表也用 `SetCoords(A,x(Player),y(Player))`）。
    **2026-10-02 修正**：此前记的“`SetCoords` 报错、移动按钮无等价命令”已不成立——当时应是目标点不可移动
    （如 `Point(路径, 常数)`）所致；现只对**可移动**的源点（自由点或 `Point(路径)`）发 `SetCoords`。
    **动画脚本要能生效**：`GeoPoint.isAnimatable() = isPointOnPath() && isPointerChangeable()`，
    而 `AlgoPointOnPath` 实现 `FixedPathRegionAlgo`、其 `isChangeable() = (param == null)`，
    故 `Point(路径, 常数)` **永远不可动画**；必须发 `Point(路径)`（线上自由点）并用 `<coords>` 定初值
    （加载时由 coords 反解路径参数）。数字（参数）目标还需 GeoGebra 滑块区间才可动画，暂不支持。

## 当前状态（2026-09-27 建；2026-10-01 交替机续作）
- ✅ **本机续作（2026-10-03，第十九轮）：线段迭代象改为通用「双点列表」重建。**
  1. 抽出迭代核心 `iterationCore(it, byId)`（fTpl/次数/args），线段 `X=Segment(P,Q)` 的迭代象
     → `Sequence(Segment(Element(L_P,k),Element(L_Q,k)),k,1,count)`，其中
     `L_P=IterationList(f,iv,{P},count)`、`L_Q=…{Q}…`（**内联**，GeoGebra 接受嵌套）。
     这样不再要求端点落在原象上（上一轮只处理了那种特例）。
  2. 真机验证：`iter_depth_pentagon` 的 `O_5` 为嵌套 `Sequence(...)`，`ok=True`。
  3. 全树：**`emitted 244067 → 244370`（rate 59.95% → 60.03%）**，`t77` 发射 269→556。
     剩余 `t77`：起点非点/数值（2493）、初象不可发射（2432）、初象不依赖原象/多变元（2131）。
- ✅ **本机续作（2026-10-03，第十八轮）：线段迭代象改用 `Sequence` 重建。**
  1. GeoGebra 的 `IterationList` 对**线段**起点会退化成「一串长度」（列表显示就是长度，但画出来的仍是线段）；
     更稳的做法：由**点迭代列表**重建相邻对 → `Sequence(Segment(Element(L,k),Element(L,k+1)),k,1,Length(L)-1)`。
     真值草图 `iter_depth_pentagon` 的五边形边即由此得到（渲染可见线段）。
  2. 目前仅处理**端点落在原象上**的线段（`X.parents[0/1] == 原象`）；其余线段/多边形（5689 条）仍跳过。
  3. 全树：**`emitted 243871 → 244067`（rate 59.91% → 59.95%，+196）**；`t77` 发射 114→269。
- ✅ **本机续作（2026-10-03，第十七轮）：定性并（保守）落地 `t77` = 迭代象。**
  1. `t77` 父 `[对象 X, 迭代对象]` → **X 在同一规则 f 下的迭代象** → `IterationList(f, iv, {X}, 次数)`
     （复用迭代对象的 f；抽了 `iterationListPlan(it, byId, startId)` 共用）。
  2. 老坑新发现：**GeoGebra 的 `IterationList` 只保留点/数值** —— 起点是线段/多边形时会退化成一串
     **长度**（如五边形的边变成 `{5.55,…}`）。故**只对点/数值起点发射**，其余跳过（不发错误几何）。
     真机验证：`iter_depth_pentagon` → 两份点迭代列表 `ok=True`。
  3. 全树：**`emitted 243779 → 243871`（rate 59.88% → 59.91%，+92）**；`t77` 发射 114。
     **但 `t77` 的 6327 条是线段/多边形迭代象**（因而跳过），是下一步要解的（需从点列表重建线段）。
- ✅ **本机续作（2026-10-03，第十六轮）：用深度迭代/多映射真值再定性 `t89`，落地深度迭代。**
  1. 用户补齐 `iter_depth_pentagon`（次数=参数 n）与 `iter_multi_triangle`（多映射）。
  2. **关键**：`t89` 的父 = `[次数参数, 原象, 初象, 初象, …子对象]`，即 **`t76` 前面多一个「次数参数」父**
     （`t76` 的固定次数在 `tag 2314 +16`）。`t77` = 迭代象（父 `[对象, 迭代对象]`）。
  3. **落地 `t89`**：同样发 `IterationList(f, iv, {原象}, 次数)`。踩到一个 GeoGebra 限制：
     **次数变量同时出现在迭代体里会被拒绝**（`Rotate(iv,360°/n,O)` 迭代 n 次失败、字面 5 成功），
     故此时改用**次数的常量值**（不可解析则跳过，不发坏文件）。
     真机验证：`iter_depth_pentagon` → 6 点闭合五边形（5×72°=360°），与 GSP 一致，`ok=True`。
  4. 全树：**`emitted 243412 → 243779`（rate 59.79% → 59.88%，+367）**，`t89` 发射 337；
     剩余 `t89` 跳过：初象不可发射（689）、初象不依赖原象/多变元（676）。
     **`t77`（7311，最大剩余）待定性。**
- ✅ **本机续作（2026-10-03，第十五轮）：用 4 份真值草图定性并落地 `t76` = 迭代 `x_{k+1}=f(x_k)`。**
  1. 依据 `Sketchpad Help\几何画板迭代教程.pdf` 更正了操作（先手工做出第一个迭代象 `f(原象)`，再在
     `变换→迭代` 里配对「原象↔初象」）。用户据此制作了 `iter_point_rotate`/`_translate`/`_seg`/
     `iter_number_plus1`（`.gsp`+`.htm`）。
  2. **编码确认**：`t76` = 迭代，父 `[原象, 初象, 初象, …子对象]`（点旋转/平移 `[P,P′,P′]`；
     带线段 `[B,B′,B′,线段]`），**次数在 `tag 2314` 偏移 16**（u32，两图都是 5）。
  3. **落地**：发 GeoGebra `IterationList(f, iv, {原象}, n)`，`f` 由初象表达式把原象换成迭代变量 `iv` 得到。
     新增 `elem:'list'`（`<element type="list">`）。**真机验证**：`iter_point_rotate` 生成 6 个迭代点
     （0/60/120/180/240/300°），与 GSP 渲染逐点吻合（180° 那个在画布外）；`iter_number_plus1`
     → `IterationList(iv+1,iv,{n},5)`，均 `ok=True`。
  4. 全树：**`emitted 243388 → 243412`（+24）**——`t76` 语料仅 84 个；**大头是 `t89/t77`（深度迭代/
     多映射，语料 ~2.4 万）**，需再补真值（迭代请求文件已含「多映射」可选草图）。
- 🔬 **本机续作（2026-10-03，第十四轮）：迭代族调查 + 位置保真补充。**
  1. **迭代族（`t89/t77/t88/t75/t32`，约 2.4 万）机理已看清**（以 `点的迭代(蚂蚁)` 为例）：
     `t10`＝变量槽（包住被迭代对象）、`t48`＝迭代次数（标签「点总个数」）、
     `t89`＝迭代映射（父 `[次数, 各参与对象…, 变量]`，带 `tag 2314`）、`t77`＝一步（父 `[变量, 映射]`）、
     `t88`＝迭代产出的点、`t32/t75`＝自定义工具/迭代实例。
     **要正确映射必须专门真值** → 已写请求 `ref-ctrl/jsp-samples/README-真值草图-iteration.md`
     （4 个最小迭代草图 `.gsp+.htm`；JSP 会把迭代**内联展开**，正好是明文真值）。
  2. **位置保真（item 1）**：`gspPosXY` 增加 `intersectLL`(t9 线线交点，唯一解）与
     `line2pt` 上的点（参数参照系与 `straightRef` 一致）。
  3. 全树：**`emitted 243360 → 243388`（+28）**——这类改动主要提升**位置精度**，不计入 emit 数。
- ✅ **本机续作（2026-10-03，第十三轮）：定性并落地 `t95` = 路径上按参数取的点（线段子集）。**
  1. 真值：`滑块变速.gsp` 的 `#12 t95=[#11(t94, Q 的路径参数), #7(线段 LM)]`；
     `可控虫子(inRm).gsp` 的 `#13 t95=[#12(计算值), #6(多边形)]` → 父序为 **`[值, 路径]`**。
  2. 渲染实测 `滑块变速`：GGB `R = Point(O_2, PathParameter(Q))` 在 LM 上的比例 = 0.237 = GSP 的
     `Q在A|Speed上 = 0.24` → **`t95` = 在路径上按参数取点**。
  3. 已落地**线段**路径（`Point(线段, 值)`；GGB 线段参数 = GSP φ）。多边形/圆/弧/轨迹等宿主参数
     换算未验证，暂跳过。顺带把 `pathParam`(t94) 加入 `NUM_KINDS`，使 `markerNumeric` 能引用它。
  4. 全树复测：**`emitted 242390 → 243360`（rate 59.54% → 59.78%，+970）**；`t95` 发射 0→180
     （余 1257 是“路径非线段/无法区分值-路径”，属级联），`smoke` +1 断言。
- ✅ **本机续作（2026-10-03，第十二轮）：位置保真——`gspPosXY` 支持变换点。**
  1. 之前圆的**圆上点**（定半径用）是变换点（如 `阴阳鱼` 的 `#2=t21`）时，`gspPosXY` 返回 null →
     圆上点不附 `<coords>`，初始位置交给 GeoGebra 自选（会跳位）。
  2. 现为 `gspPosXY` 增加 `translateImage`(t16)/`implicitRotate`(t21)/`rotateImage`(t27)/
     `dilateImage`(t30)/`offsetPoint`(t17)/点镜 `reflectImage`(t34) 的**文件坐标**解析
     （公式取自反编译的 `Translator`/`Rotater`/`Dilater`）。
  3. 验证：`阴阳鱼` 的圆上点由“默认位置”变为正确的 `(14.36,−6.14)`（= 存储方向 6.4°），
     真机 GeoGebra 渲染与 GSP 一致；`smoke` +1 断言（变换半径的圆上点附 `<coords>`）。
  4. 全树复测：**`emitted 241763 → 242390`（rate 59.39% → 59.54%，+627）**——
     增量主要是动画按钮现在有可动画目标；本改动更主要的价值是**位置保真**（不计入 emit 数）。
- ✅ **本机续作（2026-10-03，第十一轮）：用弧真值草图定性并落地 `t79`/`t80`/`t81`。**
  1. 用户在 `ref-ctrl/jsp-samples/` 制作了 `arc_circle_PQ.gsp`、`arc_circle_QP.gsp`、
     `arc_center_two_points.gsp`（**JSP 不导出弧，`Sketch.java` 无 `Arc`，故只存 `.gsp` + 渲染**）。
  2. **`t79` = 圆上的弧**：父 `[圆, P1, P2]`，**P1/P2=选择顺序**（PQ/QP 两图的父序随选择翻转），
     `Arc(圆, P1, P2)`；渲染方向与 GeoGebra 逆时针约定**一致**（现有映射正确）。
  3. **`t80` = 以圆心与两点画弧**：父 `[圆心, P1, P2]`（实测 parents[0] 与 P1/P2 等距=圆心）→
     `CircularArc(圆心, P1, P2)`。**已落地**。
  4. **`t81` = 过三点的弧**：父 `[P1,P2,P3]`（P1 起点、P2 在弧上、P3 终点）→
     `CircumcircularArc(P1,P2,P3)`。**已落地**；渲染实测弧长 37.94（=应有的 332.6°），端点/走向与 GSP 一致。
     （更正：早先把 t81 误判为“过三点的圆”、误用 `CircularArc`；实际 GeoGebra 里
     `CircularArc(M,A,B)` 才是“以 M 为圆心”的弧。）
  5. 全树复测：**`emitted 236087 → 241763`（rate 57.99% → 59.39%，+3,308）**；`smoke` +1 断言。
- ✅ **本机续作（2026-10-03，第十轮）：`t15` 新增「变换后的圆」上的点。**
  1. `point on unsupported path` 的 4,641 条中，约 700 条的路径是**变换后的圆**
     （`rotateImage`/`translateImage`/`implicitRotate`，基类型 `circleOn`/`circleRadiusObj`），
     而旧代码只识别“**未变换**的圆”（`CIRC_KINDS.has(path.kind)`）。
  2. 现扩展到「沿 `XFORM_KINDS` 解包后基类型是圆」：发 `Point(<变换后的圆>)`——保持约束与可动画性；
     位置参数存于**基圆**参照系、需复合变换，故不附 `<coords>`，初始位置交给 GeoGebra（不猜）。
     受控样例 `c2 = Rotate(c,90°,O)`、`X_ = Point(c2)`，真机 GeoGebra 打开 `ok=True`。
  3. 全树复测：**`emitted 228234 → 236087`（rate 56.06% → 57.99%，+7,853）**；
     `t15` 发射 10,858→11,668、`point on unsupported path` 4,641→3,853，其余为级联。
     `node test/smoke.js` 新增 1 条断言。
- ✅ **本机续作（2026-10-04，第三十八轮）：修复生成的 `.ggb` 在 GeoGebra 里“打开文件失败”的四类非法表达式。**
  > 用户反馈“打开都报错”。GeoGebra 对非法表达式只弹“打开文件失败 / error in <expression>”对话框，
  > 但文件仍能被 `ggbcheck` 判为能打开，所以之前一路漏检。逐条用最小 `.ggb` 探针定位（见 `ref-ctrl/ggb-syntax/README.md`）：
  1. **保留标签 `x_`/`y_`/`z_`**：`sanitizeLabel` 原来给保留名 `x/y/z` 加后缀 `_` → `x_`/`y_`/`z_`，
     而 GeoGebra 把这几个名字保留给坐标轴，**引用它们的表达式全部报错**（`Point(x_)`、`Intersect(x_,f,1)`…）。
     改为加 `_1`（`x_1`/`y_1` 可引用），并把 `x_/y_/z_` 也加入 `RESERVED`。
  2. **`ParallelLine` 不是 GeoGebra 命令**：平行线应发射 `Line(<Point>, <Line>/<Segment>/<Vector>)`。
  3. **命令名大小写敏感**：`min`/`max` 须为 `Min`/`Max`（`sqrt`/`abs`/`ln`/`exp` 是内建函数，小写合法）。
  4. **坐标轴原点不是点时跳过**：函数图充当坐标系时原点父级是函数，原来会发射非法的 `Line(f, f+(1,0))`。
  - 工具：`tools/ggbcheck.ps1` 改为**枚举所有顶层窗口**以检测错误对话框（`err=True`）；
    新增 `tools/ggbshot.ps1`（打开+截图）、`tools/ggbexprs.js`、`tools/lscheck.js` 等。
  - 验证：**`Sample.gsp` 19 页全部 `err=False`**（原为全报错）；`00005.gsp` page1 干净。
    覆盖率 70.79% → **70.74%**（283056，删除 198 个非法轴/悬空对象）；`smoke` 通过。
  - 已知残留：`00005.gsp` page2-4 仍报错——该文件各页**互相引用**（page2 的轴/度量引用 page1 的对象）
    且把**函数当点/直线**用（`(f)+(1,0)`、`Line(f,f_2)`、含 `x` 的 t71 度量），需进一步建模。
- ✅ **本机续作（2026-10-04，第三十七轮）：GSP 5.06 的多页编码（`tag 2316`）——`00005.gsp` 正确拆成 4 页。**
  1. `00005.gsp` **没有** `tag 1100`；它的分页记录是 **`tag 2316`（伴 `tag 2216/8004`）**，且位于**每页最后一个对象的记录里**
     （其后下一个对象的 `tag 2000` 开始新页）。实测边界为对象 `1-73 / 74-116 / 117-155 / 156-188`。
  2. 读取器：无 `tag 1100` 时，遇 `tag 2316` 打一个"待分割"标记，下一个 `tag 2000` 开新页；
     这类文件的父引用是**全局序号**（非页内相对），故父解析保持全局（**仅 `tag 1100` 文件**用"页内优先再全局"）。
  3. 实测 `00005.gsp` planned **4 页（73/43/39/33 = 188）**，每页一个 `.ggb`；真机四个都 `ok=True err=False`；
     全覆盖率不变 **70.79%**（283,254）；`smoke` 通过。
- ✅ **本机续作（2026-10-04，第三十六轮）：TUI 优化。**
  1. **多页**：TUI 的 `runOne` 之前只写 `r.out`（多页 `.gsp` 会丢页）；现按页写到 `<输出名去扩展名>/<页名>.ggb`，
     报告显示 `pages=N`。
  2. **新增「合并」**：主菜单加「合并文件夹内 .ggb → 多页 .gsp…」（`runMerge`），浏览到文件夹后 Space 执行；
     非交互模式加「6) 合并」。
  3. **健壮性**：修 `buildRunning` 在 `jobIndex` 越界/过期时崩溃（`state.jobs[idx]` 空指针）；
     实测 `1×1` 等极端尺寸、过期索引都不崩。
  4. **UX**：文件浏览与报告支持 Home/End；报告页脚显示滚动区间 `a-b/N`；帮助文案更新。
  5. `smoke` 通过（新增 `runMerge`、越界两条断言）。
- ✅ **本机续作（2026-10-04，第三十五轮）：`00005.gsp` 攻坚（二）——转化率压到理论最高（54 → 182/188）。**
  1. `t72` 函数图线改为**发出**（作为其函数的图线；GeoGebra 里函数即图线）；
     `t65/t66` 的"点"若是**圆**则取其圆心；`t73` 公式文本解码 `tag 2300` 后发为文本；
     `t15` 宿主是**交点(t98)** 时发为其函数图线上的点；`t54` 父是**图线(t72)** 时用该图线自己的坐标系单位点。
  2. 实测 `00005.gsp` planned **54 → 182/188**。剩余 6 个：4 个 `t61` 坐标系（**非 GeoGebra 对象**，只画成轴线）、
     2 个 `t8` 多边形（顶点是直线/线段/交点这类非点曲线；若要强行发会得到错误的多边形，故仍跳过）。
     真机 GeoGebra 打开 `ok=True err=False`。
  3. 全覆盖率 **70.16% → 70.79%**（280,730 → **283,254**，+2,524）；`smoke`/`exprcov` 通过。
- ✅ **本机续作（2026-10-04，第三十四轮）：多页支持（每页一个 .ggb / 多文件↔多页）。**
  1. 读取器为每个对象记录 `section`（所属页），`meta.sections[i]` 补上 `ids`。
  2. **正向**：`irToGgbPages(ir)` 把多页 `.gsp` 拆成**每页一个 `.ggb`**（`sectionIR` 会把该页依赖的跨页对象一并拉入）；
     CLI 输出到以文件命名的文件夹 `<文件去扩展名>/<页名>.ggb`（页名做了文件名清洗、去重）。
     实测 `map-projection3.gsp`→4 个、`example-15.gsp`→18 个；真机打开 `ok=True err=False`。
  3. **反向**：`irListToGsp([{ir,name}])` 把多个 `.ggb` 合成**一个多页 `.gsp`**（每个输入一个 `tag 1100` section）；
     CLI：`node bin/cli.js <ggb文件夹> --to gsp --merge [-o out.gsp]`（按文件名排序）。
     实测 4 个 `.ggb` → 一个 `.gsp`，读回为 4 个 section（`page1:78/test:8/test2:8/test3:8`）。
  4. `smoke`/`exprcov`/`emitstats` 无回归（280,730 / 70.16%）。
- ✅ **本机续作（2026-10-04，第三十三轮）：`00005.gsp` 攻坚（一）——`t98` = 函数图线与路径的交点。**
  1. `00005.gsp` 是函数图线综合图：`t98`（`A/B/C/D1-D4/M`）是**函数图线与另一条路径（x/y 轴、另一函数、圆）的交点**，
     父表 `[路径1, t72 函数图线]`，2003 只有一个 0.0 参数。
  2. 落地：`t72` 父解析为其**函数对象**（图线本身由函数重建、被跳过），发 `Intersect(路径, 函数, k)`；
     同一对父的多个 `t98` 按 id 顺序给 `k=1,2,…`（区分 `D2/D4` 等同父不同交点）。
     **并把 `t98`（及 `t101`）加入 `POINT_KINDS`**——否则"以交点为圆心/端点的圆、多边形"全被判为非点而级联跳过。
     另：测量/绘图点的"坐标系统父"若指向 `t72`，解析到该图线自己的 `t61` 坐标系。
  3. 实测 `00005.gsp` planned **54 → 152/188**；`Intersect(h,f,1)`/`Intersect(x_,f,1)` 等；真机 `ok=True err=False`。
     全覆盖率 **69.88% → 70.16%**（279,615 → **280,730**，+1,115）；`smoke`/`exprcov` 通过。
  4. 待做（该文件剩余 ~36）：`t73`（`tag 2300` 公式文本）、`t71`（`"q"`，6 父，疑轨迹）、
     `t63 line2pt`/`t5 perpLine`（父含 `t72` 图线）、`t54 squareUnitY`（原点解析）、`t48` 文本、少量 `t8`/`t15`。
- ✅ **本机续作（2026-10-04，第三十二轮）：`t.gsp` 反馈修正——函数图线上的点初始位置 + 坐标轴原点固定。**
  1. `t.gsp` 的 `A` 是**函数图象上的点**（宿主 `t72`，`f=√3`）。上一轮改成 `Point(f)`（可拖动）后**初始位置丢了**。
     现按图象的 x-域分数算出 `x0`，并**数值求值 `f(x0)`**（新增 `evalConstExpr`，仅当函数表达式自洽、无 `{#id}` 引用时），
     把 `(x0, f(x0))` 写进 `<coords>` → `A = Point(f)` 且初始位置与画板一致（实测 `coords=(1.002933213, 1.73205080757)`）。
  2. **坐标轴原点固定**：`t58/t59` 轴的第一父（坐标系原点，如 `C`）现标为**固定点**，写出 `<fixed val="true"/>` →
     在 GeoGebra 里**不可拖动**（它是坐标系统的结构锚点）。实测 `C` 带 `<fixed val="true"/>`。
  3. 真机 GeoGebra 打开 `t.ggb` `ok=True err=False`；`smoke` 通过。
- ✅ **本机续作（2026-10-03，第三十一轮）：正向"线上/轴上的自由点"。**
  1. 此前 `t15` 宿主是**直线类**（`line2pt/perpLine/parallelLine/angleBisector`，1084 个）或**坐标轴**
     （`axis`，501 个）时，发的是**固定坐标表达式** `(p1)+t·((p2)-(p1))`（点**不可拖动**，且 GSP 的 φ
     参照系可能≠路径自身端点）。
  2. 现统一改为 **`Point(路径)`**（自由路径点）：位置能用 `gspPosXY` 精确算出时写成 `<coords>`，
     否则把初始位置交给 GeoGebra（与线段/圆上点同策略）——点始终**约束在直线/轴上且可拖动**。
     实测 `example-36`：轴上的 `H/G → Point(x_)`、`O_11/O_12 → Point(y_)`；`example-25`：`Point(j)/Point(c1')`；
     真机 GeoGebra 打开 `ok=True err=False`。
  3. 覆盖率基本持平（279,491 → 279,549；语义修正为主），`smoke` 通过；反向 `Point(路径)→t15` 亦对得上。
  4. **追加（`t.gsp` 反馈）**：`t.gsp` 里的 `A` 是**函数图象上的点**（宿主 `t72`，`f=√3` 的水平线），上一轮没覆盖到，
     仍被发成固定点 `(x0,f(x0))` → 无法拖动。现改为 **`Point(f)`**（GeoGebra 中函数图象也是路径），点**可沿图象自由拖动**；
     位置能算出时附 `<coords>`，否则交给 GeoGebra。实测 `t.ggb` 里 `A = Point(f)`，真机打开 `ok=True err=False`；
     覆盖率 279,549 → **279,610**（69.88%）。`smoke` 断言同步更新为 `A = Point(f)`。
- ✅ **本机续作（2026-10-03，第三十轮）：反向转换增强。**
  1. 现状：对 `gsp→ggb→gsp` 往返（150 文件）反向仅 **33.1%**（14,155/42,760）。根因：`translate args` 2777、
     `cmd Point` 1067、`unparsed expression` 7908、`(P)+(dx,dy)` 偏移点等。
  2. `ir2gsp.mapObj` 新增：
     - `Translate(pre, Vector((dx,dy)))` → **t21 极坐标平移**（反算 `ddx=gx*50, ddy=-gy*50`）；
     - `Translate(pre, (k)*Vector((cx,cy)))` → **t24 定角+标记距离平移**；
     - `Point(path)`／`Point(path,t)` → **t15 路径点**／**t95 按参数取点**（`[值, 路径]`）；
     - `(P)+(dx,dy)` → **t17 固定偏移点**（`gy==0`→t52 单位点、`gx==0`→t55 纵单位点）；
     - `Dilate(pre, <测量值>, center)` → **t33 DilationMR**；
     - `Area/Perimeter/Circumference/Radius` → **t42/t39/t40/t46**。
  3. 往返反向 **33.1% → 66.8%**（14,155 → 28,569），**143/143 输出可被本机读取器重新解析**（`badParse=0`）。
     `smoke` 通过。提交 `8cfdb8c`/`e2c…`。
  4. 仍待做：`unparsed expression` 7018（多为数值测量：横/纵坐标 559、比值、坐标距离、plotXY；及文本 842）、
     `depends on skipped` 3657、`free button` 1328、`line args` 425（坐标轴线 `Line(O,O+(1,0))`）、
     `cmd Sequence/IterationList/Arc/Locus/PathParameter`（迭代/弧/轨迹）。
- ✅ **本机续作（2026-10-03，第二十九轮）：宏展开——`t101/t102`（自定义变换的像）落地。**
- ✅ **本机续作（2026-10-03，第二十九轮）：宏展开——`t101/t102`（自定义变换的像）落地。**
  1. 真值：用户用本机 GSP5 做的最小例 `ct_tf_min.gsp`（A 为心把 B 逆时针转 90°→B'，选 A、B' 创建自定义变换，
     作用到自由点 P），并报告了 `A/B/B'/P/P'` 的坐标。反推得规则：**`T(X)` ＝ 把原型 `P'` 的构造里的定义点
     `P` 替换成 `X`**——即 `rotate(B,X,90°)`，与 GSP 实测 `P'=(-9.84,8.23)` **逐位吻合**。
     编码：父表 `[P', X, …, P']`（**首尾同号**，全语料 1032/300 均成立）。
  2. 落地 `customXformPlan`（`t101` 点值 + `t102`）：取原型 `P'` 的 plan，把 `{#P}` 全替换为 `{#X}`；
     `P` 取"原型表达式引用到的、是点的中间父"。**非点预象**（线段/圆）则对其实义点做替换
     （`Segment(T(Y),T(Z))` / `Circle(T(c),T(p))`——因该变换对 X 是仿射的，像即端点/定点的像）。
  3. 验证：`ct_tf_min` 发出 `P' = Rotate(B,90°,P)`；`ct_transform` 发出
     `O_8 = Segment(Rotate(B,30°,O_5), Rotate(B,30°,O_6))`（均与手算一致）；真机 GeoGebra 打开
     `阴影构造四法`、`ct_transform` 等 `ok=True err=False`；`smoke` 通过、`exprcov` 99.9%。
  4. 覆盖率 **69.75% → 69.85%**（279,105 → 279,491，+386）。**未支持**：原型不可发、定义点无法识别、
     或受上游级联的实例；`t32`（工具文件夹，定义不在文件内）仍不展开。
- 🔬 **本机续作（2026-10-03，第二十八轮）：`t33`（DilationMR，共 12177）跳过普查。**
  1. 跳过 6653：主因 **`center is not a point` 2169**，其中约 **1500 是级联**（center 的父链里含被跳过对象，
     多为 `t32` 宏或未解码标记），真正"中心非点"约 500（parent[1] 为 text/numeric/segment/circle）。
  2. 次因 **`value not decodable (tag 2311)` 871**——但查其 parent[2]（比例标记）实为
     segment/midpoint/point/变换像，**并非数值**，说明这些 `t33` 疑似**不是 DilationMR**（结构不同或类型复用）。
  3. 父点性模式统计：`PP-`（前两父是点，第三父是文本/参数）最多（~6000），与"center=parent[1]"一致，
     现状**已能发**；`-P-`（p0 非点、p1 点）约 800 也已发。
  4. 结论：`t33` 的缺口**主要受上游 skip 级联**或**标记非数值**（结构异常）限制，自包含可修项很有限。
- 🔬 **本机续作（2026-10-03，第二十七轮）：迭代族剩余缺口普查 + 关键更正。**
  1. 现状（本机 1430 语料）：`t76` emit26/skip58、`t77` emit812/skip6158、`t89` emit457/skip1939；
     **全跳过**：`t90` 4411、`t75` 3681、`t88` 615、`t10` 359。
  2. `t77` 跳过主因：`start is not a point/number` 1881、`image not emittable` 1667、
     `image does not depend on the preimage (multi-variable?)` 1428、`not an iteration object` 672、
     `segment iterate image: endpoints are not points/numbers` 404。
  3. **更正**：JSP **不会**内联迭代——`ref-ctrl/jsp-samples/iter_*.htm` 里迭代对象被整个丢弃
     （`iter_point_rotate` 只剩 `O/P/P''` 三个对象）。故 **迭代族没有 JSP 真值**，只能靠控制草图+真机渲染核对。
  4. 新定性：
     - **`t75`（3681）＝"动态着色/渐变副本"**（`渐变色线段.gsp`：`t75 [点或线段, 比例参数]`；
       对应反编译 `ColorizedSpectrum/HSV/RGB/Grayscale`）。其**几何 = parent[0] 的副本**，只有颜色随参数变；
       GeoGebra 无动态颜色 → 只能发静态副本或跳过（无几何损失）。
     - **`t90`（4411）＝"带 `tag 2300` 的对象"**，形状 `[对象, 数值/标签]`（`p1` 72% 是 `t48`）；
       例 `坐标随点`：`t90 [平移点, 坐标对标签]`、`Sample`：`t90 [放大点(t30)/变换点(t16), t48]`。
       与 `t75` 极可能同族（动态着色/标注），**几何 = parent[0]**。
     - **`t88`（615）＝迭代"终点"点**（`牛顿求根序列`：`#15 标签 "x[n]" = t88 [t77]`，父 92% 是 `t77`）→
       或可发 `Element(IterationList, 次数)`，需渲染核对。
     - **`t10`（359）＝迭代/工具的"变量槽"**（父多为 `[圆/对象]`）。
  5. 结论：迭代族**核心（t76/t77/t89 单点/单值映射）已落地**；剩余多为**无几何的显示对象**（t75/t90）或
     **缺真值**（t88/多映射 t89）。继续需新的**渲染核对控制草图**；否则宜转其它根因。
- 🔬 **本机续作（2026-10-03，第二十六轮）：自建真值定性 `t32/t101/t102`＝"宏实例"。**
  1. 真值文件（`ref-ctrl/truth-tools/`，用户用本机 GSP5 制作）：
     - `ct_midpoint/ct_circumcircle/ct_fractal`：**本文件内定义的工具**，使用处被 GSP5 **内联**（不产生 `t32`），
       只留下带 `tag 1100/1204/9007` 的定义页 → 所以"本地工具"这条路产不出 `t32`。
     - `ct_transform`：**自定义变换**（`变换→创建自定义变换`）的像 = **`t102`**（`#7 t102 [B', 圆, A, B']`）。
     - `ct_toolfolder`：**工具文件夹里的工具**用出来是 **`t32`**（#61/#136），且出现在"外层工具已被内联"的构造中间
       → 该工具**内部又调用了另一个工具**。
  2. 在 `Tool Folder\12 圆锥曲线B.gsp` 找到定义：18 个 section，`tag 1204`＝输入/输出序（`[K,K,K-1,…,1]`）；
     构造页对象**跨 section 引用顶层 demo 对象**；section#11 的标签 `focus/directrix/vertex/radical axis/radical point`
     与 `ct_toolfolder` 完全一致（4 输入）。
  3. 结论：`t32`(3571)/`t101`(1032)/`t102`(300) 同族——**"把一段构造（工具/自定义变换）套用到给定输入"的宏实例**，
     父表引用该构造的输入与中间对象，**不携带构造本身**；工具来自 Tool Folder 时定义根本不在使用文件内。故不猜无法还原；
     要落地需实现"宏展开 + 按签名匹配 Tool Folder 定义"，属独立大功能。**当前跳过并级联**。
- 🔬 **本机续作（2026-10-03，第二十五轮）：`t32` 初判＝自定义工具实例（构造在外部，暂不可转）。**
  1. `t32` 恒 **5 父**（统计 3571 个；最常见 `[t32,t32,t0,t0,t15]` 747、`[t0,t0,t0,t0,t15]` 421、
     `[t32,t32,t16,t16,t15]` 288…），首父常递归 `t32`（分形/递归作图，如 `兔年吉祥`）。
     实例对象上**只有 `2002` 父表**（无参、无坐标、无 rich），偶带 `2005` 标签；**不携带工具名**。
  2. 工具定义是**带名的页面**：`tag 1100`（工具名）+ `tag 1204`（输入/输出序，如 `[K,K,K-1,…,1]`）+
     `tag 9007`（说明）+ `tag 2319`（参数）/`1002`。仅见于 `Tool Folder\*.gsp`（26/43 个含定义）与
     `Support Files\Example Tools.gsp`。语料 3571 个 `t32` 中**仅 262 个**所在文件含 `9007`（且多页无名）。
  3. 结论：绝大多数 `t32` 的工具**构造不在文件内**（`相切圆2.gsp` 连 section 都没有），无法在不猜的前提下
     还原为 GeoGebra 命令（JSP 语法也没有自定义工具指令，故拿不到 JSP 真值）。**暂不映射**。
     若要推进，需：(a) 用本机 GSP5 **新建并保存**一个「定义+使用自定义工具」的文档（定义会内嵌）做真值；
     或 (b) 从 `Tool Folder` 反解定义格式并按签名匹配。
- ✅ **本机续作（2026-10-03，第二十四轮）：`t94` 跨宿主（点投影到另一条直线）。**
  1. 真值依据：反编译 `PointOnStraight.mapPointToHost` + `Constrain`——GSP 把点投到宿主的**直线**后取
     相对位置 `relativeLocation = (this.x-x1)/dX`（或 y 方向），即**投影参数**；线段（`myStraightType 0`）
     会先夹到端点，故参数 ∈ [0,1]。同宿主情形（第二十轮已落地的 `PathParameter`）即此逻辑特例。
  2. 现对 `p0` 为点、`p1` 基线为 `segment`/`line2pt`（含仿射像）的跨宿主 `t94` 发射
     `((xP-xA)(xB-xA)+(yP-yA)(yB-yA))/((xB-xA)²+(yB-yA)²)`；线段再套 `min(1,max(0,…))` 夹取。
     直接以端点坐标书写，绕开 GeoGebra `PathParameter` 在直线/异参照系下的不确定性。
     例：`橡皮筋(一线天)` 的 `D` 落在 `Line(A,C)` 上，投影式正确；真机打开 `ok=True err=False`。
  3. `point-position measure: unsupported host` **2348 → 1155**（余下宿主为圆/多边形/非路径）；
     覆盖率 **67.58% → 69.75%**（270,411 → **279,105**，+8,694）。圆宿主（`PointOnCircle` 存角度，
     参照系未验证）与投影超界时“是否夹取”仍属推断，已在 `Tech_Details.md` 标注。
- ✅ **本机续作（2026-10-03，第二十三轮）：坐标系解析支持“轴单位＝数值测量”。**
  1. 此前 `axisScaleRef` 只认单位点（`unitX`/`squareUnitY`/`rectUnitY`）；当轴的单位是一个**数值测量**
     （`t48` 计算 / `t37` 距离 / 参数…，例：`Sample.gsp` cs#129 的单位参数「单位点」=1）时返回 null，
     连带 `plot point / abscissa / ordinate / plotXY / coordinate distance / coordPair` 成片跳过。
     现改为**引用该数值对象**（`unit = {#id}`；其 GeoGebra 值已按输出单位发出，读数与画板一致——
     自洽校验：`Circle(O,"R"=4)` 与 x 轴交点应在 ±4 单位）。
  2. 另支持 **`t56`**：某轴的单位继承自另一条轴（y 轴单位 `t56` → 其父 x 轴的单位）。
  3. `plot point: coordinate system not computable` 560 → 0；覆盖率 **64.40% → 67.58%**
     （257,680 → **270,411**，+12,731）。真机 GeoGebra 打开 `太极图整体轨迹(一线天)` 等 `ok=True err=False`。
- ✅ **本机续作（2026-10-03，第二十二轮）：`t95`（路径上按参数取点）放开到非线段路径。**
  1. 此前 `t95` 只在“一条父是线段”时发 `Point(线段, 值)`；本轮放开到 **多边形/圆/弧/轨迹/直线**：
     发 `Point(路径, 值)`（对象在 GeoGebra 中仍是 Path，点保持在其上；沿路径的初始位置可能不同——
     与单参数圆上点同策略；线段情形仍是精确的）。
  2. `point at a parameter: cannot tell path from value` 1117 → 0（余 582 为“值不可解码”）。
  3. 覆盖率 **64.16% → 64.40%**（256,726 → **257,680**，+954）。真机 GeoGebra 打开 `ok=True err=False`。
- ✅ **本机续作（2026-10-03，第二十一轮）：`pointOnPath` 支持“无参数”路径点与变换后的直线。**
  （本机语料 `D:\Sketchpad5` = 1430 文件。）
  1. 线段/直线路径：`t15` 无存储参数（`params` 为空）时此前直接跳过；现发 `Point(路径)`，保持“在路径上”的
     约束、初始位置交给 GeoGebra（与单参数圆上点同策略）。受益于 `t2/segment` 无参数 486、`t63/line2pt` 等。
  2. 变换路径：新增**变换后的直线**（基类型 `line2pt` 等）→ `Point(变换后的直线)`；无参数时对
     变换后的 线段/直线/多边形/圆 统一发 `Point(路径)`。
  3. `point on unsupported path` 2721 → 1884；覆盖率 **61.21% → 64.16%**（244,915 → **256,726**，+11,811）。
     真机 GeoGebra 打开 `ok=True err=False`。
- ✅ **本机续作（2026-10-03，第二十轮）：`pointOnPath` 支持弧/轨迹路径；`t95` 计入点类。**
  （本机语料 `D:\Sketchpad5` = **1430 文件**，与上文 `1478 文件` 基线不可直接相减。）
  1. `t15` 的路径此前只支持 线段/直线/多边形/圆/变换像/函数图；**本轮新增弧（`t79`/`t80`/`t81`）与
     轨迹（`t35`）** 路径：发 `Point(路径)`（初始位置交给 GeoGebra——GSP 的弧/轨迹参数系与 GeoGebra
     不同，与“单参数圆上点”同一策略）。`point on unsupported path` 3732 → 2721。
  2. `t95`（`pointAtParam`）此前未计入点类，补入 `POINT_KINDS`。
  3. 本机覆盖率 **59.44% → 61.21%**（237,867 → **244,915**，+7,048）。真机 GeoGebra 打开 `ok=True err=False`。
- ✅ **本机续作（2026-10-03，第九轮）：定性并落地 `t24` = 定角 + 标记距离平移（`FixedAngleMarkedDistance`）。**
  1. 用户按 `ref-ctrl/jsp-samples/README-真值草图-t24.md` 制作了 4 对控制草图；其中
     `translate_fixedangle0/90_markeddist.gsp+.htm` 显示 `.htm` 为
     `Translation/FixedAngle/MarkedDistance(pre, dist, θ)`、`.gsp` 为 **`t24` 父 `[原像, 距离值]`**
     + 参数 `(-sinθ, cosθ, θ)`（距离值 1945/4355 是 `t48` 计算值）。
  2. 用「揭隐截图 + 像素聚类」实测 θ=90° 草图：`P'−P` 文件坐标 `(0,−313.1)` = 线段 AB 文件长度
     313.08 → `image = pre + v·(cosθ, −sinθ)`，v = 标记距离值（**文件坐标单位**，非界面 cm）。
     因距离父对象发射成的 GeoGebra 数值已是 GGB 单位，故发
     `Translate(pre, v*Vector((cosθ,sinθ)))`（v 不再乘/除 `SCALE`）；非等比 frame 下跳过。
  3. 顺带定性两个小类型：**`t22`** = 标记角(3 点)+定距（父 `[原像,A,B,C]`，参数含固定距离）；
     **`t25`** = 标记角+标记距离（父 `[原像,A,B,C,距离值]`）。二者暂未落地（语料仅 5 / 12 条）。
  4. 全树复测：**`emitted 218095 → 228234`（rate 53.57% → 56.06%，+10,139）**；`t24` 发射 2,236，
     其余 2,119 全部是「依赖被跳过对象」级联（无解码失败）。`node test/smoke.js` 新增 1 条 t24 断言。
- ✅ **本机续作（2026-10-02，第四轮）：把此前故意跳过的 `t62` 动作按钮接上了（隐藏/显示 + 动画均已人工点击验证）。**
  1. `2310` 记录解析：偏移 12 起 `u16` 类型码，偏移 20/22 `u16` = `(left,top)`（见上「关键事实」）。
  2. `src/ggb.js` 新增 `case 'button'`：类型 `0`/`1`/`2` 发 GeoGebra `<button>` + `<ggbscript>`
     （`SetVisibleInView(目标,1,false/true)` / `StartAnimation(目标,true)`），中文标题进 `<caption>`；
     级联阶段对按钮特殊处理——**只在目标引用上做“保留存活者”过滤**，而不是整只丢弃。
  3. 顺带修根因：线段上的点在旧代码里发成**坐标表达式**（位置对但不可动画）。真机点击报
     「启动动画: 参数不符合规则: 点 C」，查 GeoGebra 源码确认：`AlgoPointOnPath` 属
     `FixedPathRegionAlgo`，对 `Point(路径, 常数)` 的 `isChangeable()` 恒为 **false**，
     于是 `GeoElement.isInherentlyMoveable()`/`GeoPoint.isAnimatable()` 均为 false——
     **带固定参数的点永远不能动画**。真正的“线上自由点”是 `Point(路径)`（无参数），
     位置由 `<coords>` 恢复（`ConsElementXMLHandler.handleCoords` 临时保存并复原定义、
     经 `Kernel.handleCoords → GeoPoint.setCoords → path.pointChanged` 反解出路径参数）。
     故线段/多边形上的点改发 `Point(路径)` + `<coords x y z>`（坐标在转换期由 `gspPosXY` 解析端点算出）；
     算不出位置的仍退回 `Point(路径,φ)`（几何正确、不可动画）。
  4. 真值 `ref-ctrl/jsp-samples/运动方向(inRm)` 逐字段吻合：`C`=`Point(O)` + `<coords x="3.34883499603" y="-1.96"/>`
     （= A+φ(B−A)），按钮「动画点」渲染于 (20,90)，脚本 `StartAnimation(C,true)`。
  5. **端到端点击**（人工点击；本环境合成鼠标事件命中不了画布对象，只能人工点）：
     - **隐藏按钮已验证生效**：`SetVisibleInView(目标,1,false)` 点一次目标消失、再点仍隐藏（几何画板「隐藏」本就单向）。
     - **动画按钮已验证生效**：改发 `Point(路径)`＋`<coords>` 后，人工点击「动画点」→ C 沿线段动起来、无脚本错误。
     - 只有**能发成线上自由点**的目标（线段/多边形上的点）才挂动画脚本；圆/函数等路径上的点、
       GSP **参数**（数字）目标一律跳过——`GeoNumeric.isAnimatable()` 要求
       `isIntervalMinActive() && isIntervalMaxActive()`，我们没写滑块区间，发脚本必报错。
       全语料 `StartAnimation` 调用点 = 140（改前为 0 个可用）。
- ✅ **本机续作（2026-10-02，第五轮）：`t62` 再补「移动」(kind 3) 与「同时」(kind 7) 两类动作按钮。**
  1. **kind 7 = `SimultaneousButton`**：父即被触发的按钮，点击时依次对每个父 `handleClick`。发一个
     `<button>`，其点击脚本**内联**（递归展开，深度上限 8）各存活被触发按钮的脚本
     （`SetVisibleInView` / `StartAnimation` / `SetCoords`）；被触发按钮被跳过则在级联阶段剔除。
  2. **kind 3 = `moveAction`**：父为 `[., .]` 成对，`periodicAction` 把每对的**源**拖向**目标**
     （`source.dragToward(dest)`）。反编译构造器是 `(dest, source)`，但语料实测二进制为**反序**
     `[source, dest]`（5,137 对第 0 父可拖动、仅 169 对第 1 父可拖动），故按“可拖动者为源”定序；
     目标取另一者。发 `SetCoords(源, x(目标), y(目标))`。`SetCoords` 已由 `command.properties`
     （`[<Object>,<x>,<y>]`）与官方手册（“移到最接近的可行位置”，对路径上的点亦生效）确证；
     上文关键事实 #10 里“`SetCoords` 不可用”的旧记录已更正（当时应是目标点本身不可移动）。
     源点须可移动（自由点或 `Point(路径)`），目标须是点，否则跳过。
  3. 该轮覆盖率 **47.64% → 47.91%**（+389；`t62` 发射 3,703 → 4,771）；随后第六轮修圆父序净 **−306**，
     故为 **47.83%**（再经第七轮 `2307` 测量族升至 **52.50%**）。剩余 `t62` 跳过：
     目标全被上游跳过（4,421）、移动对源/目标不明（1,432+2,254）、数字目标不可动画（1,218）、滚动按钮（197）。
- ✅ **本机续作（2026-10-02，第八轮）：弧对象与弧测量（`t43/t44`），并给 `t70` 补 `PlotXY`。**
  1. **`t79`/`t80`/`t81` = 圆弧**（**2026-10-03 第十一轮已定性并全部落地**：`t79`=`Arc(圆,P1,P2)`、
     `t80`=`CircularArc(圆心,P1,P2)`、`t81`=`CircumcircularArc(P1,P2,P3)`）。
  2. **`t43` = 弧的角度 → `Angle(弧)`；`t44` = 弧长 → `Length(弧)`**（`Angle(<Object>)`/`Length(<Object>)`
     均接受弧）。
  3. **`t70` = `PlotXY` 变体**（3 父 `[x 表达式, y 表达式, 坐标系]`，同 `t69`），并入同一 `plotXY` 分支。
  4. 覆盖率 **52.50% → 52.82%**（210,068 → **211,364**）。真机 GeoGebra 打开 `ok=True err=False`。
  5. **未决**：`t124`/`t125`（同一 `(点,坐标系)` 上与 `t65/t66` **并存**的“第二套坐标对”，含义未定）；
     `t18`/`t19`/`t20`（带参数的点/递归点，疑自定义变换）；`t95/t98/t101` 等尚未普查。
     （`t24` 已于 2026-10-03 第九轮定性并落地。）
- ✅ **本机续作（2026-10-02，第七轮）：批量落地 `2307` 测量族，并发现 `t69` 其实是 `PlotXY` 点。**
  1. **`t69` = `PlotXY`**（3 父 `[x 表达式, y 表达式, 坐标系]` → 动态绘图点）。此前误映射为 `Calc` 且要求
     label 带 `{n}` 模板，几乎全跳过。改为发 `(originX + x·unitX, originY − y·unitY)`（用 `coordSysRef`），
     并把 `plotXY` 加入点类集合（连带解锁 `t86` 等把 `t69` 当点用的量）。
  2. **`t65`/`t66` = 横/纵坐标（`SimpleMeasure` mT13/mT14）**：`(x(P)−originX)/unitX` 与
     `−(y(P)−originY)/unitY`。此前误作 `x(P1)−x(P2)`（父含坐标系时非法）。
  3. **补 `SimpleMeasure` 其余种类**：`t38`=点到直线距离(mT3)｜`t39`=周长(mT4)｜`t40`=圆周长｜
     `t42`=面积(mT6)｜`t46`=半径(mT9)｜`t86`=坐标距离(mT15)，分别发 GeoGebra
     `Distance/Perimeter/Circumference/Area/Radius`。真机 GeoGebra 5.4 打开 `ok=True err=False`。
  4. 覆盖率 **47.83% → 52.50%**（191,402 → **210,068**，+18,666；含大量级联）。剩余 `2307`：
     `t124`/`t125`（2 父、常 `[点/数值, 坐标系]`）、`t43`/`t44`（父为弧类未映射对象）。
- ✅ **本机续作（2026-10-02，第六轮）：修圆的“圆心/半径”父序 bug（追 `t94` 边界时发现）。**
  1. 追 `t94` 跨宿主边界时，发现 `t64 [#t94(数值), #点]` 被发成 `Circle(数值, 点)`。查 GeoGebra
     `command.properties`：`Circle` 语法为 `[<Point>, <Radius Number>|<Segment>|<Point>]`——**第一参数必须是点**。
     GSP 圆父序不固定（半径测量常在第 0 位），故 `t3`/`t4`/`t64` 统一改为“**取是点的那一父作圆心**”。
  2. 修正后 `ref-ctrl/tangentLine_construction` 渲染为 `Circle(C,O)` 与 `Circle(Midpoint(A,C),C)`，
     与外接切线标准作法一致；代价是不再发出约 1,264 个“两边都不是点”的非法圆（净 −306 对象）。
  3. **`t94` 跨宿主仍跳过**：反编译 `variableRef` 证明 2311 求值强制把父转成 `SimpleMeasure`，
     即 **`t94` 是数值（非点）**，这同时解释了上面圆的父序问题；但“把 p0 投到 p1 的参数”是否夹到
     `[0,1]` 无真值，故不猜。`t35` 的剩余边界（直线轨迹 `gStraightLocus`、被跟踪对象为未解码类型）
     亦无可用真值，继续跳过。
- ✅ **本机续作（2026-10-01，第三轮）：修复用户报的 `t.gsp→t.ggb` 两个缺陷（数字变图形 / 坐标轴单位长度错）。**
  1. **坐标轴单位长度错 → `t54` 语义判读错误。** 依据 `ref-ctrl/jsp-samples/*.htm`（JavaSketchpad 真值）：
     `t52`=`UnitPoint`(SimpleUnitPoint，水平单位点)、**`t54`=`SquareUnitPoint`**（由某个单位点平方而来，
     **其尺度继承父单位点**）、**`t55`=`RectangularUnitPoint`**（自带独立尺度的竖直单位点）。
     旧代码把 `t54` 当作独立的 `shiftY`，直接拿**存储的 37.795(=1cm 默认值)**当 y 单位长度；而
     `SquareUnitPoint` 的存储值**不是**尺度（它恒等于父 `t52` 的尺度）。于是 `t.gsp` 的坐标架被压扁
     （`uy/ux = 37.795/69.795 = 0.54`），`#10` 自由点的 y 从 4.585 被放大到 8.467，坐标轴单位长度随之出错。
     **修复**：`src/gsp.js` 新增 `TYPES[54]='squareUnitY'`、`TYPES[55]='rectUnitY'`（并把 `52` 更名 `unitX`）；
     `src/ggb.js` 新增 `unitScaleOf()`（`squareUnitY` 递归取父单位点尺度），`pxOfPoint`/`sketchFrame`/`axisScaleRef`
     及发射分支同步改用新语义。`t.gsp` 实测：`O_2=(-2.5217, 4.5848)`、`coordSystem scale==yscale`（正方形坐标架）。
  2. **数字变图形（滑块）→ 常量函数被 GeoGebra 当数字。** `f` 是 GSP 里的常量函数 `f(x)=√3`（有 `t72` 函数图），
     旧代码发 `<element type="function" exp="sqrt(3)">`；表达式无自变量 `x`，GeoGebra 5.4 便把它**当成自由数字**，
     在绘图区渲染成一个**滑块**（横线+圆点）。**修复**：`src/ggb.js` 生成表达式时，若 `elem==='function'`
     且替换后不含自由 `x`，则写成 `<label>(x)=<表达式>`，GeoGebra 便保留为**函数**（绘制 y=√3 水平线）。
     实测 `f` 进入「函数」类，滑块消失。
  3. 全量复测：`emitted=127886 → 128254`（**31.41% → 31.50%**，+368；坐标架变正方形后更多对象通过非退化校验）；
     `exprcov` 解码 **57370/57607=99.6%** 不变；`ref-ctrl`+`jsp-samples` 22/22 转换成功；`test/smoke.js` → SMOKE PASSED。
     真机 GeoGebra 5.4：`f(x)=√3` 归入「函数」，`A=(1,1.73)`、`B=(1,0)`、`C=(0,0)`、`O_2=(-2.52,4.58)`、`y_=x=0`、
     `O_5=Slope(AB)`、`O_7=Slope(AC)=1.73` 与几何画板显示一致。
- ✅ **本机续作（2026-10-01，第四轮）：测量数字不再被画成"图形/函数"（用户复报 `O_5`/`O_7`）。**
  用户指出 `t.ggb` 里 `O_5=Slope(AB)`、`O_7=Slope(AC)` 仍显示为图形。真机差分验证（同一文件只改
  `<show object>` 前后截图）：**GeoGebra 只要某对象 `<show object="true">`，就把任何数字在绘图区
  渲染成滑块状图形**——这才是"数字变成函数/图形"的真正来源（第三轮只修了常量函数 `f`，未覆盖数字）。
  **修复**：`src/ggb.js` 发射 `<show object="…">` 时，**依赖型数字（GSP 测量读数：斜率/长度/角度/比值…）
  一律 `false`**（它们永远不该出现在绘图区，且本就不可拖动；数值仍显示在代数区「数字」类），
  自由数字（参数）保持 `true`，继续作为可拖动滑块以保留动态性。
  真机 GeoGebra 5.4 复验：绘图区只剩水平线 `f(x)=√3`、点 `O_2` 与原点附近线段，滑块图形全部消失。
  回归：`emitted=128254`（31.50%）不变（只改属性）；`exprcov` 99.6% 不变；`ref-ctrl` 22/22；
  `test/smoke.js` 新增 4 条断言（`O_5`/`O_7` show=false、线段/点 show=true）→ SMOKE PASSED。
- ✅ **本机续作（2026-10-01，第二轮）：`t47` 比值测量全量落地（含三点比）。**
  反编译 `SimpleMeasure.java` case 11 + `computed3PtRatio.java` 给出权威语义：`Ratio/Points`（measureType 11）
  的父为 `[A,B,C]`，值 `= |AC|/|AB|`，**当角 BAC > 90° 时取负**（`|angle|·2 > π`）。
  `Ratio/Segments`（measureType 8）父为两条线段，值 `= |s1|/|s2|`。
  新增 `TYPES[47]='ratioMeasure'`，`ggb.js` 发为 `numeric`：
  - 3 点：`(If(dxB*dxC + dyB*dyC < 0, -1, 1)) * (sqrt(dxC²+dyC²)/sqrt(dxB²+dyB²))`，
    其中 `dxB = x(B)-x(A)` 等（角符号用点积符号，与坐标手性无关，精确等价 `|angle|>90°`）；
  - 2 线段：`Length(s1)/Length(s2)`。
  **注意（本轮实测发现）**：GeoGebra 5.4 把 `P + t*(Q-P)` 形式的表达式**判定为向量**（而非点），
  于是对这类"点在路径上"的对象用 `Vector()/Distance()` 会算错（`Vector(P,r)` 退化为 0）。
  故三点比改用 **`x()/y()` 坐标差**书写，对点/向量两种推断都成立；`example-37` 的 `r_2` 由错误的 0
  修正为 2.91（`O_14 = Dilate(F,r_2,D)` 不再退化到中心 D）。
  `t33`(DilationMR) 的 marker（t47，常被 t48 标签包裹）改为**引用该 numeric 对象**而非内联，输出更干净。
  实测 **30.55% → 31.41%（emitted 124349 → 127886，+3,537）**；`t47` 直接发射 **0 → 540**，
  `t33` 937、`t29` 598；`ratioInfo` 与其共用 `ratioTemplate`。真机 `example-33`（包裹）/`example-37`（直连）
  转换后 GeoGebra 5.4 打开 OK、无 `undefined_1`。新增诊断 `test/probe47.js`、`test/emit47.js`、`test/t47raw.js`、
  `test/t47hdr.js`、`test/meashdr.js`。
- ✅ **本机续作（2026-10-01）：`t29`/`t33` 的 marker 接入 `tag 2311` 解码值。**
  `MeasuredAngleRotation`(t29) 与 `DilationMR`(t33) 的 marker 多为 `t48`，其自身 2311 程序就是标记值；
  旧代码只认「三点角」/「两线段比」形态，未用已解码表达式，故跳过 `marked-ratio…` 12,459 /
  `measured angle…` 4,402 条。现 `ratioInfo`/`angleTriple` 失败时回退 `decodedExpr(marker)`：
  t33 直接把解码标量当缩放比（无量纲），t29 直接当弧度角（反编译 `Rotater.PrepareRotation` 证实
  `Math.cos/sin(measure.value)`，与 GeoGebra 内部弧度一致）。
  实测 **29.79% → 30.55%（+3,089）**，t33 直接发射 4→554、t29 32→548；`ref-ctrl` 12/12 不变；
  `三角网格2`(t33)、`视频上的形变`(t29) 真机 GeoGebra 5.4 打开 OK。新增诊断 `test/markerdec.js`、`test/find2933.js`。
- ✅ `gsp → ggb`：**已能在真实 GeoGebra Classic 5.4 打开并渲染**。
- ✅ `ggb → gsp`：生成的 .gsp 在真实 几何画板 5.06 打开并渲染；双向往返。
- ✅ `.gsp` 解析成功率：**1478/1478 通过**（193 万条记录，0 条异常 tag）。
- ✅ 已确认第二类错位来自 **tag 9009 尾部填充字节未计入长度**，与 tag 1300 同类；
  `src/gsp.js` 现仅在边界 tag 明显左移且右移 1 字节后成为正常 16-bit tag 时跳过，避免误判。
- ✅ 真机回归：`Sample.gsp`、`经典实例`、`初中数学积件库`、`99table`、
  `2008烟台和2006桂林`、`正方体11种展开图` 转换后均可在 GeoGebra 5.4 打开。
- ✅ **本机新一轮（2026-09-27）：`tag 2311` 表达式全量解码并接入**（自由数取值、计算、
  函数、导数）。覆盖率 **25.88% → 29.13%**；`正弦型函数图像变换(修正颜色)` 转换为
  `sin(x)`、`sin(x+π/3)`、`sin(2x+π/3)` 等并经 GeoGebra 5.4 真机校验。详见文末 2311 结论。
- ✅ **本轮（2026-09-27，修复用户报错 `node bin/cli.js t.gsp -o o.ggb`「坐标、线段、元素均错」）**：
  - **根因**：`t.gsp` 使用自定义坐标系（`t61` 坐标系统 = 两条 `t58` 轴，轴由「原点 + 单位点」定义）。
    GSP 的**函数按坐标系单位绘制**，而普通点/线段存的是**画板像素**；旧代码对所有对象一律用像素映射，
    于是函数/坐标轴与点各自错位，斜率也随之错误。
  - **修复**：新增 `sketchFrame()`（`src/ggb.js`）。当草图**含函数**（`t71/t78/t72`）**且恰有一个**坐标系
    **且**坐标架非退化（单位比 `uy/ux ∈ [0.2,5]`）时，**整份转换切到坐标架单位**——原点取两轴单位点的公共基点
    （经 `unitPointOrigin` 沿 `unitX`/`squareUnitY`/`rectUnitY` 链回溯），单位向量取「原点→单位点」偏移；`coordSystem`
    视图与 `yscale` 纵横比一并跟随。**否则退回原像素映射**，因此无函数文件行为不变（1430 文件中 51 个命中）。
  - **函数图 `t72` + 图上点 `t15`**：`t72` 的 `tag 2306` 给出绘制 x 域 `[xmin,xmax]`（坐标架单位），
    其父 0 为被绘函数；`t15` 上的点存的是域内分数 `t`，输出 `(x0, f(x0))`（`x0 = xmin + t·(xmax-xmin)`，
    引用函数对象而非图对象）。`t72` 图本身跳过（GeoGebra 由函数自行绘制）。
  - **`t.gsp` 实测**（GeoGebra 5.4 真机）：`C=(0,0)`、`B=(1,0)`、`O=(0,1)`、`f(x)=√3`、`A=(1,1.73)`、
    线段 AB/AC/BC 齐备、`AC 的斜率 = 1.73 = √3`——与 几何画板 显示一致。
  - **`tag 2311` 一元负号优先级 bug 修复**（`src/expr.js`）：程序是**中序**且按**标准优先级**，
    `-x^2` 应为 `-(x²)` 而非 `(-x)²`。旧解析把一元负号绑得比 `^` 更紧，使 `正态分布曲线图` 的
    `2·e^(−x²/2)` 被解成 `2·e^(x²/2)`（上升曲线）。改为 `parseUnary` 的操作数按 `^` 级别解析；
    解码覆盖率不变（56875/57112，99.6%）。
  - 另验证：`二次函数的图像.gsp`（近方形坐标架）转出 `f(x)=1x²`、`g(x)=1(x−1²)`、`h₂(x)=1(x−1²)+1`
    与 `a=h=k=1`，与 几何画板 完全一致。
- ✅ **本轮新增（2026-09-27，原机 `C:\Users\Admin\Desktop`，语料 `D:\Sketchpad5` 1430 个）**：
  - **`t34` 反射的镜是圆 → 圆反演（inversion）已落地。** GSP 的 Reflect 允许圆作镜对象
    （例：`example-25.gsp` 的 `#96 t34 parents=[pointOnPath#89, circleRadiusObj#62]`），
    与 GeoGebra `Reflect(<Object>, <Circle>)` 语义一致（GeoGebra 手册明确：reflect about circle = invert）。
    实现在 `src/ggb.js` `planOf` 的 `reflectImage`：`elemTypeOf(mir)==='conic'` 时直接
    `Reflect(pre, mirror)`。**t34 直接跳过 795 → 97**（`tools/t34probe.js`）。
  - **修正 `straightRef()` 中 `perpLine/parallelLine` 的父顺序 bug（重要正确性修复）。**
    `.gsp` 实际存的是 **`[throughPoint, baseStraight]`**（全语料统计 t5 第一名 `[midpoint,segment]` 1050 次，
    t6 类似），而旧代码按 `[base, point]` 取值，导致 `rec(point)` 返回 null、整条参考对失败。
    `Perpendicular`/`Parallel` 类（`ref-ctrl/decomp`）也印证父 0 = straight、父 1 = thruPt 经
    `AssignParent` 写入，但桌面版 `.gsp` 的序列化顺序相反。已改为 `base = rec(parents[1])`、
    `P = R(parents[0])`。planOf 直出 `PerpendicularLine(Point,Line)` 本就正确，未受影响。
  - 覆盖率（本机 1430 文件）：**objects=400149，emitted 97,975 → 102,497 → 103,565，24.48% → 25.61% → 25.88%**
    （`node tools\emitstats.js "D:\Sketchpad5"`）。t34 emit 2895→3335，t2 13494→14429，
    t15 5245→5799，t9 2956→3222 等（级联解锁）；第三轮 `t28` 落地后 +909（t28 共 979 条，909 条可发）。
  - **新增真值轮（`ref-ctrl/jsp-samples/mark_*.gsp+.htm` 6 对 + CFR 反编译）**：
    `t28`=MarkedAngleRotation（5 父 preimage+center+A+B+C → `Rotate(pre,Angle(A,B,C),center)`，979 条，
    **已落地**）、`t31`=Dilation2S（4 父 preimage+center+numSeg+denomSeg → `Dilate(pre,Length(s1)/Length(s2),center)`，
    8 条，**已落地**）；`t29`=MeasuredAngleRotation、`t33`=DilationMR 见下。
  - 顺带修复 **自动命名抢名 bug**：之前未命名对象可能先占掉后面显式标签（如未命名线段抢了 `O`，
    使显式点 `O` 变成 `O_3`、依赖错乱）。现先**预留全部显式标签**再生成，`mark_ratio_dilate` 往返正确。
  - 反向（`.ggb→.gsp`）新增 `Rotate(pre,Angle(A,B,C),c)→t28`、`Dilate(pre,Length(s1)/Length(s2),c)→t31`；
    `mark_angle_rotate`/`mark_ratio_dilate` 往返后分别恢复为 `t28`/`t31`（父序一致）。
  - 真机校验：`example-25`(含圆反演)、`example-07`、`万花筒更新版`(1.3MB)、`polygon_reflections`
    转换后均可在 GeoGebra 5.4 打开（`tools\ggbcheck.ps1`）；`polygon_reflections` XML 为
    `Reflect(O,Line(O_8,O_9))` 形式，正确。控制草图 12/12 转换、几何 100%
    （`angle_bisector` 的 2 条 `t38` 未知、`triangle_angle_sum` 的 1 条 `t48` 表达式为既有限制，非本轮引入）。
  - 遗留边界：**t5/t6 的基对象是圆**（433 条，如 `PerpendicularLine(M, t)` 且 t 为圆）语义未定，
    当前原样输出（GeoGebra 可打开但该对象为 undefined）；**未凭猜测落地**。
  - **反向（`.ggb → .gsp`）陈旧映射修复**（`src/ir2gsp.js`，为 t34/t8/t58 语义修正后的遗留）：
    `Polygon` 原误映射为 `t62`（按钮！）→ 改 `t8`；`Distance` 原误映射为 `t58`（坐标轴！）→ 改 `t37`；
    `Foot` 原误映射为 `t34`（反射！）→ 改为跳过（GSP 无对应独立对象类型）；
    新增 `Reflect → t34`（含镜为**内联 `Line(a,b)`/`Segment(a,b)`** 时按端点查回既有线/段对象，
    新增 `lineByPair` 索引）与 `Angle → t41`。
    验证：`polygon_reflections` 生成的 `v4.ggb` 反解回 `.gsp` 后，**37 个对象（含 21 条反射）全部还原**，
    结构与原始 `polygon_reflections.gsp` 一致；本机自检 `fails.js` 通过。
  - 新增诊断工具：`tools/t34probe.js`（t34 镜线分类）、`tools/t34host.js`、`tools/parentprofile.js`
    （按类型统计父对象种类）、`tools/perpbases.js`、`tools/rawobjs.js`、`tools/objlist.js`、
    `tools/xmlexpr.js`（从 .ggb 打印 `<expression>`）。
- ✅ 语义映射第一轮（用 `m-ezekiel/GeometersSketchpad` 的**构造名明确的微型 .gsp** 作真值）：
  - `t8` = **多边形内部**（顶点父对象）→ `Polygon(...)`（原误判为未知）。
  - `t34` = **反射**（preimage + 镜线/镜段/镜点）→ `Reflect(...)`（**原误映射为 `foot`，几何错误**，已修正）。
  - `t41` / `t113` = **角度**（3 点，中间为顶点）→ `Angle(A,B,C)`；`t120` = 角度测量（取父值）。
  - `t64` = **圆**（圆心 + 圆上点/半径段），补齐点父对象分支。
  - `t17` = **固定偏移点**（父点 + 像素偏移 `(dx,dy)`，y 向下；语料中偏移量仅 1–3 mm，
    用作箭头/小三角顶点）→ `(parent)+(dx/50,-dy/50)`。此项解锁大量级联（段/多边形/变换）。
  - `t62` = **动作按钮**（恒有按钮记录 `2310`，标签如“隐藏/显示/回/擦除”）。
    `2310` 偏移 12 起是**类型码**（`u16`），偏移 20/22 是草图坐标 `(left,top)`：
    `0`=隐藏、`1`=显示、`2`=动画、`3`=移动、`4`=滚动、`7`=同时/切换组、`8`/`9`=未知。
    **已落地**：发成 GeoGebra `<element type="button">` + 点击脚本 `<ggbscript val=…>`，
    用 `<absoluteScreenLocation>` 定位、`<caption>`/`<labelMode val="3"/>` 保留中文标题；
    类型 `0`/`1` → `SetVisibleInView(目标,1,false/true)`，类型 `2` → `StartAnimation(目标,true)`。
    类型 `3`/`4`/`7`/`8`/`9` 无可靠等价（`SetCoords` 在 5.4 里执行会报「参数不符合规则」），**不猜、跳过**。
    偏移 14 的 `flag`（位域，疑与“切换/一次性”等动作选项有关）**尚未解释**，故隐藏/显示一律发单向动作。
    真值 `ref-ctrl/jsp-samples/运动方向(inRm)`（全项目唯一按钮真值）逐字段吻合：
    JSP `AnimateButton(20,90,'动画点')(4,3)` → `absoluteScreenLocation x=20 y=90` +
    `caption="动画点"` + `StartAnimation(C,true)`。
    **原代码曾把按钮当多边形输出，属错误构造**，已移除。
  - `t15` 在**线段**上：改为真正的路径点——但必须是 `Point(线段)`（**无参数**）＋显式 `<coords>`，
    因为 `AlgoPointOnPath` 对带参数的点 `isChangeable()` 恒 false，`StartAnimation` 会被拒
    （真机报「参数不符合规则: 点 C」）。坐标在转换期由 `gspPosXY` 解析端点算出；算不出时退回
    `Point(线段, φ)`（几何正确、不可动画）。直线/派生直线上仍用坐标式（GSP 的 φ 参照系未必是该直线自身定义点）。
  - `t15` 圆上点：GSP 存两种形式——**(cos,sin) 单位方向**（2 个参数，**y 向上**，与点坐标的
    y 向下相反）或**单参数**（动画状态/约束句柄，**不是可解码的位置**）。前者在圆心/半径可求解时
    发射 `Point(圆)` + 显式 `<coords>`，位置 = 圆心 + 半径·(px, **−py**)（对照本机 GSP 渲染
    `ref-ctrl/angle_bisector.gsp` 精确像素 + GeoGebra 渲染：G 的 py>0 位于圆心**上方**；此前
    漏了 y 取反，位置被上下镜像）；后者（或位置不可求解时）只发 `Point(圆)`，保留“圆上自由点”
    的约束与可动画性，初始位置交给 GeoGebra。单参数值在语料中与点实际渲染角度不符（如 E 存
    2.344061 却位于约 −0.14 rad），故**不猜**。
  - `t15` **变换后线段**上的点：仿射变换保持参数分数 φ，且经查 GeoGebra 手册，
    `Point(线段, φ)` 的参数在 `AB` 上恰为 φ（与 GSP 一致，而**直线**的参数被非线性重映射，
    不可直接用）→ 变换后线段路径输出 `Point(路径, t)`（新增 ~640 对象）。
  - 真值：`polygon_reflections`、`area_parallelogram`、`hexagon_by_rotations`、`angle_bisector`、
    `isoceles_triangle`、`arbitrary_triangle_interiors`、`perpendicular_bisector`、`triangle_angle_sum`
    转换后**全部 100% 映射**且在 GeoGebra 5.4 打开；XML 构造经核对无误。
- ✅ **语义映射第二轮（用 CFR 反编译 `jsp5.jar` 143 个类作真值）**：
  - `PointOnStraight.relativeLocation`：点在直线/线段/射线上的位置 = `(x1,y1)+φ·((x2,y2)-(x1,y1))`，
    φ 就是 GSP 存的那个参数。`straightRef()` 为每种直线宿主重建**参考点对**：
    - 线段/两点直线 → 两端点；
    - `Parallel`（平行线，点 P + 基方向 d）→ 参考对 `P∓d/2`，即 `P+(t-0.5)*(B-A)`；
    - `Perpendicular`（垂线）→ 参考对 `P∓perp(d)/2`；
    - `Bisector`（角平分线，顶点 B）→ 参考对 `B`、`B+c·((A-B)/|A-B|+(C-B)/|C-B|)`，`c=√9000/(2·SCALE)`；
    - 坐标轴 → 见下。
  - `PointOnPolygon.offset` = `边序号 + φ`（**按边**，非弧长）；GeoGebra 多边形路径参数 = `offset/n`
    （n=顶点数）→ 安全映射为 `Point(多边形, offset/n)`。
  - `PointOnCircle.angle`：`x = centerX + cos(angle)·r`（applet 内部角度；而 `.gsp` 的 2 参数方向
    存为 **y 向上**，与文件点坐标的 y 向下相反，见上「关键事实」#10）。
  - **`t58` = `Axis4`（坐标轴）**，不是距离测量；`rich[2309]` 的 u32 = 1(x轴)/0(y轴)，
    父 = [原点, 单位点]。水平参考对 `O±(4,0)`，竖直 `O+(0,4)…O+(0,12)`（GGB 单位）。
  - **`t59` = 坐标轴变体**（原点 + 以“测量/文本”定义的单位），同按轴处理。
  - `t52`/`t54`/`t55` = 坐标系单位点（JSP 真值：`UnitPoint`/`SquareUnitPoint`/`RectangularUnitPoint`）：
    `t52` 水平单位点 `getUnitScale()=pixelsFromOrigin`；**`t54` 的存储值不是尺度，恒继承父单位点（正方形网格）**；
    `t55` 才用自身存储值作竖直尺度（可非正方形网格）。
    它们的原点要递归取到真正的原点（已修 `unitPointOrigin`、新增 `unitScaleOf`）。
  - **`t61` = `gCoordSys`**（`CoordSysByAxes` 两轴 / `OriginUnitCoords` 两点 / `UnitCircleCoords` 圆）；
  - **`t67` = `PlotFixedXY`**（在坐标系中按固定 (x,y) 绘制的点）→ `原点 + (x·ux, -y·uy)`，已实现；
  - **`t49` = `CoordinatePair`**（点 + 坐标系）→ 动态文本 `"(x, y)"`，已实现；
  - `t109`/`t110`：父为 [文本, 坐标系]，另存一个坐标值（如 -5,-3,-2,-1），判定为**坐标轴刻度/标签**
    （渲染辅助，非构造对象）→ 不映射。
  - **反射镜线为“仿射变换后的直线/线段”**（`t34` 的镜是 `t27/t16/t30/t34` 的像，约 2.3k）：
    对变换后的直线直接引用其标签；对变换后的线段，按变换链重建两端点再取支撑直线 `Line(...)` → 已实现。
  - **旋转角单位修正**：`t27` 的 `params = (sin, cos, 角度, 0)`，其中“角度”有时以**弧度**有时以**度**存储
    （取决于作图时的角度单位），直接用会把 90° 输出成 1.5708°。现改为由 `(sin,cos)` 反推：
    `deg = atan2(-sin, cos)·180/π`（GSP y 向下 → GeoGebra y 向上需翻转符号），与所有已核对的
    控制草图（正方形/正六边形旋转）完全一致。
- ⚠️ 全语料语义保留率 **29.13%（116,578/400,149）**（旧口径：`node tools\emitstats.js "D:\Sketchpad5"`；
  2311 落地后 **25.88% → 29.13%，+13,013 对象**）。其中 t0 自由数 **30089/30117**、
  t48 计算 10604/49296（其余 t48 多因父对象未解码而级联）。
  **本机 2026-10-01 复测（含 Samples/Tool Folder 的 1478 全树）**：
  初测 `emitted=121260 rate=29.79%`；**`t29/t33` marker 接入 2311 解码值后 `emitted=124349 rate=30.55%`**
  （+3,089）；**再落 `t47` 比值测量（含三点比）后 `emitted=127886 rate=31.41%`**（再 +3,537）；**修复坐标架单位点语义（`t54/t55`）后 `emitted=128254 rate=31.50%`**（+368）；
  **落地 `t62` 动作按钮（隐藏/显示/动画三类）后 `emitted=131194 rate=32.23%`**（+2,940）；
  **随后修正动画根因（`Point(线段,φ)` → `Point(线段)`+`<coords>`；见上「关键事实」#10）后为
  `emitted=130827 rate=32.14%`**——减少的 367 个都是**目标根本不可动画**（圆/函数路径上的点、GSP 参数）
  的动画按钮：它们在旧输出里点了必弹「参数不符合规则」，如今如实跳过。
  **再落「圆上点 → `Point(圆)`」后 `emitted=132061 rate=32.44%`**（+1,234）：圆上点从“自由坐标式”
  改为真正的圆上自由点，`animate button without animatable target` 1,742 → 1,616（**多恢复 126 个
  动画按钮**），`point on unsupported path` 5,208 → 4,643（−565）。
  **2026-10-02 修正圆上点方向的 y 轴符号**（`center + r·(px, −py)`；`emitted` 不变，纯位置修正；
  `smoke` 新增“在圆上且位于正确一侧”断言，GeoGebra 渲染与 GSP 渲染核对一致）。
  `exprcov` 解码 57370/57607=99.6%。
  **2026-10-02 落地 `t21`＝极坐标平移（并修复科学计数法被 GeoGebra 误读）后：
  `emitted=185308 rate=46.31%`（127,076→185,308，+58,232；`t21` 发射 0→10,730，级联解锁大量依赖对象）。**
  **2026-10-02 续：修复 `tag 2311` 解码器「常量 `pi`/`e` 之后的角度单位标记未被消费」的 bug
  （`expr.js` 的 `parsePrimary` 现对常量也调用 `applyUnits`），并给 `t33`/`t29` 的 marker 增加
  「结构化测量回退」+「中心必须是点」护栏：`emitted=187125 rate=46.76%`
  （185,308→187,125，+1,817；`t29` 发射 1,054→2,512，+1,458，主因是 `2*pi<ang>0/{n}` 这类角度程序
  此前因 `pi` 后的 `<ang>0` 未消费而报 `parse: trailing tokens` 被整类跳过。护栏同时消除了约 1,164 个
  「中心非点」的错误 `Dilate` 输出）。**
  **2026-10-02 续：定性 `t94`＝「点在宿主路径上的相对位置」，发 `PathParameter(p0)`（同宿主·线段/多边形）；
  定性 `t35`＝轨迹，发 `Locus(被跟踪点, 驱动点)`；补 `t62` 的「移动」(kind 3，`SetCoords`) 与
  「同时」(kind 7)；修圆父序（第六轮）；批量落地 `2307` 测量族（第七轮，`t69`=`PlotXY`、`t65/t66`=
  横/纵坐标、`t38/39/40/42/46/86`）；弧对象与弧测量（第八轮，`t79/80/81`=`Arc`、`t43/44`）：
  `emitted=211364 rate=52.82%`（187,125→211,364，+24,239）。**
  剩余瓶颈（按“根因杠杆”排序）：① 迭代/列表/自定义工具族的级联
  `t77/89/88/90/24/75/32` ② `point on unsupported path`（4,525）③ `t62` 只剩目标被上游跳过/数字目标（4,421+1,432+2,254+1,218）
- 📋 **全部 `tXX` 对象类型速查表（按类型号，含未映射项与编号跳空）见 [`TYPE_TABLE.md`](TYPE_TABLE.md)。**
- ⏳ 真实未知类型（按新增真值更新）：
  - **`t29`（本机 4,720 条）= `MeasuredAngleRotation`（JSP `Rotation/MeasuredAngle`）**：arity=3，
    父 `[preimage, center, 角度测量]`。**已落地**：marker 为三点角（`t41`/`t113`/`t120`，可被 `t48`
    包裹）时发 `Rotate(pre,Angle(A,B,C),center)`；否则回退到 **marker 自身 `tag 2311` 解码值**
    （`decodedExpr`），作为**弧度**直接发 `Rotate(pre,<值>,center)`。依据：反编译
    `Rotater.PrepareRotation` 用 `Math.cos/sin(measure.value)`，GSP 角度即弧度；GeoGebra 同为内部弧度
    （见上「记号约定」），故单位/符号一致。**2026-10-02：修复 `pi`/`e` 后角度单位标记未消费的解析 bug，
    `t29` 发射 1,054→2,512（剩余直接跳过仅 369）。** 仍无 2311 或依赖被跳过者保持跳过。
  - **`t33`（本机 12,177 条）= `DilationMR`（JSP `Dilation/MarkedRatio`）**：arity=3，
    父 `[preimage, center, 比例测量]`。**已落地**：marker 为 `t47`（两点段比 / 三点比，可被 `t48` 包裹）
    时直接引用该 `t47` numeric；否则依次回退 **marker 自身 `tag 2311` 解码值**、再回退到
    **结构化测量 plan**（`t36` Length / `t37` Distance / `t41` Angle / `t65/t66` 等 `NUM_KINDS`，
    复用 `planOf`，不猜语义），作为缩放比 `Dilate(pre,<值>,center)`。
    **新增护栏：`center` 必须是点（`isPointish`），否则跳过**——二进制 `t33` 中存在结构上的“同名异类”
    （例如 `example-07 #68 par=[O,Calc,circle]`，无法归约为 `[pre,center,ratio]`），此前会被误发为
    `Dilate(pre,ratio,<非点>)`；现统一跳过（本机 2,652 条，其中约 1,164 条原为错误输出）。
    `t47` 三点比（measureType 11）**已落地**（见上）。
  - **`t21`（13,589 条）**~~＝「带全局/标记中心的定角旋转像」~~ **✅ 2026-10-02 已破案：＝极坐标平移
    `PolarTranslation`，不是旋转！**（推翻旧结论；详见下「t21＝极坐标平移（已破案）」）。
    旧推断「绕标记中心旋转」已被真值否定：`mark_center_rotate_fixed.gsp`（标记 O 为中心后旋转 P）
    产出的是 **t27** 而非 t21。JSP `PolarTranslation`（`readObjectSpecifier(1,2,0)`＝1 父+2 double，
    `Sketch.java` L1136）与 t21 的 arity 吻合。**✅ 2026-10-02 已落地**（实现与验证见下「t21＝极坐标平移」及「下一步 2」）。
  - `t34` 直接跳过仅 **730** 条「reflection mirror unsupported」（其余为级联），见下一步 0。
  - 其余：`t73/t32/t35/t75/t77/t89/t90/t95/t101/t80/t79/t81`——**GSP5 的迭代/列表/自定义工具/轨迹族**
    （2026-10-02 分类；JSP 会把这些内联展开，无 JSP 真值可对表，且 GSP 主程序是原生二进制、无 reader 可查，
    故**按规则跳过而非猜测**）：
    - **`t35`（3,114）= 轨迹（Locus）——✅ 2026-10-02 已落地**。反编译 `Sampler/gPointLocus`：构造器为
      `(movePoint, movePath, traceGObj)`，`toString`＝“Locus of trace as move moves”，二进制父序为**其逆序**
      `[被跟踪点, 驱动路径, 驱动点, …依赖闭包…, 被跟踪点]`（首尾同一、即轨迹点）。全语料验证：`parents[2]`
      是 `pointOnPath` 且其宿主 == `parents[1]`、且 `parents[0]` 传递依赖 `parents[2]` 者 **2,516/3,114**。
      据此发 `Locus(parents[0], parents[2])`（GeoGebra `Locus(Q,P)`：Q 为轨迹点、P 为路径上的驱动点，
      手册确认 P 必须是对象上的点）。仅当被跟踪点是点、驱动点确在其路径上、无嵌套 `t35`（轨迹的轨迹）、
      且被跟踪点确依赖驱动点时发射；本机发射 336（真机 GeoGebra 5.4 打开 `两个点都动的轨迹` OK）。
      **未落地**：被跟踪对象是直线（`gStraightLocus`）、嵌套轨迹、驱动点为自由点/未知类型者。
    - **`t77`（6,970）** 恒为父 `[X, t89]`、标签多为 `[1]`/`[2]`；`t89`（带 `tag 2314`）是迭代/列表的
      “步进/映射”数据，`t77` 是其中一步。**`t88`**（1 父 = `t77`）是迭代产出的点（如 `杨辉三角形` 的
      `J/O/R/…/A[1]`，再由 `t66 deltaY` 读其 y）。
    - **`t32`（3,571）**：5 父、首两父常为 `t32`（递归）→ 自定义工具/迭代实例。
    - **`t24`（4,385）** ✅ 2026-10-03 已定性并落地 = `FixedAngleMarkedDistance`（定角+标记距离平移，
      父 `[原像, 距离值]`）；真值与实现见「当前状态」第九轮。
    - **`t75`（3,681）**：2–4 父 + params，首父常为 `t75`（递归）→ 迭代/采样步。
    - **`t90`（3,929）／`t73`（2,031）＝富文本/标注**：均恒带 `tag 2300`。渲染真值（`坐标随点.gsp`）
      证实 `t90` 是粉色标注文本（“拖点A。”）。**但** `decodeGspText` 对它们有**前导数字伪影**（如
      “2A(2.24,2.10)”），且内容常与 `t49` 坐标对**重复** → 暂不映射（避免重复/错字）。
      `t73` 父数 1–8 不等，解码多为界面词（“绘图”“清除”“1024*768”）。
    - **`t95`（1,941）**：**点**（2 父、无 rich；标签 `N`/`M`/`E`…，被 `segment`/`polygon`/`locus` 当端点），
      但父形态高度异质（`[t94,t48]`/`[t2,t27]`/`[t94,t2]`…），语义未定，暂不映射。
  - **`t94`（3,771 条）= `PointOnObject` 的「点在宿主路径上的相对位置」**。父 `[点, 路径]`，
    由父 `2307` 记录 + 点的 `PointOnStraight/PointOnCircle/PointOnPolygon` 语义确定。**2026-10-02 已落地**：
    当 `p0` 是 `pointOnPath` **且 `p0.parents[0] == p1`（同一宿主）**且宿主为线段/多边形（含仿射像）时，
    发 `PathParameter(p0)`（GeoGebra 手册：线段 AB 的参数 = `φ(X,A,B)` ∈ [0,1]，与 GSP
    `PointOnStraight.Constrain` 的 `(x1,y1)+φ·((x2,y2)-(x1,y1))` 一致；JSP 样本写作
    `Point on object(3, 0.174345)`，其 φ 与点对象里 2003 参数逐位相符）。本机发射 810、连带解锁
    2,295（覆盖率 46.76%→47.34%）。**未映射**：宿主为直线（我们发的是坐标表达式，非路径点）或圆的点
    （`PointOnCircle` 存的是角度，与 GeoGebra `PathParameter` 的 (α+π)/2π 参照系未验证），以及
    `p1 ≠ p0.parents[0]`（把点投影到**另一条**线段上，GSP 投到直线、GeoGebra 会夹到线段，未验证）。
    旧猜测「t94=点到直线距离（measureType 3）」**已被推翻**（父序 `[点,线]` 与 mT3 的 `[线,点]`
    不符；且 `棋盘` 用例中 t94 作 `4t+2` 取整要求 t∈[0,1]）。
    `t47` 比值测量（父 2 线段 = 比值/段，或 3 点 = 比值/点）**已全量映射为 numeric**（见「当前状态」）。
- ✅ **变换族真值（CFR 反编译 `jsp5.jar` + 用户手作控制草图确认）**：
  - Transformer 家族：Rotater{Rotation, MarkedAngleRotation, MeasuredAngleRotation}；
    Translator{Translation, VectorTranslation, MarkedAngleMarkedDistance, FixedAngleMarkedDistance}；
    Reflector{Reflection}；Dilater{Dilation, DilationMR, Dilation2S, Dilation3R}。
  - **类型号↔类↔JSP↔父数（真值表，已落地）**：
    `t16`=VectorTranslation（pre+2点）；`t27`=Rotation（pre+center，params `(-sinθ,cosθ,θ,0)`）；
    `t28`=MarkedAngleRotation（pre+center+A+B+C）；`t29`=MeasuredAngleRotation（pre+center+角测量）；
    `t30`=Dilation（pre+center，params `[ratio]`）；`t31`=Dilation2S（pre+center+numSeg+denomSeg）；
    `t33`=DilationMR（pre+center+比例测量）；`t34`=Reflection（pre+镜）。
  - 记号约定等价性：GSP 旋转按 `x'=x·cosA+y·sinA+cx, y'=-x·sinA+y·cosA+cy`（y 下）。经
    `ggb=(-gsp_y)` 翻转后，等价于 GeoGebra 的**逆时针转 `+A`**；而 GeoGebra 的
    `Angle(A,B,C)`（由 BA 到 BC 的逆时针角）正好等于该 `A`（模 2π），故 `t28` 可直接用
    `Rotate(pre,Angle(A,B,C),center)`。`t31` 比值 `|s1|/|s2|` 与坐标缩放无关，直接可用。
  - 父数量↔类型启发式（用于新辨型）：1 父+params→`t21`；2 父(preimage+center)+params→`t27`/`t30`；
    2 父(preimage+镜)→`t34`；3 父(preimage+2点)→`t16`；3 父(preimage+center+marker)→`t29`/`t33`；
    4 父(pre+center+2线段)→`t31`；5 父(pre+center+3点)→`t28`。
  - 参考草图：`ref-ctrl/hexagon_by_rotations.gsp`、`square_by_rotations.gsp`、`grid_by_translation.gsp`、
    `polygon_reflections.gsp`、`square_dilation.gsp`（旧）＋ `ref-ctrl/jsp-samples/mark_*.gsp+.htm`（本轮 6 对，
    含 `mark_angle_rotate`→t28、`mark_ratio_dilate`→t31、`mark_center_rotate_fixed`→t27、
    `mark_vector_translate`→t16；`measure_angle_rotate` 复现为 t28 而非 t29，
    因 GSP 把"度量角"在旋转时改写为标记角——故 `t29` 仍以结构＋反编译定性）。
- ✅ **`t21`＝极坐标平移（2026-10-02 破案，渲染真值确认）**。tag 2003（60 B）布局：
  `+0` u32 类型 21；`+4` double **p0=−sinθ**；`+12` double **p1=cosθ**；`+20` double θ（度**或**弧度，
  仅展示用、**不可靠**——`logtable.gsp` 存 1.570796 而实际是 90°，θ 一律取 `atan2(−p0,p1)`）；
  `+28` u32 =1；`+32` double **d1＝平移距离（文件坐标单位）**；`+40` double d2＝同一距离的厘米数
  （d1≈d2×37.7953 但**不严格相等**，如 `橡皮筋` E：112.07 vs 3×37.7953=113.39，**一律用 d1**）；
  `+48` u32 =1；`+52/+56` 尾部（杂项/可能内嵌字符串，如 `角的演示` 出现 UTF-16 `ator`，未解释）。
  **语义：`image = parent + d1·(cosθ, −sinθ)`（文件 y 向下）**。**关键：`d1` 是「文件坐标/像素」单位的
  距离，与点坐标同单位**，故必须按**同一比例**折算，不能当 GeoGebra 单位直接用（否则差 ~SCALE 倍）：
  无 frame 时 `ggb = (d1·cosθ, +d1·sinθ)/SCALE`；有 frame（单一坐标系+函数）时用
  `frame.disp(d1·cosθ, −d1·sinθ)`（frame 逆矩阵）。最终发 `Translate(<pre>, Vector((vx,vy)))`。
  - 证据（揭隐 + 截图 + 像素聚类）：① `不显示方法之至尊.gsp`：A=(158,151)，A'=t21(A) θ=90°、d1=37.7953，
    实测 A'−A≈(0,−37.8) 文件坐标 ✓；② `橡皮筋.gsp`：C=t21(B) θ=0°、d1=302，实测 B→C≈(+300.8,0)·视图比 ✓
    （方向 (cos0,−sin0)=(+1,0)）；③ 同文件 E=t21(B) θ=90°、d1=112.07，实测 B→E≈(0,−113.6)·视图比 ✓。
  - 旁证：`mark_center_rotate_fixed.gsp`（标记中心→旋转 90°）产出 **t27** 而非 t21 → 旧「标记中心旋转」
    假设被否定；`橡皮筋` 各 t21 的 d1/d2≈37.795（像素/厘米）。
  - **附带发现：tag 2000 头 `u16@+2 == 4` ＝ 隐藏位**（清零即可揭隐，已用
    `不显示方法之至尊.gsp` 验证：#1/#2/#3 显示）。临时工具：`%TEMP%\unhide.js`（揭隐副本）、
    `shotgsp2.ps1`（置顶截图）、`dots.ps1`（红/黑点像素聚类）。
  - **✅ 已落地（2026-10-02）**：`ggb.js` `case 'implicitRotate'` → `Translate(<pre>, Vector((vx,vy)))`
    （d1 取 tag 2003 `+32`；θ 取 `atan2(−p0,p1)`；沿用 `elemTypeOf`；位移经 `frame.disp` 或 `/SCALE`
    折算，见上修正）。`t21` 发射 **0 → 10,730**，级联解锁依赖对象后全语料 **emitted 127,076 →
    185,308（rate 31.76% → 46.31%）**；余下 2,820 全部是「依赖被跳过对象」级联（无解码失败）。
  - **附带修复（重要）：数字格式化禁用科学计数法**。GeoGebra 把 `4.6e-17` 解析成 `4.6×e−17`
    （`e`＝欧拉数），使 `cos90°≈6e-17` 这类近零分量被算成 −4.42，`A'` 因此整个错位。
    `fmt()` 现改为：`|v|<1e-12` 归零，其余把任何指数形式展开为纯小数（`smoke` 新增两条回归断言）。
  - **验证**：`smoke` 39 项全过；真机 GeoGebra 5.4 打开 `out/t21_hidden.ggb` 显示 `A'=(3.16,−2.26)`
    （＝A 上移 1cm，与 GSP 真值一致）；全语料 732 文件 / 10,730 个 t21 按向量多重集核对 **0 处不一致**
    （frame 与非 frame 路径均覆盖）。
- ✅ **`tag 2311` 表达式＝已解码（2026-09-27 本轮突破）。** 结论修正：2311 的**尾部 token 程序**
  就是表达式本体，且是 **in-order（中序）+ 显式括号** 编码；JavaSketchpad 导出的同一表达式是
  **postfix（RPN）**编码——两者是同一棵表达式树的不同序列化（`5个数求最大值`、`x^2-3x-2` 等已核对）。
  - **程序边界**：payload 内定位 `07 09 00 00` 标记，其后 u32 len、常量 `30 00 00 00`，
    **i+12 处 u16 = COUNT**；程序 = payload **末尾 `COUNT*2` 字节**（len = 60 + COUNT*2）。
  - **token 字母表**（LE u16，高字节为类）：`0x00` 字面字符（`0-9`、`0x0a`=`.`、`0x0b`=`(`、
    `0x0c`=`)`、`0x0d`=π、`0x0e`=e、`0x0f`=x）；`0x01`/`0x02` 作用于**紧邻数字的单位标签**；
    `0x10` 二元运算 `+ - * / ^`；`0x20` 预定义函数（**函数后隐含 `(`**，遇显式 `)` 收口）；
    `0x60` 父引用（payload=0 基父序号）；`0x70` 父作为函数引用。
  - **预定义函数表**（`0x20` payload，由语料字幕/行为判定，13 个全覆盖）：
    `0 sin,1 cos,2 tan,3 asin,4 acos,5 atan,6 abs,7 sqrt,8 ln,9 log10,10 sgn,11 round,12 trunc`
    （F3=arcsin 由 `物理课件集` 正弦定理；F5=arctan 仅见地图投影；F8=ln 由 `example-53` 的
    `1.7^x·ln1.7` 导数；F9=log10 由 `对数函数` 的 `log(x)/log(2)`；F12=trunc 由“边数/列数”
    计数与 `A-trunc(A)` 分数部分；F6=abs 由 `(A+B+|A-B|)/2`=max）。
  - **单位标签**：`0x0100`=弧度（×1）、`0x0101`/`0x0102`=度/有向度（×π/180）、`0x0201`=距离单位
    （值不变）。GSP 三角函数按**草图的角单位**；用三角的草图实测为**弧度**
    （`演奏原理` `sin(264·2π·x)`、`正弦型函数` `sin(2x+π/3)`），故度标签须 ×π/180；GeoGebra
    三角固定用弧度、内部全按弧度算（手册：“The degree symbol is nothing but π/180”），可直接映射。
  - **落地**：`src/expr.js`（`findProgram`/`tokenize`/`parse`/`decodeExpr`/`PREDEF`），
    `trunc→sgn(x)*floor(abs(x))`（GeoGebra 无 trunc）。`src/ggb.js` 接入：t48 计算→`numeric`、
    t0 自由数**取值**→`numeric`、t0/t71/t78 含 x→`function`、t72 绘图→跳过。
  - **解码率 99.6%**（`node tools\exprcov.js "D:\Sketchpad5"`：2311 对象 57112，解码 56875；
    仅剩未知算子 `0x1005` 27、无程序 6、解析边界 231）。
  - 旧“句柄化对象图/记号图未解码”的判断作废：那正是**末尾 token 程序**（=`fc080000 16000000
    04000000` 头 + 元数据 + token 程序），配对的 `.htm` postfix 串可直接映射，无需桌面版规范。
- ✅ **可解码的例外：FixedText（类型 0 + `tag 2300`）。** 其消息以**明文 UTF-8 + 轻量标记**
  内联存放：`<T23x…>`＝文本段（`…` 到下一个 `>` 为显示内容），`<VL`/`<H`/`<SR…>`＝容器。
  `src/gsp.js` 的 `decodeGspText()` 已实现剥离；与配对导出逐字一致（如“上式系由下式化简而得：”）。
  2550 个文件中的 9641 条 `2300` 分布：t0×3525（FixedText，已映射为 GeoGebra `Text`）、
  t90×3929 / t73×2031（含测量引用/按钮标题，动态，暂不映射）、t49/t50/t51 少量。
- 🔑 **JavaSketchpad 文本 = 可行真值来源（读取能力已具备，配对已验证）。** 几何画板“另存为 →
  文件类型 JavaSketchpad（*.htm）”会把整条构造导出成 `Construction` 参数里的**明文**
  （jsp5.jar 的 `Sketch.parseConstruction` 语法），其中函数/计算的**表达式、文本字面、度量元数据
  都是明文**。已实现读取器 `src/jsp.js`（`extractConstruction` / `parseConstruction`，完整复刻
  参考语法）与 CLI `tools/jspextract.js`（`--json` 可导出对象数组）。样例：`ref-ctrl/jar/testfile.html`。
  **配对规律（本轮确认）**：`.gsp` 与导出 `.htm` 的对象顺序**都是构造顺序**，JavaSketchpad 只
  **丢弃**它渲染不了的对象（度量/按钮等），因此两列可逐元素对齐（`5个数求最大值`、`周期函数的图象`
  已验证 1:1）。导出需**注册版**几何画板（预览版禁用保存/导出）；出样例：`ref-ctrl/jsp-samples/`。

## 文件清单
| 文件 | 作用 |
|---|---|
| `bin/cli.js` | CLI 入口 |
| `bin/tui.js` | 交互式终端界面（纯 Node + ANSI；非 TTY 时逐行菜单） |
| `src/convert.js` | CLI/TUI 共用转换入口（`convertBuffer`） |
| `src/tui-util.js` | TUI 辅助（目录浏览、批量任务规划、CJK 宽度/截断） |
| `src/zip.js` | `.ggb` 容器 ZIP 读写 |
| `src/gsp.js` | `.gsp` 读取 → IR（含 parseRecords、TYPES） |
| `src/jsp.js` | JavaSketchpad 文本读取（`extractConstruction` / `parseConstruction`） |
| `src/expr.js` | `tag 2311` 表达式解码（`findProgram`/`tokenize`/`parse`/`decodeExpr`/`PREDEF`） |
| `src/ggb.js` | `irToGgb` / `ggbToIR`、SCALE、header() |
| `src/ir2gsp.js` | IR → `.gsp`（模板克隆 + 父引用重映射 + 规范顺序） |
| `src/gsp-template.json` | 215 个真实对象块骨架，覆盖 ~120 类型 |
| `tools/*` | 诊断/验证工具，见 `Tech_Details.md`（含 `corpus.js`、`emitstats.js`、`cascade.js`、`jspextract.js`） |
| `tools/package.ps1` | 打干净的交接 zip（剔除 `out/`、`test/out/` 生成物） |
| `tools/shotgsp.ps1` / `tools/shotggb.ps1` | 截取几何画板 / GeoGebra 窗口（自动探测可执行文件，可 `-Exe` 覆盖） |
| `test/smoke.js` | **自包含自检**（仅用内置 `t.gsp`，无需语料）：`node test/smoke.js` → `SMOKE PASSED` |
| `test/typeprobe.js` | 按类型+父位置统计 `_parents`/params/rich（辨型用） |
| `test/reasons.js` | 按类型统计 skip 原因 |
| `test/fixedtext-check.js` / `test/ftbad.js` / `test/ab.js` | FixedText(type0+2300) 分类 / 异常 / A-B 回退对比 |
| `test/objdump.js` / `hex2311.js` / `scan2300.js` / `text2300.js` / `showtext.js` | 对象/记录/2300 转储 |
| `ref-ctrl/` | **真值样本集**：12 个控制草图 + `jsp-samples/`（`.gsp`+`.htm` 配对）+ `jar/`、`decomp/`（CFR 反编译） |
| `reference/` | 已知可用 `.ggb`/XML 参照样本（`header()` 格式来源） |
| `t.gsp` | 本轮修复的测试草图（函数图 + 自定义坐标系） |
| `README.md` / `README_EN.md` | **面向用户**的使用说明（安装、命令、TUI、常见问题） |
| `Tech_Details.md` | **技术细节**（架构、容器格式、类型语义、验证、已知限制、工具清单） |
| `TYPE_TABLE.md` | 全部 `tXX` 类型速查表 |
| `SETUP.md` | **交接与部署说明**：环境要求、上手、`GSP_DIR` 等路径变量、打包、验收基线 |
| `package.json` / `.gitignore` | npm 脚本（`convert`/`selftest`/`stats`）与忽略规则；无第三方依赖 |

## 依赖环境（本机实际路径）
- Node.js ≥ 18（本机 v24.13.1；另一台为 v24.21）。**核心转换无第三方依赖，无需 `npm install`。**
- 机器相关位置通过**环境变量**读取（未设置则回退到本机默认值）：
  `GSP_DIR`（语料根，默认 `D:\Sketchpad5`）、`GSP_SAMPLES`、`GSP_TOOLS`、
  `GSP_EXE`（几何画板）、`GGB_EXE`（GeoGebra）。详见 `SETUP.md`。
- **GeoGebra Classic 5.4**：另一台在 `D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe`；
  **本机在 `C:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe`**
  （`tools\ggbcheck.ps1` 已自动探测 C/D 盘常见路径，也可 `-Exe` 指定）。
- **几何画板 5.06** + 语料：另一台为 `D:\Sketchpad5`（1430 个 `.gsp`）；
  **本机为 `D:\Program Files (x86)\Sketchpad5`（1478 个 `.gsp`，含 `Samples/`、`Tool Folder/`）**。
  本机未设置 `GSP_DIR`，跑诊断前需先设（见 `SETUP.md` 第 4 节）。
- 截图/进程控制仅用 PowerShell。

## 移交到其他电脑
1. 复制本目录（或 `tools/package.ps1` 生成的 zip）。
2. 设 `GSP_DIR`（和可选 `GSP_EXE` / `GGB_EXE`）。
3. `node test/smoke.js` 应输出 `SMOKE PASSED`；`node bin/cli.js t.gsp -o t.ggb` 应成功。

## 验证方法
- **自检（无需语料）**：`node test\smoke.js` → `SMOKE PASSED`。
- `.ggb` 是否可开：`powershell -File tools\ggbcheck.ps1 -File <x.ggb> -WaitSec 25`
  （窗口标题含文件名=成功；仅 "GeoGebra Classic 5"=失败；大文件（>500KB）需 ≥45 秒，否则会误判）。
- `.gsp` 是否可开：`powershell -File tools\shot.ps1 -Proc "D:\Program Files (x86)\Sketchpad5\GSP5chs.exe" -File <x.gsp> -Out <png> -WaitSec 9`。
- 解析成功率：`node tools\fails.js "D:\Program Files (x86)\Sketchpad5"`。
- 批量转换 + 保留率：`node tools\corpus.js "<语料根>" --outdir "<输出>" --json report.json`。
- 按类型 emit/skip 统计：`node tools\emitstats.js "<语料根>"`。
- 根因级联杠杆：`node tools\cascade.js "<语料根>"`。
- 域诊断：`node tools\walkfix.js <file.gsp>`（1300 / 9009 填充与错位定位）。

## 建议的下一步（本次会话结论，按优先级）
0. ~~**先做低风险高收益：`t34` 的 730 条直接跳过**。~~ **✅ 已完成（2026-09-27）**：
   圆镜反演 + `straightRef` 的 `perpLine/parallelLine` 父顺序修复，使 t34 直接跳过 795 → 97
   （余下 97 条是 text/button/未知类型 t21/t29/t33/t47/t77… 作镜，须先解 t21/t29/t33 或 2311）。
1. ~~**决定 `t21/t29/t33` 语义**~~ **✅ 本轮已定性（见上「变换族真值」）**：
   - 用户 6 对 `mark_*.gsp+.htm` 真值 + CFR 反编译确认：`t28`=标记角旋转、`t31`=线段比位似
     （**均已落地**）；`t29`=MeasuredAngleRotation、`t33`=DilationMR（**已 best-effort 落地**，marker 可解时）；
     `t21` ~~无中心、无 JSP 语法 → 不可恢复~~ **→ 2026-10-02 推翻：t21＝极坐标平移 `PolarTranslation`，
     已破案（见下），**✅ 2026-10-02 已落地**。
   - `t29`/`t33` 的 marker 已改由 marker 自身 `tag 2311` 解码取得（2026-10-01）；`t21` 中心在桌面版内部注册表。
2. **剩余高杠杆（按投入产出）**：
   - ~~**表达式记号图解码（`tag 2311`）**~~ **✅ 已完成**：`src/expr.js`（中序 token 程序），
     解码率 99.6%，已解锁 t0 自由数取值 / t48 计算 / t71 函数 / t78 导数（见上「tag 2311＝已解码」）。
     仅剩 `0x1005` 算子 27 条 + 解析边界（trailing 150 / missing `)` 54）+ 无程序 6（`tools/exprcov.js`）。
   - **级联根因**：t21 落地后 `t2` 线段 skip 30,228→**20,828**（−9,400），`t16` skip 14,009、`t15` 6,545、`t27` 5,585 等同降；余下仍多为上游未知对象级联。
   - ~~**`t29`/`t33` marker 解码**~~ **✅ 已完成（2026-10-01）**：marker 回退 `decodedExpr`，
     t33 直接发射 4→554、t29 32→548，总率 29.79%→30.55%（见「当前状态」）。
   - ~~**`t47` 三点比**（measureType 11）~~ **✅ 已完成（2026-10-01）**：`t47` 全量映射为 numeric，
     三点比 `|AC|/|AB|`（角>90° 取负，用点积符号判定），`t33` 改为引用该 numeric；
     `t47` 发射 0→540、总率 30.55%→31.41%（见「当前状态」）。
   - ~~**`t21` ＝ 极坐标平移（已破案，落地待做）**~~ **✅ 已完成（2026-10-02）**：~~「中心或许可救：tag 900 / tag 1000 全局标记槽」~~
     该方向**作废**（t21 根本没有中心）。真值与字节布局见下「t21＝极坐标平移（已破案）」。
     **→ 2026-10-02 已完成**：`t21` 发射 0→10,730，全语料 emitted 127,076→185,308（rate 31.76%→46.31%）；
     验证见下「t21＝极坐标平移（已破案）」（真机 GeoGebra 打开 + 全语料向量多重集核对 0 差异，`smoke` 回归断言）。
3. ~~**镜像为变换后直线的反射**（`t34` 镜线是 `t27`/变换段，约 2k）~~ **✅ 已实现且本轮修好父顺序**
   （`straightRef` 递归重建支撑直线；`mt==='segment'/'line'` 均覆盖）。
4. **自定义工具/迭代**（`t35/t89/t77/t32/t28`，约 2 万）：需重建工具原型，工作量大。
5. 补映射类型 + GSP 输出视图自动适配。
6. **收尾前更新本文档**：记录 `t21/t29/t33` 的最终结论与覆盖率变化。
