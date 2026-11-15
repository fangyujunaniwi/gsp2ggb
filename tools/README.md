# `tools/` — 开发与诊断脚本

这里的脚本**不是**转换器的运行时代码（运行时只依赖 `bin/` + `src/`），而是开发、逆向与回归时用的辅助工具。
一次性的 dump/probe 脚本已清理；以下为保留的常用项。

## 回归与统计

| 脚本 | 用途 |
|---|---|
| `emitstats.js` | 全语料发射统计（`files/objects/emitted/rate`）与按类型/跳过原因排行，用于基线对比 |
| `exprcov.js` | `tag 2311` 表达式解码覆盖率 |
| `validate.js` | 结构/引用一致性校验 |
| `fails.js` | 列出转换失败的语料文件 |
| `skips.js` | 按跳过原因聚合 |
| `stats-counts.js` | 计数类统计 |
| `regress.ps1` | 回归批跑（转换 + `ggbcheck`） |
| `corpus.js` | 语料遍历基础工具 |
| `corpuscheck.js` | 分层抽样 → 生成 `out/corpus` 的 `.ggb` 与 `manifest.json` |
| `corpusrun.ps1` | 逐页 `ggbcheck`，写 `results.tsv` |
| `corpusstats.js` | 汇总抽样结果与失败原因分类 |

## 真机验证（GeoGebra / 几何画板）

| 脚本 | 用途 |
|---|---|
| `ggbcheck.ps1` | 打开 `.ggb`，检测「打开文件失败」对话框，输出 `ok=/err=` |
| `ggberrshot.ps1` | 把错误对话框移到左上角并放大，裁剪出**完整报错文本**（读残余错误用） |
| `ggbshot.ps1` / `gspshot.ps1` | 整屏截图（GeoGebra / 几何画板） |
| `shot.ps1` / `shotggb.ps1` / `shotgsp.ps1` | 截图辅助（旧版，保留兼容） |

## 结构检查与诊断

| 脚本 | 用途 |
|---|---|
| `inspect.js` | 打印 `.ggb` 的条目、元素/表达式计数 |
| `warn.js` | 导出某文件的全部警告到 `out/warnings.txt` |
| `elemtypes.js` | 按标签查元素类型/表达式；按正则导出表达式 |
| `kindscan.js` | 统计某 kind 的父对象 IR 类型与发射元素类型（设计类型守卫用） |
| `ggbexprs.js` / `ggbtypes.js` / `xmlexpr.js` | `.ggb` 表达式/类型/XML 检查 |
| `objlist.js` / `one.js` / `pick.js` / `head.js` | 按对象/位置查看 IR |

## 轨迹（Locus）

| 脚本 | 用途 |
|---|---|
| `locusaudit.js` | 静态校验每个 `Locus(Q,P)`：P 是否在 Q 的**发射后**依赖闭包内 |
| `locustest.js` | 最小 `.ggb` 实验：验证 GeoGebra 对 `Locus` 依赖形态的真实约束 |

## GSP 记录层与逆向

| 脚本 | 用途 |
|---|---|
| `jspextract.js` / `tsamples.js` | 从 JavaSketchpad `.htm` / 真值草图提取对照 |
| `docrecs.js` | 按文档顺序导出记录 |
| `dump-hdr.js` / `dump-one.js` / `dumpexpr.js` | 记录头 / 单条记录 / 表达式 dump |
| `rawdump.js` / `rawobjs.js` / `rawprog.js` / `bytes.js` | 原始字节与程序段检查 |
| `codefind.js` / `codescan.js` | 定位/扫描 2311 程序片段 |
| `predefdump.js` / `predefmap.js` / `predefscan.js` / `predefset.js` | 预定义工具/类型映射 |
| `t32.js` / `t34host.js` / `t34probe.js` / `diag2933.js` | `t32` 宏实例、`t34`、`t29/t33` 专项探针 |
| `patch2003.js` / `patch-double.js` | 定点修补实验 |
| `reserialize.js` / `rebuild.js` / `splice.js` / `pack.js` | 重组/重打包实验 |

## 坐标系 / 视图 / 模板

| 脚本 | 用途 |
|---|---|
| `frameaudit.js` / `framefn.js` / `framelist.js` / `frameprobe.js` | 草图坐标系（`sketchFrame`）检查 |
| `alignpair.js` / `build-template.js` / `hybrid.js` / `try-conv.js` | 对照/模板/混合实验 |
| `package.ps1` | 打包发布 |

## 类型/语料普查

`namescan.js`、`markerclass.js`、`parentprofile.js`、`perpbases.js`、`tokhist.js`、`excl.js`、
`cascade.js`、`skels.js`、`stat.js`、`strings.js`、`over.js`、`probe.js`、`probe47.js`、`freeimg.js`、
`refimg.js`、`rawdump.js` 等用于特定轮次的类型普查与逆向取证，结论已写入
[`../TYPE_TABLE.md`](../TYPE_TABLE.md)、[`../Tech_Details.md`](../Tech_Details.md) 与
[`../HISTORY.md`](../HISTORY.md)。

## 约定

- 新写的诊断脚本请带 `'use strict';` 与一行用途注释；一次性的探索脚本在结论落地后删除。
- 路径参数优先用 `GSP_DIR` / `GSP_SAMPLES` / `GSP_TOOLS`（见 [`../SETUP.md`](../SETUP.md)），不要写死机器路径。
