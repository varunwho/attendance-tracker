import { useState } from 'react'
import { toISO } from '../utils/workingDays'
import { NATIONAL_HOLIDAYS } from '../utils/nationalHolidays'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS[parseInt(m, 10) - 1]} ${y}`
}

export default function HolidayManager({ holidays, addHoliday, deleteHoliday }) {
  const [date, setDate]   = useState(toISO(new Date()))
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')

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

  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date))

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
                <p className="text-orange-500 dark:text-orange-400 text-xs">{MONTHS[h.month - 1]} {h.day} · Every year</p>
              </div>
              <span className="text-orange-400 dark:text-orange-500 text-[10px] font-medium bg-orange-100 dark:bg-orange-900 px-2 py-0.5 rounded-full">National</span>
            </li>
          ))}
        </ul>
      </div>

      {/* User-added holidays */}
      <div className="flex flex-col gap-2">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Your Holidays</p>
        {sorted.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-500 text-sm text-center py-4">No holidays added yet</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map(h => (
            <li key={h.id} className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-gray-900 dark:text-white text-sm font-medium">{h.label}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">{formatDate(h.date)}</p>
              </div>
              <button
                onClick={() => deleteHoliday(h.id)}
                className="text-red-400 hover:text-red-300 text-lg leading-none px-1"
              >
                ×
              </button>
            </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
