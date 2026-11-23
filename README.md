# Quiet Systems

面向前端与原型的设计流程 Skill。默认偏向简约，具体风格由产品和内容决定。参考 Apple/macOS、Linear 和 Ponytail 的空间、层级、任务流、最小完整变更和状态原则，帮助 Web、桌面端和 App 减少多余文字、复杂装饰和 AI Slop。

只需安装 Quiet Systems。比如告诉 agent「用 Quiet Systems 做一个排练室预约页，用户需要找到今晚可用的房间」。给出已有数据或品牌要求即可。方向不清时先看小样，确定后沿同一任务完成页面、接入数据并在浏览器里走查。

借鉴 Anthropic 从题材和实际内容推导视觉方向的做法、Impeccable 对成品的设计批评，以及 Taste Skill 对参考素材和浏览器实测的重视。Quiet Systems 把它们落实到同一条任务上。以预约页为例，先让人找到可用时段，再核对预约结果。标题下面无需另写一句“轻松发现你的专属空间”。[Anthropic Frontend Design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)、[Impeccable](https://github.com/pbakaus/impeccable)、[Taste Skill](https://github.com/Leonxlnx/taste-skill)

## 怎样衡量效果

选取阅读、比较、编辑或恢复等不同任务，各写下一个可核对的完成条件。每个任务固定需求、输入数据、模型版本、工具、时间预算和视口，用独立会话分别生成启用与未启用 skill 的页面。保留失败样本，逐任务配对。用匿名编号随机交换展示顺序，两名审阅者各自完成主任务并记录键盘操作步数，再独立评价视觉。

| 指标 | 记录方式 |
| --- | --- |
| 任务完成 | 成功次数 / 尝试次数，同时记录失败在哪一步。 |
| 冗余文案 | 每屏可删的文字块数。逐条做删除测试，确认对象、操作后果和恢复方式仍然清楚。 |
| 风格适配 | 给同一任务两种不同的品牌简报，让审阅者将成品匹配到简报，记录匹配正确数 / 总数。 |
| 视觉偏好 | 记录每对页面的胜、平、负，并标注决定判断的具体区域。 |

分别报告各项原始计数、样本量和审阅者分歧。自动扫描告警单列。若文案减少但任务失败增加，公开这一退步。小样本结果只解释所测任务。

## 安装

### Codex

```bash
git clone https://github.com/regrevia/quiet-systems.git ~/.agents/skills/quiet-systems
```

### Claude Code

```bash
git clone https://github.com/regrevia/quiet-systems.git ~/.claude/skills/quiet-systems
```

安装后，在设计、重构、评审 Web 或 App 页面时使用 `quiet-systems`。从产品仓库运行已安装的检查器，例如：

```bash
QS_DIR="$HOME/.agents/skills/quiet-systems"
node "$QS_DIR/scripts/quiet-systems-review.mjs" --json .
```

Claude Code 安装使用 `$HOME/.claude/skills/quiet-systems`。以下维护命令从 skill 仓库根目录执行。完整自测可使用 Node.js 24 运行 `node --test scripts/*.test.mjs`。

## 覆盖内容

- Apple 式空间层级、功能层和瞬时层
- 黑白灰、材质、圆角、阴影和信息密度
- 图标语义、光学尺寸、状态和可访问名称
- 精简中文文案和减少次要标签
- AI Slop 识别与删除清单
- 协作、SaaS、Agent、插件和消息页面评审
- 从线框到 Token、组件和验收的设计顺序
- 需求不明确时的多方向样板、参考素材和原型收敛流程
- 真实数据、状态、权限和前后端接入的一致性闸门
- 静态 UI 审阅脚本，用于发现装饰性分隔符、绕过 Token、未适配原生控件、写死的图标尺寸、缺少 reduced-motion 路径、装饰性 AI Slop、泛化营销文案、缺少图片替代文本、无可访问名称的图标控件、隐藏的交互元素和原型数据进入生产源
- 方向样板说明、production-shaped fixture、UI 审阅报告模板和外部审阅器只读输出契约

## 设计立场

高级感来自秩序、留白、准确的文字和可靠的状态反馈。玻璃、渐变、发光、抽象 AI 图形、重复卡片和营销副标题都需要有明确任务价值，否则应被删除。

Apple 的理念用于提炼方法，不复制 Apple 的品牌资产、SF Symbols 文件或专有界面。

## 使用方式

这个 skill 不规定固定的配色、字体、圆角或材质。它要求先确定任务、对象、数据和状态，再通过线框、多个低成本方向和真实数据样例收敛视觉方案。高保真原型必须经过真实数据、权限、加载、失败和恢复状态验证，静态演示不能代替接入验收。

仓库附带一个静态审阅脚本：

```bash
node scripts/quiet-systems-review.mjs path/to/ui
node scripts/quiet-systems-review.mjs --json path/to/ui
node scripts/quiet-systems-review.mjs --include-markdown path/to/ui
node scripts/quiet-systems-review.test.mjs
# 不传目录时，fixture 校验器默认扫描它所在仓库的 examples/fixtures
node scripts/validate-review-report.mjs path/to/review.md
node scripts/validate-review-report.mjs --strict path/to/review.md
node scripts/validate-review-report.test.mjs
node scripts/validate-fixtures.mjs examples/fixtures
node scripts/validate-fixtures.test.mjs
```

仓库根目录的 `.quiet-systems.json` 可以配置忽略目录、忽略规则、文案长度阈值和最大文件大小。忽略规则会按配置目录和扫描根分别尝试匹配，避免从不同工作目录运行时失效。超过最大文件大小的文件会出现在 JSON 报告的 `skipped` 列表中。脚本只提供固定代码检查，不能替代浏览器、键盘、读屏、真机和真实数据验证。

`examples/direction-samples/README.md` 规定需求不明确时如何制作多个低成本方向。`examples/fixtures/` 提供长文本、空状态和权限受限的 production-shaped fixture，`scripts/validate-fixtures.mjs` 检查状态名、来源标记和关键字段是否满足边界契约。脚本不传目录时默认扫描它所在仓库的 `examples/fixtures`。loading 和 offline 保留 `items: null` 或数组的选择，用于表达尚未有缓存和已有缓存两种情况，脚本的通用 `items` 类型检查会覆盖这两个状态。partial-failure 要求至少有一项可见结果和一项 `failedItems`，每项 `failedItems` 必须提供 `id`、`reason` 和 `retryable`，零可见结果应转为 error 或 permission 状态。`review-template.md` 用于记录信息层级、数据映射和验证证据。

`reviewer-contract.md` 为 Claude Code、Kimi 和 MiniMax 提供统一的只读审阅提示、P0/P1/P2 分级、证据要求和未验证项格式。审阅器不能修改工作区，也不能把截图美感当成真实数据或交互证据。

`scripts/validate-review-report.mjs` 校验外部审阅报告是否按 P0、P1、P2、已验证项和未验证项的顺序组织，防止只有总体印象或信息顺序混乱的报告被当成完成证据。`--strict` 会进一步要求非“无问题”段落提供文件、行号或非空证据字段，并拒绝空泛赞美。严格校验失败同样返回 1。

报告校验返回 0 表示结构完整，1 表示缺少必需章节，2 表示参数或文件读取失败。

`examples/production-adapter.ts` 提供两个入口。原型通过 `adaptDemoPayload` 读取有标记的 fixture，产品通过 `adaptProductionPayload` 读取接口数据，遇到 fixture 标记即报错。浏览器和服务端使用同一判断。原生控件经过统一外观适配后，可以用 `data-quiet-adapted` 或 `quiet-systems: allow-native` 标记并保留人工复核证据。

`examples/view-state-contract.ts` 展示如何用判别联合约束 loading、ready、empty、error、offline、partial、permission 和 recovered 状态，并从同一状态来源推导可见数据和恢复动作。
offline 可以没有缓存数据，界面仍应保留“离线且暂无缓存”和“查询结果为空”的语义差异。
`examples/production-adapter.ts` 使用接口层的 `partial-failure`、`permission-limited` 和 `lastKnownUpdatedAt` 字段承载后端语义。fixture 和 adapter 使用的是传输层状态名，接入视图层时应在适配边界映射为 `partial`、`permission` 和 `lastUpdatedAt`，避免把传输字段误当成组件状态名。error fixture 的最小契约是 `code` 和 `retryable`，面向用户的具体错误文案由视图层根据对象和下一步动作生成。

`examples/linear-patterns.ts` 展示工作区默认视图、个人偏好和选中对象动作的分离。`examples/motion-tokens.css` 展示短时、克制的状态动效，以及 `prefers-reduced-motion` 的降级路径。`examples/icon-tiers.ts` 展示跨平台的图标光学尺寸层级。

CSS 动效如果已经通过人工设备和辅助技术验证，可以在文件中留下 `/* quiet-systems: motion-adapted */` 标记，保留验证责任并避免重复误报。

超过 400ms 的 CSS 动效如果确实服务于连续任务或状态叙事，可以留下 `/* quiet-systems: motion-duration-reviewed */` 标记，并在审阅报告中写出验证证据。

## 参考

- [Apple Human Interface Guidelines: Icons](https://developer.apple.com/design/human-interface-guidelines/icons)
- [Apple Human Interface Guidelines: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Apple Human Interface Guidelines: Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- [Apple SF Symbols](https://developer.apple.com/sf-symbols/)

## 竞品与验证方向

Anthropic frontend-design 从产品题材选择字体、内容和构图，也明确讨论中点串联元信息和多余眉题。可借鉴它的检验方法：换成另一种产品，首屏如果仍然原样成立，就应回到具体对象重新设计。[原文](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)

Impeccable 同时提供源码检测和渲染页面检测。对比度、小字号等结论需要在渲染结果上验证。Quiet Systems 当前的扫描器提供源码线索，视觉验收仍需打开界面。[原文](https://github.com/pbakaus/impeccable)

Quiet Systems 目前值得验证的优势是从选方向一直跟踪同一个任务和同一份数据。现有样板、部分失败数据和报告可以串起来验收。比较不同 skill 的产出时，固定模型、任务、数据和视口，记录用户能否完成任务、多余文案实例、失败恢复结果和仍需人工修正的地方。

### 同题实测：工作坊目录

同一 Claude Code 模型（工具关闭）依据两份 skill 入口分别生成独立 HTML。输入只有木刻入门、书籍装帧、手绘地图三条记录及日期、形式。用 Chrome 在 390 和 1440 像素宽度检查实际列表、键盘 Tab 可达性、横向溢出和组合筛选。

- 初次仅用 searchable/filterable 描述需求，两份产物都有筛选，均漏了文本搜索。选周日和线上时，Quiet Systems 显示空结果提示，frontend-design 留下空白。两者在单独清除形式条件后都恢复了周日课程。
- Quiet Systems 初版自行补写了课程描述，frontend-design 初版还加入了价格和具体时段。随后给 Quiet Systems 增加字段来源和逐项操作要求，保持初始题目重跑，搜索入口仍然缺失。
- 第二组题目明确要求“输入部分名称查找”。两份产物在两个宽度均能按“装帧”找到一条记录，叠加线上筛选后为空，单独清空查询后只剩手绘地图。两个筛选框均可用 Tab 到达，实测视口无页面横向溢出。

每组每种条件只有一次生成。这次验证支持保留空状态、字段来源和逐项操作验收，无法据此给两套 skill 的普遍表现或视觉审美排名。

### 同题实测：本机报名表

同一模型分别按两份 skill 生成报名表。在 Chrome 的 390 和 1440 像素视口输入姓名及错误邮箱，再只纠正邮箱并按 Enter。两份初版都保留了姓名和邮箱草稿，焦点在错误字段，修正后显示确认。Quiet Systems 样例承诺后续联系，frontend-design 样例声称已发送邮件；任务只要求本机提交，两项承诺都缺少依据。

加入“确认文案只陈述已完成效果”后，同题重跑的 Quiet Systems 样例显示“已保存到此设备”。在浏览器中让本地存储写入抛出配额异常，两个宽度下它仍显示保存成功并隐藏表单。入口规范和审阅模板因此加入失败注入与原草稿重试步骤。后续按相同简报重新生成，在两个宽度下强制写入失败后均保留了姓名与邮箱，通过系统弹窗提示失败。恢复写入后，用原草稿再次提交成功，浏览器存储中出现一条记录。失败反馈仍需适配产品样式。

### 同题实测：指标解读

同一模型依据两份 skill 生成维修周报。在 Chrome 的 390px 和 1440px 视口往返切换两期，两份原型均正确保留东站的 0 件和西站的未上报状态。两份标题都较宽泛，Quiet Systems 初版还用一行摘要重复列出了各站上报情况。加入“写清被计数的事件，缺失原因放在对应值旁”的规则后，重跑产物用“已完成维修”作列表头，去掉了重复摘要。

MiniMax 审阅提示还要验证合计。另用图书归还月报检验迁移：两馆分别为 12 和缺失时，合计显示“12(部分)”；两馆都上报时，5 和 0 合计为 5。再把两馆都置为缺失，浏览器实际显示“0(部分)”，暴露了把无观测误读为零的风险。最终规则要求在合计处分别检查全部上报、部分上报、全部缺失。后来同题重跑时，全部缺失不再显示零，但部分上报和全部缺失都显示“部分数据同步中”，没有给出部分合计 12。以上均为单次生成和浏览器交互观察。

指标报表可复用 `examples/report/count-summary.mjs`，输入按预期来源排列，每个缺失项填 `null`。输出同时保留合计、上报数和预期数。把这个参考函数随同原简报提供给生成器后，重新生成的报表在 Chrome 两个宽度下分别显示了部分合计 12（1/2 个分馆）、真实的部分合计 0（1/2 个分馆）和全部缺失时的“无可用数据”。切换上月显示完整合计 5。该函数适用于可相加的非负整数计数；均值、比例与去重人数需要各自的聚合口径。

### 同题实测：手册阅读

在相同模型和三段已定稿中文正文下生成手册，Chrome 以 390px 和 1440px 两种宽度检查目录、章节深链及浏览器返回。两份产物都能从目录进入章节并返回上一个片段地址。Quiet Systems 初版只保留了提供的三段正文，却将三处中文逗号替换为英文逗号；frontend-design 初版保留了三句原文，同时增加副标题、解释及建议，其中包括未提供的湿度范围。

加入保留定稿要求后，同题重跑仍出现三处逗号差异。交付时可以将浏览器可见正文与定稿分别按段导出，再运行 `node scripts/compare-article-copy.mjs approved.txt rendered.txt`。返回 0 表示段落内容与顺序一致，1 表示存在差异，2 表示输入错误。脚本只核对导出的文字，目录定位和遮挡仍需浏览器走查。

### 同题实测：产品介绍与示例

给同一模型一条会议原文和对应的决策清单，要求访客在产品介绍页原地打开、关闭示例。Chrome 在 390px、1440px 两种宽度下都复现了初版的问题：Quiet Systems 把打开和关闭做成原文与清单的切换；frontend-design 能切换按钮并归还焦点，但收起后浏览器可访问性树仍暴露示例，还添加了简报以外的会议事项。

修订规则后，同题生成的 Quiet Systems 产物在两个宽度都能由键盘打开示例，展开时原文与结果同时出现在可访问性树，关闭后两者消失，焦点回到打开按钮。首屏仍出现重复产品承诺的“主要功能”列表。本次检查验证了操作与内容状态，没有进行访客理解度或读屏软件实测。

### 同题实测：导出失败与局部恢复

给两个原型接入同一可控重试函数，在 Chrome 的 390px 和 1440px 视口用键盘连续重试。两者都只发出一次请求，成功记录仍能打开，再次重试成功后失败标记消失。frontend-design 在失败行正确显示了新的错误原因，但按一次 Enter 查看月报弹出了两次提示。Quiet Systems 打开了原地详情，却编造了文件大小和导出内容；重试期间旧错误仍可见，新错误只在弹窗中出现。

据此补充逐条恢复的验收步骤，要求检查等待期间的文字、错误原因所在位置、详情字段来源和单次键盘激活的效果。本次记录来自同一模型的各一次生成，描述的是修订前产物。

WorkBuddy 的 MiniMax-M3.1-Flash 建议用固定数据核对详情字段。采用时按屏幕实际需要的字段检查来源，内部 ID 可隐藏，能从源值推导的格式化结果可显示。例如，只提供文件名和状态时，可显示扩展名，大小和导出时间均缺少依据。

修订后同题重跑，在两个宽度下均能看到重试等待状态、新的行内失败原因，以及成功后的清除。仍有两处可复现的问题：同一行重复显示“重试中”，“查看”只弹出“正在打开 月报.pdf”，没有呈现详情。对查看操作的验收因此要求打开后能读到对象与可用字段。

打开两张 390px 实拍对照：[Quiet Systems 修订后](examples/comparison/recovery-quiet.png) 和 [frontend-design](examples/comparison/recovery-frontend-design.png)。Quiet Systems 用蓝色强调唯一的恢复操作，查看按钮退到次级，首屏也省去了无来源的时间戳。两份原型的文件名、原因和操作都靠位置分开。若一屏同时出现多条失败记录，还需重新检查多个蓝色按钮是否争夺注意力。

再把同一原型接到本机 HTTP 接口，第一次重试返回 503 和新的失败原因，第二次返回 200。在两个宽度下连续按两次 Enter 均只产生一个初始 POST，新的原因出现在失败行，再次重试后显示完成。这次验证使用本机测试服务。

### 原文与走查方法

| 一手原文 | 在 Quiet Systems 中如何检查 |
| --- | --- |
| “Align elements to make them easier to scan, and use indentation to convey hierarchy.” [Apple HIG：Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | 用同一组藏品检查时间是否能纵向比较、从属说明是否能归回正确的对象。 |
| “While the parts central to the user’s task should stay in focus, ones that support orientation and navigation should recede.” [Linear：A calmer interface](https://linear.app/now/behind-the-latest-design-refresh) | 到达详情后检查当前记录是否获得主要视觉权重，同时能找到回到集合的入口。 |
| “Write button text in sentence case, describing the action it performs.” [GOV.UK Design System：Button](https://design-system.service.gov.uk/components/button/) | 中文复用动作命名原则。逐个激活“查看”“保存”等按钮，检查下一状态与动词是否相符。 |
| “Keep words to a minimum so they are fast to read and act upon.” [Carbon：Empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states) | 空列表只解释当前原因和可用下一步，逐句删除重复说明，保留完成操作所需的信息。 |

### 同题实测：需求不明确时选方向

用两条社区藏品记录生成通览和逐件阅读两个方向。首次生成在 390px 和 1440px 下均可按键打开裁纸刀记录并返回，但正文都新增了刀刃磨损等细节，返回焦点也未落到原记录。强调保留一行原文后，同题重跑仍编造了刀刃状态。针对这种情况，两个可打开的参考样板现在直接读取同一份字段。可用 [通览样板](examples/direction-samples/archive/overview.html) 比较年份，用 [阅读样板](examples/direction-samples/archive/reading.html) 打开单件，再回到原入口。这两个是经人工修订的参考实现。

WorkBuddy 的 Kimi-K3.1-Pro 提醒，选择方向还需考虑低频但必要的任务。两件年份是否必须同屏可比，可以实际操作后回答。

### 动效与快速返回

Apple 对自定义动效的两条原文是 “Make motion optional.” 和 “Let people cancel motion.” 通览样板打开详情时淡入，开启减少动态效果后直接呈现。详情内容与键盘焦点随操作就位。[Apple HIG：Motion](https://developer.apple.com/design/human-interface-guidelines/motion)

在装有 Chrome 和 `playwright-core` 的项目目录中运行 `node "$QS_DIR/scripts/verify-sample-motion.mjs"`。该脚本使用仓库自带的藏品样板，在 390、768、1440 像素宽度分别测试普通与减少动态效果两种偏好。它走查打开、立即返回、切换记录与再次关闭的过程。验收产品时，把这组操作换成该产品真实的对象和入口。

WorkBuddy 的 MiniMax-M3.1-Flash 提出用宿主元素检查样式泄漏。脚本现同时检查独立元素的动画名称和时长；即使全局覆盖只把时长改成 1ms，也会触发失败。普通模式的测试会暂停正在进入的弹窗，以便确定关闭发生在动画完成前。

本机草稿的[可运行样板](examples/local-draft/index.html)把保存错误留在输入区旁，写入成功后才确认。装有 Chrome 和 playwright-core 的项目可运行 `node "$QS_DIR/scripts/verify-sample-save.mjs"`，检查键盘重试和刷新后的内容。

### 原生页面视觉复核

三轮审阅使用 Android 应用运行截图与演示账本。Kimi 从总览前后对照中发现双位数轴标签换行；MiniMax 查看修订后的总览与平台详情，发现总览的 16 笔在详情丢失；Claude Code 逐图核对总览、平台与交易，在 6 笔餐饮交易中发现汇总和明细的正负号口径不清。由此补充三项走查：刻度碰撞时优先降低密度；同范围的金额和笔数可下钻核对；切换层级时能解释金额方向。三条都可在其他产品中按数据语义选用。

### Lenso UI：菜单与页签

[小红书笔记](https://xhslink.cn/o/8VgA4P6NEOP)介绍的是 [Lenso UI](https://ui.lenso.dev/)，一个 MIT 许可的 React 组件库。它把页签的行为交给 UI SDK，另外绘制选中指示器，并提供独立的面板组件。Quiet Systems 借鉴这层分工：把指示器换成普通下划线后，键盘选择、焦点提示和内容切换都应继续工作。[页签源码](https://github.com/LioRael/lenso-ui/blob/c6624745d9aab11de4ca1e3d152a046187b671d1/packages/ui/src/components/tabs/tabs.tsx)

分享菜单把 Copy Link 放在首层、邮件渠道放进子菜单。值得复用的是按任务组织命令和逐级返回。该示例中可见的 Other 却使用 Share 作为可访问名称，因此审阅时还要核对屏幕标签与辅助技术名称。菜单深度、英文命名和玻璃效果都由各产品自行取舍。[菜单示例源码](https://github.com/LioRael/lenso-ui/blob/c6624745d9aab11de4ca1e3d152a046187b671d1/apps/docs/src/demos/en/menu/with-submenus.tsx)

在有 Chrome 和 `playwright-core` 的产品目录中，用两个相邻页签和目标面板内独有的一句实文运行检查：

```sh
node "$QS_DIR/scripts/verify-tab-switch.mjs" "$PAGE_URL" 原文 校注 '保留原折痕，暂不压平。'
```

脚本在 390 和 1440 像素宽度检查方向键焦点、激活、面板关联和实际内容。古籍记录样板在两个宽度均通过。把校注页签指回原文面板，脚本会报错。

Kimi-K3.1-Pro 查看[原文截图](examples/comparison/tabs-original.png)和[校注截图](examples/comparison/tabs-annotation.png)，读对了两句正文，也指出单独一句校注缺少归属。两张图已经显示页签名；真正缺失的是当前记录的名称。因此规范要求在上下文容易丢失时保留对象名称，可复用现有页面标题或面包屑。

[卷三修复记录样板](examples/record-tabs/index.html)可离线打开。用左右方向键切换原文和校注，两页共用一个记录标题。MiniMax-M3.1-Flash 在窄屏截图中读出了卷名、页签和正文，也发现单句校注下方有大块留白。样板已取消面板的固定最小高度，让内容决定卡片高度。

长内容回归可运行 `node "$QS_DIR/scripts/verify-record-reflow.mjs"`，末尾可加 PNG 输出路径。脚本把连续档案编号与多行中文放入真实样板，在 320、390、1440 像素宽度检查页面溢出和面板裁切。Claude Code 看过 320 像素截图，读出了编号末四位 0198，也注意到校注页签上的蓝框。蓝框标记键盘焦点，下划线标记选中状态。它把末句的“页”看成了“见”，逐字校验仍应对照源文本。

预约页实测中，初稿与更新提示词后的第二次生成都索要了需求以外的手机号。Kimi 看过初稿，指出“灰色为已满，其余可直接预约”重复了时段状态。按实际表单逐项核对后，删除了联系人、手机号、时长及相关校验，并在标题保留“今晚”。复核版可用键盘完成二号室 20:00 的本页模拟确认，覆盖 390 和 1440 像素宽度。[复核后的窄屏页面](examples/comparison/booking-reviewed.png)
