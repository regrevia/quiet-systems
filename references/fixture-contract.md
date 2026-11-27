# Fixture 与状态契约

这些是 fixture 字段与源码标记的完整契约，日常使用只需要 examples/fixtures 目录和一条校验命令。

## fixture 目录

`examples/direction-samples/README.md` 规定需求不明确时如何制作多个低成本方向。`examples/fixtures/` 提供长文本、空状态和权限受限的 production-shaped fixture，`scripts/validate-fixtures.mjs` 检查状态名、来源标记和关键字段是否满足边界契约。脚本不传目录时默认扫描它所在仓库的 `examples/fixtures`。`review-template.md` 用于记录信息层级、数据映射和验证证据。

## 状态边界

loading 和 offline 保留 `items: null` 或数组的选择，用于表达尚未有缓存和已有缓存两种情况，脚本的通用 `items` 类型检查会覆盖这两个状态。partial-failure 要求至少有一项可见结果和一项 `failedItems`，每项 `failedItems` 必须提供 `id`、`reason` 和 `retryable`，零可见结果应转为 error 或 permission 状态。

offline 可以没有缓存数据，界面仍应保留“离线且暂无缓存”和“查询结果为空”的语义差异。

error fixture 的最小契约是 `code` 和 `retryable`，面向用户的具体错误文案由视图层根据对象和下一步动作生成。

## adapter 与视图状态

`examples/production-adapter.ts` 提供两个入口。原型通过 `adaptDemoPayload` 读取有标记的 fixture，产品通过 `adaptProductionPayload` 读取接口数据，遇到 fixture 标记即报错。浏览器和服务端使用同一判断。

`examples/view-state-contract.ts` 展示如何用判别联合约束 loading、ready、empty、error、offline、partial、permission 和 recovered 状态，并从同一状态来源推导可见数据和恢复动作。

`examples/production-adapter.ts` 使用接口层的 `partial-failure`、`permission-limited` 和 `lastKnownUpdatedAt` 字段承载后端语义。fixture 和 adapter 使用的是传输层状态名，接入视图层时应在适配边界映射为 `partial`、`permission` 和 `lastUpdatedAt`，避免把传输字段误当成组件状态名。

## 示例文件

`examples/linear-patterns.ts` 展示工作区默认视图、个人偏好和选中对象动作的分离。`examples/motion-tokens.css` 展示短时、克制的状态动效，以及 `prefers-reduced-motion` 的降级路径。`examples/icon-tiers.ts` 展示跨平台的图标光学尺寸层级。

## 源码标记

原生控件经过统一外观适配后，可以用 `data-quiet-adapted` 或 `quiet-systems: allow-native` 标记并保留人工复核证据。

CSS 动效如果已经通过人工设备和辅助技术验证，可以在文件中留下 `/* quiet-systems: motion-adapted */` 标记，保留验证责任并避免重复误报。

超过 400ms 的 CSS 动效如果确实服务于连续任务或状态叙事，可以留下 `/* quiet-systems: motion-duration-reviewed */` 标记，并在审阅报告中写出验证证据。
