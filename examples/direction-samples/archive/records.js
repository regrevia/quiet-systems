const collection = [
  { name: '蓝布票据册', year: '1956', note: '收录十二张票据。' },
  { name: '木柄裁纸刀', year: '1978', note: '曾用于裁切封套。' }
]

const records = document.querySelector('#records')
const detail = document.querySelector('#detail')
const isDialog = detail.tagName === 'DIALOG'
let origin

for (const record of collection) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = record.name
  if (isDialog) {
    const year = document.createElement('span')
    year.textContent = record.year
    button.append(year)
  }
  button.addEventListener('click', () => {
    origin = button
    detail.querySelector('h2').textContent = record.name
    detail.querySelector('time').textContent = record.year
    detail.querySelector('p').textContent = record.note
    if (isDialog) detail.showModal()
    else {
      records.hidden = true
      detail.hidden = false
      detail.querySelector('h2').focus()
    }
  })
  records.append(button)
}

detail.querySelector('button').addEventListener('click', () => {
  if (isDialog) detail.close()
  else {
    detail.hidden = true
    records.hidden = false
    origin.focus()
  }
})
