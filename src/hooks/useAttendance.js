import { useState, useEffect, useCallback } from 'react'
import { db } from '../db'
import { toISO } from '../utils/workingDays'

function useTable(fetcher) {
  const [data, setData] = useState([])

  const refresh = useCallback(() => {
    fetcher().then(setData).catch(console.error)
  }, [fetcher])

  useEffect(() => {
    refresh()
  }, [refresh])

  return [data, refresh]
}

export function useAttendance() {
  const [records, refreshRecords] = useTable(
    useCallback(() => db.attendance.toArray(), [])
  )
  const [holidays, refreshHolidays] = useTable(
    useCallback(() => db.holidays.toArray(), [])
  )

  const attendanceMap = Object.fromEntries(records.map(r => [r.date, r.status]))
  const holidayDates  = holidays.map(h => h.date)

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

  return { attendanceMap, holidays, holidayDates, markDay, addHoliday, deleteHoliday }
}
