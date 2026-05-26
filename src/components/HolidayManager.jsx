import { useState } from 'react'
import { toISO } from '../utils/workingDays'
import { NATIONAL_HOLIDAYS } from '../utils/nationalHolidays'

const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS_ABBR[parseInt(m, 10) - 1]} ${y}`
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function HolidayManager({ holidays, addHoliday, deleteHoliday }) {
  const [date, setDate]           = useState(toISO(new Date()))
  const [label, setLabel]         = useState('')
  const [error, setError]         = useState('')
  const [closedMonths, setClosedMonths] = useState(new Set())

  async function handleAdd(e) {
    e.preventDefault()
    const trimmed = label.trim()
    if (!date || !trimmed) { setError('Enter both a date and a name.'); return }
    if (trimmed.length > 100) { setError('Name must be 100 characters or fewer.'); return }
    if (isNaN(new Date(date).getTime())) { setError('Invalid date.'); return }
    setError('')
    await addHoliday(date, trimmed)
    setLabel('')
  }

  function toggleMonth(key) {
    setClosedMonths(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Sort descending, then group by YYYY-MM (groups are also in descending order)
  const sortedDesc = [...holidays].sort((a, b) => b.date.localeCompare(a.date))
  const groups = []
  const groupMap = {}
  for (const h of sortedDesc) {
    const key = h.date.slice(0, 7)
    if (!groupMap[key]) {
      const [y, m] = key.split('-')
      const obj = { key, label: `${MONTHS_FULL[parseInt(m, 10) - 1]} ${y}`, items: [] }
      groupMap[key] = obj
      groups.push(obj)
    }
    groupMap[key].items.push(h)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Holidays</h2>

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500"
        />
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Holiday name (e.g. Diwali)"
          className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-400"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-medium transition-colors"
        >
          Add Holiday
        </button>
      </form>

      {/* Static national holidays */}
      <div className="flex flex-col gap-2">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">National Holidays</p>
        <ul className="flex flex-col gap-2">
          {NATIONAL_HOLIDAYS.map(h => (
            <li key={h.label} className="bg-orange-50 dark:bg-orange-950 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-orange-800 dark:text-orange-200 text-sm font-medium">{h.label}</p>
                <p className="text-orange-500 dark:text-orange-400 text-xs">{MONTHS_ABBR[h.month - 1]} {h.day} · Every year</p>
              </div>
              <span className="text-orange-400 dark:text-orange-500 text-[10px] font-medium bg-orange-100 dark:bg-orange-900 px-2 py-0.5 rounded-full">National</span>
            </li>
          ))}
        </ul>
      </div>

      {/* User-added holidays — grouped by month, accordion */}
      <div className="flex flex-col gap-2">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Your Holidays</p>
        {groups.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-500 text-sm text-center py-4">No holidays added yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {groups.map(group => {
              const isOpen = !closedMonths.has(group.key)
              return (
                <div key={group.key} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => toggleMonth(group.key)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-gray-100 text-sm font-semibold">{group.label}</span>
                      <span className="text-gray-600 dark:text-gray-300 text-[11px] bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                        {group.items.length}
                      </span>
                    </div>
                    <span className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                      <ChevronDown />
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="border-t border-gray-100 dark:border-gray-700">
                      {group.items.map((h, idx) => (
                        <li
                          key={h.id}
                          className={`flex items-center justify-between px-4 py-3 ${
                            idx < group.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                          }`}
                        >
                          <div>
                            <p className="text-gray-900 dark:text-white text-sm font-medium">{h.label}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">{formatDate(h.date)}</p>
                          </div>
                          <button
                            onClick={() => deleteHoliday(h.id)}
                            className="text-red-400 hover:text-red-300 text-lg leading-none px-1 ml-2 shrink-0"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
