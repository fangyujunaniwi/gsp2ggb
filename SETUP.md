# 交接与部署说明（SETUP）

本文件说明如何把 `gsp-conv` 搬到**另一台电脑**并跑起来，以及包内包含什么、机器相关路径怎么配。

---

## 1. 这是什么

`.gsp`（几何画板 / The Geometer's Sketchpad）⇄ `.ggb`（GeoGebra）**双向转换器**。
尽量保留**动态构造关系**（输出构造命令，而不只是坐标），主方向为 `.gsp → .ggb`。

---

## 2. 环境要求

- **Windows**（截图/进程控制用 PowerShell；**转换本身可在任意平台**运行）。
- **Node.js ≥ 16**（开发机为 v24.21.0）。
- **无第三方依赖**，**不需要 `npm install`**。
- 可选、仅用于人工核对：GeoGebra Classic 5.4、几何画板 5.06。**转换过程不需要它们**。

---

## 3. 三步上手

```powershell
# 1) 单文件转换
node bin/cli.js 输入.gsp -o 输出.ggb

# 2) 整目录批量转换
node bin/cli.js <文件夹> --outdir <输出文件夹>

# 3) 自检（不需要语料，用内置 t.gsp）
node test/smoke.js
```

若按 npm 包使用：`npm run convert -- 输入.gsp -o 输出.ggb`、`npm run selftest`、`npm run stats`。

CLI 参数：`-o/--out`、`--outdir`、`--to ggb|gsp`（强制方向）、`-q/--quiet`、`--json`、`-h`。

`node test/smoke.js` 期望输出 `SMOKE PASSED`：它验证 `t.gsp` 的
`C=(0,0)`、`B=C+(1,0)`、`O=C+(0,1)`、函数 `f=√3`、线段/斜率、以及 `ggb→gsp→ggb` 往返。

---

## 4. 机器相关路径（重要）

核心转换（`bin/`、`src/`）**不含任何绝对路径**，直接复制即可用。
只有**诊断脚本**与**截图脚本**需要知道语料/软件位置，按以下**环境变量**读取；未设置时回退到开发机默认值，因此行为向后兼容。

| 变量 | 含义 | 回退默认 |
|---|---|---|
| `GSP_DIR` | `.gsp` 语料根目录 | `D:\Sketchpad5` |
| `GSP_SAMPLES` | 样例子目录 | `D:\Sketchpad5\Samples` |
| `GSP_TOOLS` | 自定义工具目录 | `D:\Sketchpad5\Tool Folder` |
| `GSP_EXE` | 几何画板可执行文件 | 自动探测常见安装路径 |
| `GGB_EXE` | GeoGebra 可执行文件 | 自动探测常见安装路径 |

设置示例（PowerShell，仅当前会话有效）：

```powershell
$env:GSP_DIR = 'E:\Sketchpad5'
$env:GGB_EXE = 'C:\Program Files\GeoGebra 5.4\GeoGebra.exe'
```

补充：
- 多数 `tools\*.js` 的**第一个参数可直接传语料路径**，例如 `node tools\emitstats.js <目录>`。
- `tools\ggbcheck.ps1 -Exe <路径>`、`tools\shotggb.ps1 -Exe <路径>`、`tools\shotgsp.ps1 -Exe <路径>` 可显式指定程序。
- `%GSP_DIR%` 兜底默认值是开发机的 `D:\Sketchpad5`；**新机器请务必设置 `GSP_DIR`** 或改用参数传入。

---

## 5. 包内目录

| 路径 | 内容 |
|---|---|
| `bin/cli.js` | 命令行入口（单文件 + 批量） |
| `bin/tui.js` | 交互式终端界面（纯 Node + ANSI；非 TTY 时逐行编号菜单） |
| `src/` | 全部转换逻辑：`gsp.js` 读 `.gsp`；`ggb.js` 写/读 `.ggb`；`ir2gsp.js` + `gsp-template.json` 写 `.gsp`；`expr.js` 解码 `tag 2311` 表达式；`zip.js`、`jsp.js`；`convert.js`/`tui-util.js` 供 CLI/TUI 共用 |
| `tools/` | 诊断 / 回归 / 截图脚本（清单见 `README.md` 末尾） |
| `test/` | 早期探针脚本 + `smoke.js` 自检 |
| `reference/` | 已知可用的 `.ggb` / XML 参照样本（`.ggb` 表头格式的来源） |
| `ref-ctrl/` | **真值样本集**：微型控制草图、其 JavaSketchpad `.htm` 导出、`jsp5.jar` 反编译源码、`cfr.jar` |
| `t.gsp` | 函数图 + 自定义坐标系的测试草图 |
| `README.md` | 容器格式逆向事实、语义表、验证、已知限制、工具清单（中文） |
| `README_EN.md` | 同上，英文版 |
| `HANDOFF.md` | 中文交接说明：当前状态、各轮语义结论、下一步 |
| `SETUP.md` | 本文件 |

**打包时不含**（生成物/临时，可随时重建）：`out/`、`test/out/`、`o.ggb`、`out.xml`。

---

## 6. 打一个干净的交接包

```powershell
powershell -ExecutionPolicy Bypass -File tools\package.ps1
```

在项目根生成 `gsp-conv-<日期时间>.zip`，只含源码 / 文档 / 真值样本，自动剔除生成物。
可加 `-Out D:\gsp-conv.zip` 指定输出路径。

---

## 7. 当前状态与验收基线（2026-10-01）

`.gsp → .ggb`：

- 语料 `1430` 文件、`400149` 对象，可发出 **116741**（覆盖率 **29.17%**）——**开发机口径（不含 Samples/Tool Folder）**。
  `node tools/emitstats.js <语料目录>` 应复现该数字。
- **另一台机 2026-10-01 复测**：同一转换器在全树 `1478` 文件（含 `Samples/`、`Tool Folder/`）上，
  `t29`/`t33` marker 接入 2311 解码值后为 `objects=407095 emitted=124349 rate=30.55%`（接入前 29.79%）；
  **再落 `t47` 比值测量（含三点比）后为 `emitted=127886 rate=31.41%`**；
  **修复坐标架单位点语义（`t54`=`SquareUnitPoint` 继承父尺度、`t55`=`RectangularUnitPoint`）、常量函数发射，
  以及依赖型数字（斜率/长度等测量读数）不再被画进绘图区后，为 `emitted=128254 rate=31.50%`（最后一项只改属性，计数不变）**；
  **落地 `t62` 动作按钮（隐藏/显示/动画）并把线段上的点改为真正的路径点后，为 `emitted=131194 rate=32.23%`**；
  **再修正动画根因（路径点必须发 `Point(路径)`＋`<coords>` 才可动画，见 HANDOFF「关键事实」#10）后为
  `emitted=130827 rate=32.14%`**（差额是“目标不可动画”的动画按钮，如实跳过）；
  **再落「圆上点 → `Point(圆)`」（单位方向附 `<coords>`、单参数仅保留圆上关系）后为
  `emitted=132061 rate=32.44%`**（多恢复 126 个动画按钮）；
  **再修正圆上点方向的 y 轴符号（`圆心 + 半径·(px, −py)`，方向存为 y 向上）后 `emitted` 不变，纯位置修正**。
  `node tools/exprcov.js <语料目录>` 解码 `57370/57607=99.6%`。
  两套数字文件集不同，**不可直接相减比较**；差异来自那 48 个样例/工具文件。
- `tag 2311` 表达式解码覆盖 **56875/57112 = 99.6%**（`node tools/exprcov.js <语料目录>`）。
- `node test/smoke.js` → `SMOKE PASSED`。

回归样例（均已用真机 GeoGebra 5.4 打开核对）：

| 文件 | 看点 | 结果 |
|---|---|---|
| `t.gsp` | 自定义坐标架 + 常量函数图 + 图上点 + 斜率测量 | 坐标架正方形（`scale==yscale`）；`f(x)=√3` 归入「函数」（不再是滑块）；`O_5`/`O_7`（斜率测量）只在代数区「数字」显示、**不再被画成滑块图形**；`C=(0,0)`、`B=(1,0)`、`O=(0,1)`、`A=(1,1.73)`、`O_2=(-2.52,4.58)`、`AC 斜率=1.73=√3` |
| `二次函数的图像.gsp` | 近方形坐标架，3 条抛物线参数 | `f=1x²`、`g=1(x−1²)`、`h₂=1(x−1²)+1`，`a=h=k=1` |
| `正态分布曲线图.gsp` | 一元负号优先级 | `f = 2·e^(−x²/2)`（修正后为钟形） |
| `polygon_reflections.gsp` 等 12 个控制草图 | 反射 / 旋转 / 位似 / 多边形 | 12/12 转换成功 |

`.ggb → .gsp`：生成的 `.gsp` 在真实几何画板 5.06 打开并渲染；`polygon_reflections` 往返后 37 个对象（含 21 条反射）全部还原。

已知限制见 `README.md` 的 **已知限制**；主要跳过项：`t21`（已定性＝极坐标平移，发射待落地）、`t33`/`t29`、部分 `t71/t78` 未解码表达式、`t5/t6` 以圆为基的对象等，均**跳过而非猜测**。

---

## 8. 常见问题

- **中文文件名 / 路径**：PowerShell 用 `>` 重定向会写成 UTF-16；经 PowerShell→Node 传中文参数也可能乱码。
  批量转换请让 **Node 自己在目录内遍历**（`tools/*.js` 已如此），或用 `--outdir`。
  命令行输出建议加 `| Out-File -Encoding utf8` 或统一用 UTF-8 控制台。
- **GeoGebra 打不开生成文件**：`.ggb` 表头元素名/枚举值必须精确（详见 `README.md` 的「验证」一节）；
  用 `tools/hybrid.js` 可做表头/正文交叉定位。
- **覆盖率数字对不上**：确认传入了正确的语料目录（`emitstats`/`exprcov` 的第一个参数）。
- **截图脚本拿不到窗口**：先确认 `GSP_EXE` / `GGB_EXE` 指向真实可执行文件；脚本会自动探测常见安装路径。
