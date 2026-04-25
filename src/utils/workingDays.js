/**
 * Returns all working days (Mon–Fri, non-holiday) between start and end (inclusive).
 * @param {Date} start
 * @param {Date} end
 * @param {string[]} holidayDates - array of 'YYYY-MM-DD' strings
 * @returns {string[]} array of 'YYYY-MM-DD' working day strings
 */
export function getWorkingDays(start, end, holidayDates = []) {
  const holidaySet = new Set(holidayDates)
  const days = []
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)

  while (cursor <= endDate) {
    const dow = cursor.getDay()
    const iso = toISO(cursor)
    if (dow !== 0 && dow !== 6 && !holidaySet.has(iso)) {
      days.push(iso)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getMonthBounds(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end   = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { start, end }
}

export function getQuarterBounds(date, quarterStart = 0) {
  const year  = date.getFullYear()
  const month = date.getMonth()
  // How far into the fiscal year is this month?
  const monthOffset = ((month - quarterStart) % 12 + 12) % 12
  // Which quarter within the fiscal year (0–3)?
  const qIdx       = Math.floor(monthOffset / 3)
  // Calendar month where this quarter begins (may overflow → JS handles it)
  const qStartMonth = (quarterStart + qIdx * 3) % 12
  // If the quarter's start month is after the current month, it started last year
  const qStartYear  = qStartMonth > month ? year - 1 : year
  const start = new Date(qStartYear, qStartMonth, 1)
  const end   = new Date(qStartYear, qStartMonth + 3, 0) // day 0 = last day of prev month
  return { start, end }
}

export function getWeekBounds(date) {
  const d     = new Date(date)
  const dow   = d.getDay()                       // 0 = Sun
  const diff  = dow === 0 ? -6 : 1 - dow         // shift to Monday
  const start = new Date(d)
  start.setDate(d.getDate() + diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

export function getYearBounds(date) {
  const start = new Date(date.getFullYear(), 0, 1)
  const end   = new Date(date.getFullYear(), 11, 31)
  return { start, end }
}

/**
 * How many more days needed to reach targetPct%
 */
export function daysNeeded(presentSoFar, totalWorkingDays, targetPct = 50) {
  const needed = Math.ceil((targetPct / 100) * totalWorkingDays)
  return Math.max(0, needed - presentSoFar)
}
