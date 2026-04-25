import { useState, useEffect } from 'react'
import { getWeekBounds, getMonthBounds, getQuarterBounds, getYearBounds, toISO } from '../utils/workingDays'
import { subscribeInstallPrompt, triggerInstall, isIOSDevice, isStandalone } from '../utils/installPrompt'

function getPeriodBounds(period, quarterStart) {
  const today = new Date()
  return {
    weekly:    getWeekBounds(today),
    monthly:   getMonthBounds(today),
    quarterly: getQuarterBounds(today, quarterStart),
    yearly:    getYearBounds(today),
  }[period]
}

const PERIODS = ['weekly', 'monthly', 'quarterly', 'yearly']
const PERIOD_LABELS = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

function quarterDesc(quarterStart) {
  return Array.from({ length: 4 }, (_, i) => {
    const s = (quarterStart + i * 3) % 12
    const e = (quarterStart + i * 3 + 2) % 12
    return `${MONTH_ABBR[s]}–${MONTH_ABBR[e]}`
  }).join(' · ')
}

function getClearOptions(quarterStart) {
  return [
    { id: 'weekly',    label: 'This Week',    desc: 'Mon – Sun of the current week' },
    { id: 'monthly',   label: 'This Month',   desc: 'All days in the current month' },
    { id: 'quarterly', label: 'This Quarter', desc: quarterDesc(quarterStart) },
    { id: 'yearly',    label: 'This Year',    desc: 'All days in the current year' },
  ]
}

export default function Settings({ settings, update, clearPeriod, clearHolidaysPeriod, resetAll, resetSettings }) {
  const { period, type, value, theme, quarterStart = 0 } = settings
  const [inputVal, setInputVal]               = useState(String(value))
  const [confirmPeriod, setConfirm]           = useState(null)
  const [cleared, setCleared]                 = useState(null)
  const [confirmHol, setConfirmHol]           = useState(null)
  const [clearedHol, setClearedHol]           = useState(null)
  const [confirmReset, setConfirmReset]       = useState(false)
  const [resetDone, setResetDone]             = useState(false)
  const [installDeferred, setInstallDeferred] = useState(null)
  const [ios]                                 = useState(isIOSDevice)
  const [standalone]                          = useState(isStandalone)

  useEffect(() => { setInputVal(String(value)) }, [value])

  useEffect(() => {
    if (standalone || ios) return
    return subscribeInstallPrompt(setInstallDeferred)
  }, [standalone, ios])

  function handleChange(e) { setInputVal(e.target.value) }

  function handleBlur() {
    const max    = type === 'percentage' ? 100 : 365
    const parsed = parseFloat(inputVal)
    const safe   = isNaN(parsed) || parsed < 1 ? 1 : Math.min(parsed, max)
    update({ value: safe })
    setInputVal(String(safe))
  }

  function handleTypeToggle(newType) {
    if (newType === type) return
    update({ type: newType, value: newType === 'percentage' ? 50 : 10 })
  }

  async function handleClear(p) {
    await clearPeriod(p)
    setConfirm(null)
    setCleared(p)
    setTimeout(() => setCleared(null), 2500)
  }

  async function handleClearHol(p) {
    await clearHolidaysPeriod(p)
    setConfirmHol(null)
    setClearedHol(p)
    setTimeout(() => setClearedHol(null), 2500)
  }

  async function handleConfirmReset() {
    await resetAll()
    resetSettings()
    setConfirmReset(false)
    setResetDone(true)
  }

  async function handleInstall() {
    await triggerInstall()
    setInstallDeferred(null)
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
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
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Add to Home Screen — always shown unless already installed */}
        {!standalone && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-gray-900 dark:text-white text-sm font-medium">Add to Home Screen</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                {ios ? 'Open in Safari · Tap Share → Add to Home Screen'
                  : installDeferred ? 'Install as an app for quick offline access'
                  : 'Tap ⋮ in Chrome → Add to Home screen'}
              </p>
            </div>
            {ios ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0">
                <path d="M12 2v13M7 10l5 5 5-5" /><path d="M5 19h14" />
              </svg>
            ) : installDeferred ? (
              <button
                onClick={handleInstall}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                Install
              </button>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/>
                <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
                <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/>
              </svg>
            )}
          </div>
        )}
      </section>

      {/* Policy */}
      <section className="flex flex-col gap-3">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Attendance Policy</p>

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

        {period === 'quarterly' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
            <div>
              <p className="text-gray-900 dark:text-white text-sm font-medium">Quarter Start Month</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                Q1 begins in {MONTH_FULL[quarterStart]} — quarters run every 3 months from there
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MONTH_ABBR.map((abbr, i) => (
                <button
                  key={i}
                  onClick={() => update({ quarterStart: i })}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                    quarterStart === i
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {abbr}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
          <p className="text-gray-900 dark:text-white text-sm font-medium">Target</p>
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

      {/* Clear Data */}
      <section className="flex flex-col gap-3">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Clear Data</p>

        {/* Attendance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
          <p className="text-gray-900 dark:text-white text-sm font-medium">Attendance records</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
            Removes all present / absent markings for the selected period.
          </p>
          {getClearOptions(quarterStart).map(opt => (
            <div key={opt.id}>
              {confirmPeriod === opt.id ? (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
                  <p className="flex-1 text-red-700 dark:text-red-300 text-xs font-medium">
                    Delete attendance for {opt.label}?
                  </p>
                  <button onClick={() => handleClear(opt.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    Delete
                  </button>
                  <button onClick={() => setConfirm(null)} className="text-gray-500 dark:text-gray-400 text-xs px-2 py-1.5">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setConfirm(opt.id); setConfirmHol(null) }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="text-left">
                    <p className="text-gray-900 dark:text-white text-sm font-medium flex items-center gap-2">
                      {opt.label}
                      {cleared === opt.id && <span className="text-green-600 dark:text-green-400 text-xs font-normal">Cleared</span>}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">{opt.desc}</p>
                  </div>
                  <span className="text-red-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Clear</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Holidays */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
          <p className="text-gray-900 dark:text-white text-sm font-medium">Holidays</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
            Removes user-added holidays that fall within the selected period. National holidays are unaffected.
          </p>

          {getClearOptions(quarterStart).map(opt => (
            <div key={opt.id}>
              {confirmHol === opt.id ? (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
                  <p className="flex-1 text-red-700 dark:text-red-300 text-xs font-medium">
                    Delete holidays for {opt.label}?
                  </p>
                  <button onClick={() => handleClearHol(opt.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    Delete
                  </button>
                  <button onClick={() => setConfirmHol(null)} className="text-gray-500 dark:text-gray-400 text-xs px-2 py-1.5">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setConfirmHol(opt.id); setConfirm(null) }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="text-left">
                    <p className="text-gray-900 dark:text-white text-sm font-medium flex items-center gap-2">
                      {opt.label}
                      {clearedHol === opt.id && <span className="text-green-600 dark:text-green-400 text-xs font-normal">Cleared</span>}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">{opt.desc}</p>
                  </div>
                  <span className="text-red-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Clear</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Reset Everything */}
      <section className="flex flex-col gap-3">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Danger Zone</p>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm border border-red-200 dark:border-red-900">
          <div>
            <p className="text-gray-900 dark:text-white text-sm font-medium">Reset Everything</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              Deletes all attendance records and holidays, and resets all settings to defaults. This cannot be undone.
            </p>
          </div>
          {confirmReset ? (
            <div className="flex flex-col gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-3 py-3">
              <p className="text-red-700 dark:text-red-300 text-xs font-semibold">
                Are you sure? All data and settings will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => await handleConfirmReset()}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Yes, reset everything
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setConfirmReset(true); setConfirm(null); setConfirmHol(null) }}
              className="w-full bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
            >
              Reset Everything
            </button>
          )}
        </div>
      </section>

      {/* Reset success dialog */}
      {resetDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl w-full max-w-sm">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-center flex flex-col gap-1">
              <p className="text-gray-900 dark:text-white text-base font-semibold">All reset</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                All attendance records, holidays, and settings have been reset to defaults.
              </p>
            </div>
            <button
              onClick={() => setResetDone(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
