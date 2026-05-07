export const fmtVND = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v)

export const fmtVNDShort = (v) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B ₫`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M ₫`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K ₫`
  return `${v.toFixed(0)} ₫`
}

export const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}

export const daysLeft = (targetDate) => {
  if (!targetDate) return 0
  return Math.max(Math.floor((new Date(targetDate) - new Date()) / 86400000), 0)
}
