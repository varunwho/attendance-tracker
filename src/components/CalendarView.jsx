import { useState, useRef, useEffect, useCallback } from 'react'
import { toISO, getWorkingDays } from '../utils/workingDays'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Parse YYYY-MM-DD as local date to avoid UTC-offset day-of-week errors
function isoDow(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export default function CalendarView({ attendanceMap, holidayDates, markDays, addHolidays, settings }) {
  const today = new Date()
  const [viewDate, setViewDate]     = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected]     = useState(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [holLabel, setHolLabel]     = useState('PTO')       // label input when marking as holiday
  const [holStep, setHolStep]       = useState(false)       // true = show label input step
  const dragging      = useRef(false)
  const holidaySetRef = useRef(new Set(holidayDates))
  const labelInputRef = useRef(null)

  const year       = viewDate.getFullYear()
  const month      = viewDate.getMonth()
  const todayISO   = toISO(today)
  const holidaySet = new Set(holidayDates)
  holidaySetRef.current = holidaySet

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const endDrag = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    setIsDragging(false)
  }, [])

  useEffect(() => {
    window.addEventListener('pointerup', endDrag)
    return () => window.removeEventListener('pointerup', endDrag)
  }, [endDrag])

  // Focus label input when holiday step opens
  useEffect(() => {
    if (holStep) setTimeout(() => labelInputRef.current?.focus(), 50)
  }, [holStep])

  function handlePointerDown(iso, dow, e) {
    if (dow === 0 || dow === 6) return
    e.preventDefault()
    dragging.current = true
    setIsDragging(true)
    setHolStep(false)
    setSelected(new Set([iso]))
  }

  function handlePointerMove(e) {
    if (!dragging.current) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const el  = document.elementFromPoint(clientX, clientY)
    const iso = el?.closest('[data-iso]')?.dataset?.iso
    if (!iso) return
    const dow = isoDow(iso)
    if (dow === 0 || dow === 6) return
    setSelected(prev => {
      if (prev.has(iso)) return prev
      const next = new Set(prev)
      next.add(iso)
      return next
    })
  }

  async function applyMode(mode) {
    const entries = [...selected]
      .filter(iso => {
        const dow = isoDow(iso)
        return dow !== 0 && dow !== 6 && !holidaySetRef.current.has(iso)
      })
      .map(iso => ({ date: iso, status: mode === 'clear' ? null : mode }))
    if (entries.length) await markDays(entries)
    setSelected(new Set())
    setHolStep(false)
  }

  async function applyHoliday() {
    const label = holLabel.trim() || 'PTO'
    const validIsos = [...selected].filter(iso => {
      const dow = isoDow(iso)
      return dow !== 0 && dow !== 6 && !holidaySetRef.current.has(iso)
    })
    if (validIsos.length) {
      await addHolidays(validIsos, label)
      await markDays(validIsos.map(date => ({ date, status: null })))
    }
    setSelected(new Set())
    setHolStep(false)
    setHolLabel('PTO')
  }

  function cancelSelection() { setSelected(new Set()); setHolStep(false) }
  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); setSelected(new Set()); setHolStep(false) }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); setSelected(new Set()); setHolStep(false) }

  // Non-holiday selected count (for hint text)
  const nonHolSelected = [...selected].filter(iso => {
    const dow = isoDow(iso)
    return !holidaySet.has(iso) && dow !== 0 && dow !== 6
  })

  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date       = new Date(year, month, d)
    const iso        = toISO(date)
    const dow        = date.getDay()
    const isToday    = iso === todayISO
    const isWeekend  = dow === 0 || dow === 6
    const isHoliday  = holidaySet.has(iso)
    const isSelected = selected.has(iso)
    const status     = attendanceMap[iso]

    let bgText = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    if (isWeekend) {
      bgText = 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
    } else if (isHoliday) {
      bgText = isSelected
        ? 'bg-orange-300 dark:bg-orange-700 text-orange-800 dark:text-orange-100'
        : 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300'
    } else if (isSelected) {
      bgText = holStep
        ? 'bg-purple-500 text-white'
        : 'bg-blue-500 text-white'
    } else if (status === 'present') {
      bgText = 'bg-green-600 dark:bg-green-700 text-white dark:text-green-100'
    } else if (status === 'absent') {
      bgText = 'bg-red-600 dark:bg-red-800 text-white dark:text-red-200'
    } else if (iso > todayISO) {
      bgText = 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
    }

    const ring = isSelected
      ? (isHoliday ? 'ring-2 ring-orange-400 opacity-80' : holStep ? 'ring-2 ring-purple-300' : 'ring-2 ring-blue-300')
      : isToday && !isHoliday
      ? 'ring-2 ring-blue-400'
      : ''

    cells.push(
      <div
        key={iso}
        data-iso={iso}
        onPointerDown={e => handlePointerDown(iso, dow, e)}
        className={`rounded-xl p-2 flex flex-col items-center text-xs font-medium select-none transition-colors ${bgText} ${ring} ${isWeekend || isHoliday ? '' : 'cursor-pointer'}`}
        style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
      >
        <span>{d}</span>
        {isHoliday                                          && <span className="text-[9px] mt-0.5">Hol</span>}
        {status === 'present' && !isSelected && !isHoliday && <span className="text-[9px] mt-0.5">✓</span>}
        {status === 'absent'  && !isSelected && !isHoliday && <span className="text-[9px] mt-0.5">✗</span>}
      </div>
    )
  }

  const hasSelection = selected.size > 0

  // Month summary
  const monthStart     = new Date(year, month, 1)
  const monthEnd       = new Date(year, month + 1, 0)
  const workingDays    = getWorkingDays(monthStart, monthEnd, holidayDates)
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const elapsedDays    = isCurrentMonth ? workingDays.filter(d => d <= todayISO) : workingDays
  const monthStartISO  = toISO(monthStart)
  const monthEndISO    = toISO(monthEnd)
  // Only count holidays that fall on weekdays — weekend holidays don't displace working days
  const holidayCount   = holidayDates.filter(d => {
    if (d < monthStartISO || d > monthEndISO) return false
    const dow = isoDow(d)
    return dow !== 0 && dow !== 6
  }).length
  const presentCount   = workingDays.filter(d => attendanceMap[d] === 'present').length
  const absentCount    = workingDays.filter(d => attendanceMap[d] === 'absent').length
  const unmarkedCount  = workingDays.filter(d => !attendanceMap[d]).length
  const elapsedPresent = elapsedDays.filter(d => attendanceMap[d] === 'present').length
  const pct            = elapsedDays.length ? (elapsedPresent / elapsedDays.length) * 100 : 0
  const { type, value: targetValue } = settings ?? {}
  const targetPct      = type === 'percentage' ? targetValue : 50
  const onTrack        = pct >= targetPct

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 text-xl">‹</button>
        <h2 className="text-gray-900 dark:text-white font-semibold text-lg">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 text-xl">›</button>
      </div>

      <p className="text-gray-500 dark:text-gray-500 text-xs text-center">
        {isDragging
          ? `Selecting… ${selected.size} day${selected.size !== 1 ? 's' : ''}`
          : holStep
          ? `Enter a label for ${nonHolSelected.length} day${nonHolSelected.length !== 1 ? 's' : ''}`
          : hasSelection
          ? `${nonHolSelected.length} day${nonHolSelected.length !== 1 ? 's' : ''} selected — choose action below`
          : 'Tap or slide to select days'}
      </p>

      <div
        className="grid grid-cols-7 gap-1 text-center"
        onPointerMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        style={{ touchAction: 'none' }}
      >
        {DAYS.map(d => (
          <div key={d} className="text-gray-400 dark:text-gray-500 text-xs font-medium py-1">{d}</div>
        ))}
        {cells}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-600 dark:bg-green-700 inline-block" /> Present</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600 dark:bg-red-800 inline-block" /> Absent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-200 dark:bg-orange-800 inline-block" /> Holiday / PTO</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700 inline-block" /> Weekend</span>
      </div>

      {/* Month summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-gray-900 dark:text-white text-sm font-semibold">{MONTHS[month]} {year} Summary</p>
          <span className={`text-sm font-bold ${onTrack ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {pct.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all ${onTrack ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: 'Working',  value: workingDays.length, color: 'text-gray-900 dark:text-white' },
            { label: 'Present',  value: presentCount,       color: 'text-green-600 dark:text-green-400' },
            { label: 'Absent',   value: absentCount,        color: 'text-red-600 dark:text-red-400' },
            { label: 'Holiday',  value: holidayCount,       color: 'text-orange-500 dark:text-orange-400' },
            { label: 'Unmarked', value: unmarkedCount,      color: 'text-yellow-600 dark:text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-400 dark:text-gray-500 text-[10px]">{label}</p>
            </div>
          ))}
        </div>
        {!isCurrentMonth && absentCount === 0 && unmarkedCount > 0 && (
          <p className="text-yellow-600 dark:text-yellow-400 text-xs">
            {unmarkedCount} day{unmarkedCount !== 1 ? 's' : ''} not marked for this month
          </p>
        )}
      </div>

      {/* Action bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full px-4 transition-all duration-200 ${
          hasSelection && !isDragging ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {holStep ? (
          /* Step 2 — label input */
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 flex flex-col gap-2 shadow-xl">
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Marking {nonHolSelected.length} day{nonHolSelected.length !== 1 ? 's' : ''} as holiday
            </p>
            <div className="flex gap-2">
              <input
                ref={labelInputRef}
                type="text"
                value={holLabel}
                onChange={e => setHolLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyHoliday()}
                placeholder="Label (e.g. PTO, Sick Leave)"
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              />
              <button
                onClick={applyHoliday}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 text-sm font-semibold transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setHolStep(false)}
                className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl px-3 text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          /* Step 1 — action buttons */
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 flex gap-2 shadow-xl">
            <button onClick={() => applyMode('present')} className="flex-1 bg-green-700 hover:bg-green-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors">Present</button>
            <button onClick={() => applyMode('absent')}  className="flex-1 bg-red-800 hover:bg-red-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors">Absent</button>
            <button onClick={() => applyMode('clear')}   className="flex-1 bg-gray-500 hover:bg-gray-400 text-white rounded-xl py-3 text-sm font-semibold transition-colors">Clear</button>
            <button onClick={() => setHolStep(true)}     className="flex-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-3 text-sm font-semibold transition-colors">Holiday</button>
            <button onClick={cancelSelection}            className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl px-3 text-sm transition-colors">✕</button>
          </div>
        )}
      </div>
    </div>
  )
}
