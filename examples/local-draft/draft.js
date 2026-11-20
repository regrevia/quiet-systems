const field = document.querySelector('#draft')
const error = document.querySelector('#error')
const status = document.querySelector('#status')
const storageKey = 'quiet-systems:example:interview-note'
try {
  field.value = localStorage.getItem(storageKey) ?? ''
} catch {
  field.readOnly = true
  document.querySelector('button').disabled = true
  error.textContent = '无法读取已存笔记。请刷新后重试。'
}

field.addEventListener('input', () => {
  status.textContent = ''
})

document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault()
  if (field.readOnly) return
  status.textContent = ''
  try {
    localStorage.setItem(storageKey, field.value)
  } catch {
    error.textContent = '未能保存。请保留当前页面后重试。'
    return
  }
  error.textContent = ''
  status.textContent = '已保存到此设备'
})
