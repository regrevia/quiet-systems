export function RoomPicker() {
  return (
    <form>
      <input type="text" placeholder="姓名" />
      <select>
        <option>一号室</option>
      </select>
      <button>查看详情</button>
      <button aria-label="删除房间"><TrashIcon /></button>
      <button>已连接</button>
      <h1>可预约房间</h1>
      <span>没有可用房间时这里没有任何提示</span>
    </form>
  )
}
