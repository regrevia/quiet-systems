export function Dashboard() {
  return (
    <section className="backdrop-blur">
      <SparklesIcon />
      <h1>工作室总览</h1>
      <h2>今日排期</h2>
      <p>全新体验：无缝协作，为你打造</p>
      <p>温馨提示：请检查网络后再提交</p>
      <p>内容由 AI 生成，仅供参考</p>
      <p>敬请期待更多功能</p>
      <p>这条流程必须打穿闭环</p>
      <p>QBR 结论已同步</p>
      <p>不止于工具</p>
      <p>一键洞察，智能治理全链路</p>
      <p>已完成 · 刚刚</p>
      <p>草稿 | 已发布</p>
      <img src="cover.png" />
      <button>
        <svg viewBox="0 0 24 24"></svg>
      </button>
      <button aria-hidden="true">保存</button>
      <small>说明</small>
      <svg icon width="18" height="18"></svg>
      <div style={{ color: 'red' }}></div>
      <span className="badge">#ff00aa</span>
      <p>{demoData.title}</p>
      <p>这是一段明显过长的说明文字，它在首屏占据了整块版面，把本来一句话能说完的当前状态、可用时段和下一步动作压成了一大段连续叙述，读者必须先读完才能知道今晚还有没有空房间，而这正是首屏最应该直接回答的问题。继续补充：预约改期需要先回到列表，确认身份后重新选择时段，系统会在提交前再核对一次冲突，请留意页面提示并按提示操作，不要重复提交。</p>
    </section>
  )
}
