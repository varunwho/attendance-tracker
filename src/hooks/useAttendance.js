import { useState, useEffect, useCallback } from 'react'
import { db } from '../db'
import { toISO, getWeekBounds, getMonthBounds, getQuarterBounds, getYearBounds } from '../utils/workingDays'
import { NATIONAL_HOLIDAYS } from '../utils/nationalHolidays'

// Expand static national holidays into YYYY-MM-DD dates for a range of years
// (current year ± 2 covers any reasonable calendar navigation)
function getNationalHolidayDates() {
  const year = new Date().getFullYear()
  const dates = []
  for (let y = year - 2; y <= year + 2; y++) {
    for (const { month, day } of NATIONAL_HOLIDAYS) {
      dates.push(`${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    }
  }
  return dates
}

const NATIONAL_DATES = getNationalHolidayDates()

function useTable(fetcher) {
  const [data, setData] = useState([])

  const refresh = useCallback(() => {
    fetcher().then(setData).catch(() => {})
  }, [fetcher])

  useEffect(() => { refresh() }, [refresh])

  return [data, refresh]
}

export function useAttendance(quarterStart = 0) {
  const [records, refreshRecords] = useTable(
    useCallback(() => db.attendance.toArray(), [])
  )
  const [holidays, refreshHolidays] = useTable(
    useCallback(() => db.holidays.toArray(), [])
  )

  // On launch: purge any national holidays that were previously stored in DB
  useEffect(() => {
    async function purgeStoredNationals() {
      const all = await db.holidays.toArray()
      const toDelete = all
        .filter(h => {
          const [, mm, dd] = h.date.split('-')
          return NATIONAL_HOLIDAYS.some(
            n => String(n.month).padStart(2, '0') === mm && String(n.day).padStart(2, '0') === dd
          )
        })
        .map(h => h.id)
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map(id => db.holidays.delete(id)))
        refreshHolidays()
      }
    }
    purgeStoredNationals()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const attendanceMap  = Object.fromEntries(records.map(r => [r.date, r.status]))
  // Combine user-added holidays with the static national holiday dates
  const holidayDates   = [...new Set([...holidays.map(h => h.date), ...NATIONAL_DATES])]

  async function markDay(date, status) {
    const iso = typeof date === 'string' ? date : toISO(date)
    if (!status) {
      await db.attendance.delete(iso)
    } else {
      await db.attendance.put({ date: iso, status })
    }
    refreshRecords()
  }

  async function addHoliday(date, label) {
    const iso = typeof date === 'string' ? date : toISO(date)
    await db.holidays.add({ date: iso, label })
    refreshHolidays()
  }

  async function deleteHoliday(id) {
    await db.holidays.delete(id)
    refreshHolidays()
  }

  function getPeriodBounds(period) {
    const today = new Date()
    return {
      weekly:    getWeekBounds(today),
      monthly:   getMonthBounds(today),
      quarterly: getQuarterBounds(today, quarterStart),
      yearly:    getYearBounds(today),
    }[period]
  }

  async function clearPeriod(period) {
    const bounds = getPeriodBounds(period)
    if (!bounds) return
    const start = toISO(bounds.start)
    const end   = toISO(bounds.end)
    const all = await db.attendance.toArray()
    const toDelete = all.filter(r => r.date >= start && r.date <= end).map(r => r.date)
    await Promise.all(toDelete.map(date => db.attendance.delete(date)))
    refreshRecords()
  }

  async function clearHolidaysPeriod(period) {
    const bounds = getPeriodBounds(period)
    if (!bounds) return
    const start = toISO(bounds.start)
    const end   = toISO(bounds.end)
    const all = await db.holidays.toArray()
    const toDelete = all.filter(h => h.date >= start && h.date <= end).map(h => h.id)
    await Promise.all(toDelete.map(id => db.holidays.delete(id)))
    refreshHolidays()
  }

  async function resetAll() {
    await db.attendance.clear()
    await db.holidays.clear()
    refreshRecords()
    refreshHolidays()
  }

  return { attendanceMap, holidays, holidayDates, markDay, addHoliday, deleteHoliday, clearPeriod, clearHolidaysPeriod, resetAll }
}
