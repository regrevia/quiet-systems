## Benchmark review

这份对照用于判断页面是否真的建立了层级，不用于复制某个平台的像素值或主题。

### Apple

- [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles/) 把重点放在 purpose、agency、familiarity、simplicity 和 craft。它要求界面直接把人带到任务，减少不必要内容，保持熟悉的结构，并对细节持续打磨。
- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) 强调对齐和缩进本身就是层级。层级不能只依赖边框、背景色或标题。
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) 要求用字号、字重和颜色表达优先级，保持少量文字层级，并在不同字号下维持相对关系。
- [Writing for interfaces](https://developer.apple.com/videos/play/wwdc2022/10037/) 把文字当作设计的一部分，要求 purpose、anticipation、context 和 empathy。少文字不等于删除所有有用信息。

苹果界面的可复用特征是内容先于容器，标题与当前任务对齐，辅助信息退后，系统控件承担熟悉的操作语义，空白服务于阅读和操作。

### Linear

- [A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh) 明确提出不要让未赢得注意力的元素竞争注意力。导航变暗，主内容获得优先级，顶部标签变得更紧凑。
- 同一篇文章强调 structure should be felt not seen。Linear 删除了没有明确理由的边框和分隔线，并通过更柔和的边界和间距保留结构。
- Linear 还主动减少图标数量和尺寸，移除没有语义价值的彩色图标背景。图标优先不等于图标泛滥。
- Linear 的默认界面持续围绕对象、状态、筛选和下一步动作组织。辅助设置和低频动作通过菜单或命令面板逐步展开。

Linear 的可复用特征是密度可控、导航退后、动作位置稳定、结构通过对齐和节奏被感知。

### Current prototype gap

`multiverse-inspector-quiet.html` 已经去掉了多余面板和逐行分割线，但仍暴露出四个问题。

1. 页面标题、选中导航和内容对象仍然共享“运行记录”这个词，作用域重复。
2. 三条记录被横向拉开，日期、状态、耗时和操作之间的距离大于它们之间的语义关系。
3. 左侧导航仍然占据稳定视觉位置，却没有足够的上下文价值来证明自己需要一直出现。
4. 页面把“少文字”处理成了空白，尚未通过排版、对齐和记录密度建立一个明确的阅读焦点。

### Skill changes derived from the comparison

- 先确定 scope owner。产品导航、页面标题、内容标题和对象名称不能重复承担同一个命名任务。
- 为主任务定义一个 reading edge。所有对象名称、状态和下一步动作优先围绕这条边对齐。
- 对列表做关系密度检查。相关字段之间的间距必须小于不相关区域之间的间距。宽屏不能用平均分布制造“高级感”。
- 侧栏必须证明自己的持续价值。若只提供当前页的几个标签，优先改成紧凑标签、工具栏或可折叠导航。
- 删除文字后要重排结构。不能把副标题删掉，却保留原来的空白、列宽和标题层级。
- 图标有语义才出现。熟悉的高频动作可用图标，状态和陌生动作必须保留可读标签或邻近解释。
- 状态标签不默认使用胶囊。先用文字、位置、字重和轻量标记建立状态关系，只有交互选择或明确分组需要时才使用填充和圆角。
- 用两次审阅判断结果。第一次看任务是否可完成，第二次只看视觉焦点、关系密度、作用域重复和细节完成度。
