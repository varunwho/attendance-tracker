import Dexie from 'dexie'

export const db = new Dexie('AttendanceTracker')

db.version(1).stores({
  attendance: 'date, status', // date: 'YYYY-MM-DD', status: 'present' | 'absent'
  holidays: '++id, date, label',
})
