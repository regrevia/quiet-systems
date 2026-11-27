# UI Guard

面向前端与原型的设计流程 Skill：先定任务、对象和数据状态，再定视觉。参考 Apple/macOS 与 Linear 的层级、任务流和状态原则，帮 Web、桌面端和 App 删掉多余文字、装饰和 AI Slop。

改一句话就能看出差别：

```diff
- <p>全新体验：无缝协作，为你打造</p>
- <p>一键洞察，智能治理全链路</p>
+ <p>把本周未回复的 12 条询价抄进跟进表</p>
- <button><SparklesIcon /></button>
+ <button aria-label="生成摘要"><SparklesIcon /></button>
```

同样的差别也体现在布局上：点缀用的胶囊、重复标题和解释性小字删掉之后，主工作面才是首屏唯一焦点。反面样例在 [`examples/bad-sample/`](examples/bad-sample/)，运行下面的命令能看到它被逐条点名。

最快一条命令（Node.js ≥ 24，无依赖）：

```bash
node scripts/ui-guard-review.mjs path/to/ui
```

有发现时退出码 `1`，干净时 `0`，扫描没跑完（读取失败、根目录不存在、配置无效）是 `2`。

日常任务从短版 [SKILL.md](SKILL.md) 进入。需要研究设计取舍时，再读 [Apple、Linear 与竞品实现对照](references/design-sources.md)。效果怎么衡量、同题实测与受控比较记录在 [评估与实测记录](docs/evaluation.md)。

## 安装

项目内使用 npm 包可运行 `npm install --save-dev @regrevia/ui-guard`。提示词位于 `node_modules/@regrevia/ui-guard/SKILL.md`，从项目根目录运行 `npx ui-guard-review --json .` 即可扫描。要让 agent 自动发现 skill，可用下方安装方式。

### Codex

```bash
git clone https://github.com/regrevia/ui-guard.git ~/.codex/skills/ui-guard
```

### Claude Code

```bash
git clone https://github.com/regrevia/ui-guard.git ~/.claude/skills/ui-guard
```

安装后，在设计、重构、评审 Web 或 App 页面时使用 `ui-guard`。从产品仓库运行已安装的检查器，例如：

```bash
SKILL_HOME="$HOME/.codex/skills/ui-guard"
node "$SKILL_HOME/scripts/ui-guard-review.mjs" --json .
node "$SKILL_HOME/scripts/validate-design-brief.mjs" design-brief.json
node "$SKILL_HOME/scripts/validate-interaction-inventory.mjs" interaction-inventory.json
```

Claude Code 安装使用 `$HOME/.claude/skills/ui-guard`。脚本本身不读环境变量，`SKILL_HOME` 只是安装路径的占位。以下维护命令从 skill 仓库根目录执行。完整自测可使用 Node.js 24 运行 `node --test scripts/*.test.mjs`。

## 命名与兼容

仓库和 npm 包名带 `quiet-systems` 的历史痕迹，当前入口统一叫 `ui-guard`。四个 bin 都可用：`ui-guard-review`、`ui-guard-brief`、`ui-guard-inventory`、`quiet-systems-review`（旧名，转发到同一个脚本）。

配置文件先找 `.ui-guard.json`，再找 `.quiet-systems.json`，先找到先用；两者都在时只有前者生效。代码里的适配标记两个方向都认：`data-ui-guard-adapted` 与 `data-quiet-adapted`，`ui-guard: allow-native` 与 `quiet-systems: allow-native`，抑制前缀同理。

和 `no-more-slop` 的分工：`no-more-slop` 只管中文微文案这一个小口子；UI Guard 管整条界面契约——层级、控件语法、图标、动效、8 种状态、真实数据接入和交付闸门，文案是其中一层。两个都装时，文案结论以 `no-more-slop` 为准，其余以 UI Guard 为准。

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
- 静态 UI 审阅脚本：28 条规则覆盖装饰性分隔符、绕过 Token 的原生控件、写死图标尺寸、缺失 reduced-motion、装饰性 AI Slop、泛化营销文案与压缩能力词、防御性与免责声明文案、图片替代文本、图标控件可访问名称、隐藏交互元素、原型数据进生产源
- 方向样板说明、production-shaped fixture、UI 审阅报告模板、外部审阅器只读输出契约、CI 与配置模板

## 设计立场

高级感来自秩序、留白、准确的文字和可靠的状态反馈。玻璃、渐变、发光、抽象 AI 图形、重复卡片和营销副标题都需要有明确任务价值，否则应被删除。

Apple 的理念用于提炼方法，不复制 Apple 的品牌资产、SF Symbols 文件或专有界面。

## 使用方式

这个 skill 不规定固定的配色、字体、圆角或材质。它要求先确定任务、对象、数据和状态，再通过线框、多个低成本方向和真实数据样例收敛视觉方案。高保真原型必须经过真实数据、权限、加载、失败和恢复状态验证，静态演示不能代替接入验收。

静态审阅脚本：

```bash
node scripts/ui-guard-review.mjs path/to/ui
node scripts/ui-guard-review.mjs --json path/to/ui
node scripts/ui-guard-review.mjs --include-markdown path/to/ui
node scripts/ui-guard-review.mjs --write-baseline ui-guard-baseline.json path/to/ui
node scripts/ui-guard-review.mjs --baseline ui-guard-baseline.json path/to/ui
node --test scripts/*.test.mjs
node scripts/validate-fixtures.mjs examples/fixtures
node scripts/validate-review-report.mjs --strict path/to/review.md
```

配置放在 `.ui-guard.json`：忽略目录与规则、文案预算（可分窄屏/宽屏）、最大文件大小、`treatAsProduction` 反面样例白名单。`examples/configs/` 有 Tailwind 与 CSS 变量两份模板。忽略规则按配置目录和扫描根分别匹配，从不同工作目录运行都成立。超过大小上限的文件进 JSON 报告的 `skipped`。选项写错、或 `--baseline` 后面没跟路径，会以退出码 2 报出这个名字，不会当作没写而放过整个目录；`--help` 打印用法后退出 0。脚本只做固定代码检查，不能替代浏览器、键盘、读屏、真机和真实数据验证。

接进 PR 见 [`examples/ci/ui-guard.yml`](examples/ci/ui-guard.yml)；审阅自己有发现的仓库时用 `--baseline` 冻结存量，只让新增发现挡住合入。

`examples/direction-samples/README.md` 规定需求不明确时如何制作多个低成本方向。`examples/fixtures/` 提供长文本、空状态和权限受限的 production-shaped fixture。`review-template.md` 记录信息层级、数据映射和验证证据。`reviewer-contract.md` 为 Claude Code、Kimi 和 MiniMax 提供统一的只读审阅提示、P0/P1/P2 分级、证据要求和未验证项格式；审阅器不能修改工作区，也不能把截图美感当成真实数据或交互证据。

契约细节按需读：[Fixture 与状态契约](references/fixture-contract.md)、[审阅报告校验](references/report-validation.md)、[交付流程](references/delivery.md)。

`examples/production-adapter.ts` 提供两个入口：原型通过 `adaptDemoPayload` 读取有标记的 fixture，产品通过 `adaptProductionPayload` 读取接口数据，遇到 fixture 标记即报错。`examples/view-state-contract.ts` 用判别联合约束 loading、ready、empty、error、offline、partial、permission 和 recovered 八种状态，并从同一来源推导可见数据和恢复动作。`examples/linear-patterns.ts`、`examples/motion-tokens.css`、`examples/icon-tiers.ts` 分别是视图与偏好分离、克制动效与 reduced-motion 降级、跨平台图标光学尺寸。

## 参考

- [Apple Human Interface Guidelines: Icons](https://developer.apple.com/design/human-interface-guidelines/icons)
- [Apple Human Interface Guidelines: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Apple Human Interface Guidelines: Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- [Apple SF Symbols](https://developer.apple.com/sf-symbols/)
