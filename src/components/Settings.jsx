import { useState, useEffect } from 'react'

const PERIODS = ['weekly', 'monthly', 'quarterly', 'yearly']
const PERIOD_LABELS = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }

export default function Settings({ settings, update }) {
  const { period, type, value, theme } = settings
  // Local string so the user can freely backspace / type without snapping
  const [inputVal, setInputVal] = useState(String(value))

  // Keep in sync if value changes externally (e.g. type toggle resets it)
  useEffect(() => { setInputVal(String(value)) }, [value])

  function handleChange(e) {
    setInputVal(e.target.value)   // allow empty / partial input freely
  }

  function handleBlur() {
    const max = type === 'percentage' ? 100 : 365
    const parsed = parseFloat(inputVal)
    const safe = isNaN(parsed) || parsed < 1 ? 1 : Math.min(parsed, max)
    update({ value: safe })
    setInputVal(String(safe))
  }

  function handleTypeToggle(newType) {
    if (newType === type) return
    update({ type: newType, value: newType === 'percentage' ? 50 : 10 })
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Settings</h2>

      {/* Appearance */}
      <section className="flex flex-col gap-3">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Appearance</p>
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-gray-900 dark:text-white text-sm font-medium">Dark Mode</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Switch between light and dark</p>
          </div>
          <button
            onClick={() => update({ theme: theme === 'dark' ? 'light' : 'dark' })}
            className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </section>

      {/* Policy */}
      <section className="flex flex-col gap-3">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Attendance Policy</p>

        {/* Period */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
          <p className="text-gray-900 dark:text-white text-sm font-medium">Tracking Period</p>
          <div className="grid grid-cols-2 gap-2">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => update({ period: p })}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Target type + value */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
          <p className="text-gray-900 dark:text-white text-sm font-medium">Target</p>

          {/* Type toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => handleTypeToggle('percentage')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === 'percentage'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Percentage (%)
            </button>
            <button
              onClick={() => handleTypeToggle('days')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === 'days'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Days
            </button>
          </div>

          {/* Value input */}
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={inputVal}
              onChange={handleChange}
              onBlur={handleBlur}
              min={1}
              max={type === 'percentage' ? 100 : 365}
              step={type === 'percentage' ? 5 : 1}
              inputMode="numeric"
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500 dark:text-gray-400 text-sm w-8">
              {type === 'percentage' ? '%' : 'days'}
            </span>
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-xs">
            {type === 'percentage'
              ? `Must attend at least ${value}% of working days in the ${period} period`
              : `Must attend at least ${value} days in the ${period} period`}
          </p>
        </div>
      </section>
    </div>
  )
}
