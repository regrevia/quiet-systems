# 审阅报告校验

## 结构要求

`scripts/validate-review-report.mjs` 校验外部审阅报告是否按 P0、P1、P2、已验证项和未验证项的顺序组织，防止只有总体印象或信息顺序混乱的报告被当成完成证据。

五个必需章节按下面的正则匹配：P0、P1、P2 要求行首出现章节名（允许前面带一至六级标题符号），已验证项接受「已验证」「验证结果」「verified constraints」「verified」，未验证项接受「尚未验证」「未验证」「unverified」「evidence still needed」。每项按大小写不敏感匹配，P0、P1、P2 另要求多行模式。

| 章节 | 匹配内容 |
| --- | --- |
| P0 / P1 / P2 | 行首的 P0、P1、P2（可带 `#` 到 `######` 标题），按词边界匹配 |
| 已验证 | 已验证、验证结果、verified constraints、verified |
| 未验证 | 尚未验证、未验证、unverified、evidence still needed |

```js
/(?:^|\n)\s*(?:#{1,6}\s*)?P0\b/im
/(?:已验证|验证结果|verified constraints|verified)/i
/(?:尚未验证|未验证|unverified|evidence still needed)/i
```

缺少任一章节返回 1，并写出缺少的章节名。五个章节的位置必须依次递增，顺序错乱同样返回 1，并提示必须按 P0、P1、P2、已验证、未验证排列。

`reviewer-contract.md` 为 Claude Code、Kimi 和 MiniMax 提供统一的只读审阅提示、P0/P1/P2 分级、证据要求和未验证项格式。审阅器不能修改工作区，也不能把截图美感当成真实数据或交互证据。

## --strict 追加要求

`--strict` 会进一步要求非“无问题”段落提供文件、行号或非空证据字段，并拒绝空泛赞美。严格校验失败同样返回 1。

报告全文必须出现以下 10 项证据，缺一项报一条 `missing <名称>`：

| 证据项 | 命中内容 |
| --- | --- |
| design contract | design contract 或 设计合同 |
| interaction inventory | interaction inventory 或 交互清单 |
| field mapping | field mapping 或 字段映射 |
| state matrix | state matrix 或 状态矩阵 |
| viewport evidence | viewport 或 视口 与 390 或 1440 同段出现 |
| composition metrics | metrics 或 指标 与 title、secondary、text-action、surface、pill、separator 之一同段出现 |
| empty-space pressure | 空白填充、副标题或 empty space 与 删除、重排、拒绝或 delete、reflow、reject 同段出现 |
| text-button pressure | 文字按钮或 text button 与 图标、拒绝或 icon、reject 同段出现 |
| decoration pressure | 装饰、渐变、玻璃或 decoration、gradient、glass 与 拒绝、删除或 reject、remove 同段出现 |
| copy deletion check | 文案删除、删除复测或 copy deletion 与 重跑、结果、决策或 rerun、decision 同段出现 |

后四项按标签切块检查：从标签出现的位置到下一个压力标签之间，必须出现 `证据`、`evidence`、`位置`、`文件`、`file`、`line` 之一，并带 `行 N`、`line N` 或带行号的文件名（`.ts`、`.tsx`、`.js`、`.jsx`、`.vue`、`.svelte`、`.css`、`.md`、`.json`）。否则报 `<标签> needs file, line, or evidence`。

P0、P1、P2 三段各自从章节名到下一章之间，要么以 `无 P0`、`没有 P0`、`none P0`、`no P0` 这样的写法声明无问题，要么提供证据。证据的两种可接受写法：

```text
证据：<非空内容>   （evidence: 同样接受，写「无」「暂无」「待补」「需要」视为缺失）
位置/文件/file/line：<带「行 N」「line N」或带行号的文件名>
```

全文出现以下说法即报 `remove vague praise and state an actionable finding or evidence`：整体很好、高级感很强、看起来很棒、looks great、overall good、very polished。

## 审阅脚本自己的输出

上面校验的是人写的报告。`scripts/ui-guard-review.mjs` 的输出同样有固定形状，格式一旦变形，读它的人（或 agent）就得重新推理哪些行能直接改代码。

发现按 severity → 文件 → 行 → 规则排序，同一棵树两次运行逐字节一致。每条发现两行：`file:line SEVERITY RULE message`，第二行缩进两格给 evidence，evidence 是被点名的那段源码，不是复述。

修复建议属于规则而不是某次出现，所以按规则在末尾汇总一次（`RULE → remediation`，多处命中时写成 `RULE (N finding(s)) → remediation`），按 severity 再按规则 id 排序。29 条发现各配一句同样的建议会把文件清单挤出第一屏，而那才是能动手的部分。`--json` 里每条发现仍各自带 `remediation`，逐条处理的下游不用回查。

末行是 `ui-guard review: N finding(s) (1 P0, 20 P1, 10 P2) in M file(s)`。`M` 是实际读了多少文件：根路径写错、扩展名清单不匹配、整棵树被忽略，三种情况都读到 0 个文件，那时再补一行 `reviewed no files` 点名这三个原因。只有 0 个文件的“干净”和真正干净不是同一个答案，`--json` 的 `reviewed` 给同一个数。

结尾可能追加三种行，彼此独立：`N finding(s) matched the baseline`（被 `--baseline` 冻结的存量）、每个 `skipped` 文件一行（`maxFileBytes`、`symlink`、读取失败）、以及 `scan incomplete`。前两者是声明的边界，不改变退出码；读取失败是覆盖缺口，退 `2`。

输出接到管道中途被关掉（`ui-guard review . | head`）不算失败：脚本对 `EPIPE` 直接退出 `0`，不打印 Node 堆栈。

## 退出码

报告校验返回 0 表示结构完整，1 表示缺少必需章节，2 表示参数或文件读取失败。

具体行为：返回 0 时脚本输出 `quiet-systems report validation: valid`。返回 1 覆盖三种情况——缺少必需章节、五个章节顺序错乱、严格校验失败。返回 2 覆盖参数缺失（不给报告路径时先打印用法）和文件读取失败。
