# GeoGebra 5.4 XML 语法探针 (ggb-syntax)

这些脚本各生成一个最小 `.ggb`（`node ref-ctrl/ggb-syntax/minitestN.js` -> `out/minitestN.ggb`），
用 `tools/ggbshot.ps1` 打开并截图，读取 GeoGebra 弹出的 **“打开文件失败 / error in <expression>”**
对话框，从而确定**哪些命令在 GeoGebra 5.4 的 `<expression>` 里合法**。

> 背景：`tools/ggbcheck.ps1` 只能判断“能否打开”，GeoGebra 会把非法表达式放进错误对话框、
> 但文件仍算“打开成功”。因此这类问题必须看对话框（`ggbcheck` 现已能枚举该对话框 → `err=True`）。

## 已确认的事实（GeoGebra 5.4，2026-10）

| 表达式 | 结果 | 说明 |
|---|---|---|
| `Point(<Line>)` / `Point(<Segment>)` | ✅ | 点可在任意 path 上 |
| `Intersect(<Line>, <Function>, k)` | ✅ | 直线 × 函数可行（之前误判为非法，实为 `x_` 未定义） |
| `Line(<Point>, <Line>/<Segment>/<Vector>)` | ✅ | **平行线**用 `Line(P, base)`；见下 |
| `PerpendicularLine(<Point>, <Line>)` | ✅ | |
| `Min(1, Max(0, x))` | ✅ | 命令名大小写敏感，须首字母大写 |
| `min` / `max`（小写） | ❌ | 被当作未知函数 → 报错 |
| `sqrt` / `abs` / `ln` / `exp`（小写） | ✅ | 这些是**内建函数**，小写合法 |
| `ParallelLine(...)` | ❌ | **GeoGebra 没有这个命令**（即使 base 是合法 Line 也报错） |
| 名为 `x_` / `y_` / `z_` 的对象 | ❌ | GeoGebra 保留给坐标轴；引用它们的表达式全部报错。`x__` / `x_1` / `xa` 都可以 |
| `ParallelLine(P, S)` 且 P 在 S 上 | ❌ | 退化情形（平行线=自身），应避免 |

## 对应到本项目

- `src/ggb.js` `sanitizeLabel`：保留名（含 `x/y/z`）不再加 `_`（会得到 `x_`），改用 `_1`。
- `src/ggb.js`：`parallelLine` 发射 `Line(P, base)`（原来错误地发射 `ParallelLine`）。
- `src/ggb.js`：`min(1, max(0, …))` → `Min(1, Max(0, …))`。
- `src/ggb.js` `axis` 分支：原点不是点时（如函数图坐标系）→ 跳过，避免 `Line(f, f+(1,0))`。

## 复现方法

```
node ref-ctrl/ggb-syntax/minitest3.js
powershell -ExecutionPolicy Bypass -File tools/ggbshot.ps1 -File out/minitest3.ggb `
  -WaitSec 25 -Exe "D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe" -Out out/shot3.png
# 然后查看 out/shot3.png 里的错误列表
```

| 脚本 | 验证内容 |
|---|---|
| `minitest.js` | `Intersect(x_,f,1)` / `Point(x_)` / `ParallelLine` 初判 |
| `minitest2.js` | 一批命令（`Point`/`Intersect`/`ParallelLine`…）哪个失败 |
| `minitest3.js` | 区分“标签 `x_`”还是“定义 `Line(O,O+(1,0))`” |
| `minitest4.js` | `x__` / `x_1` / `xa` 可行，`y_` 不可行 |
| `minitest5.js` | `ParallelLine` base 为 segment/line/vector 都失败 |
| `minitest6.js` | `Line(P, base)`（line/segment/vector）都成功 |
| `minitest7.js` | `min/max` 是罪魁（`t2` 投影本体合法） |
| `minitest8.js` | `Min`/`Max` 大写合法、`min`/`max` 非法 |
| `minitest9.js` | `sqrt`/`abs`/`ln`/`exp` 小写合法 |
