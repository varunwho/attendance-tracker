import { useState, useEffect } from 'react'

const STORAGE_KEY = 'attendance_settings'

const DEFAULTS = {
  period: 'monthly',   // weekly | monthly | quarterly | yearly
  type: 'percentage',  // percentage | days
  value: 50,
  theme: 'dark',       // dark | light
  quarterStart: 0,     // 0 = January … 11 = December (month Q1 begins)
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
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
