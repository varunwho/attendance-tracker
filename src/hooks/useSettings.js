import { useState, useEffect } from 'react'

const STORAGE_KEY = 'attendance_settings'

const DEFAULTS = {
  period: 'monthly',   // weekly | monthly | quarterly | yearly
  type: 'percentage',  // percentage | days
  value: 50,
  theme: 'dark',       // dark | light
  quarterStart: 0,     // 0 = January … 11 = December (month Q1 begins)
}

const VALID_PERIODS       = new Set(['weekly', 'monthly', 'quarterly', 'yearly'])
const VALID_TYPES         = new Set(['percentage', 'days'])
const VALID_THEMES        = new Set(['dark', 'light'])

function sanitize(raw) {
  return {
    period:       VALID_PERIODS.has(raw.period)           ? raw.period       : DEFAULTS.period,
    type:         VALID_TYPES.has(raw.type)               ? raw.type         : DEFAULTS.type,
    value:        Number.isFinite(raw.value) && raw.value >= 1 && raw.value <= 365
                    ? raw.value : DEFAULTS.value,
    theme:        VALID_THEMES.has(raw.theme)             ? raw.theme        : DEFAULTS.theme,
    quarterStart: Number.isInteger(raw.quarterStart) && raw.quarterStart >= 0 && raw.quarterStart <= 11
                    ? raw.quarterStart : DEFAULTS.quarterStart,
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return sanitize({ ...DEFAULTS, ...JSON.parse(raw) })
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return { ...DEFAULTS }
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
  }, [settings])

  // Apply theme on first mount too
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
  }, [])

  function update(patch) {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  function reset() {
    setSettings({ ...DEFAULTS })
  }

  return { settings, update, reset }
}
