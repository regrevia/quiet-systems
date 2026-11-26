const collection = [
  { name: '蓝布票据册', year: '1956', note: '收录十二张票据。' },
  { name: '木柄裁纸刀', year: '1978', note: '曾用于裁切封套。' }
]

const records = document.querySelector('#records')
const detail = document.querySelector('#detail')
const title = detail.querySelector('h2')
const year = detail.querySelector('time')
const note = detail.querySelector('p')
const isDialog = detail.tagName === 'DIALOG'
let origin

for (const record of collection) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = record.name
  if (isDialog) {
    const yearLabel = document.createElement('span')
    yearLabel.textContent = record.year
    button.append(yearLabel)
  }
  button.addEventListener('click', () => {
    origin = button
    title.textContent = record.name
    year.textContent = record.year
    note.textContent = record.note
    if (isDialog) detail.showModal()
    else {
      records.hidden = true
      detail.hidden = false
      title.focus()
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
