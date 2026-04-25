import { useState } from 'react'
import Dashboard      from './components/Dashboard'
import CalendarView   from './components/CalendarView'
import HolidayManager from './components/HolidayManager'
import Settings       from './components/Settings'
import { useAttendance } from './hooks/useAttendance'
import { useSettings }   from './hooks/useSettings'

function IconDashboard({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="15" width="7" height="6" rx="1.5" />
    </svg>
  )
}

function IconCalendar({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8"  y1="2" x2="8"  y2="6" />
      <line x1="3"  y1="10" x2="21" y2="10" />
      <circle cx="8"  cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="15" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconHoliday({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="5"  />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2"  y1="12" x2="5"  y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34"  />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
      <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"  />
    </svg>
  )
}

function IconSettings({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
  { id: 'calendar',  label: 'Calendar',  Icon: IconCalendar  },
  { id: 'holidays',  label: 'Holidays',  Icon: IconHoliday   },
  { id: 'settings',  label: 'Settings',  Icon: IconSettings  },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const { attendanceMap, holidays, holidayDates, markDay, addHoliday, deleteHoliday } = useAttendance()
  const { settings, update } = useSettings()

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col max-w-lg mx-auto w-full">
      <header className="px-4 pb-4" style={{ paddingTop: 'max(2.5rem, env(safe-area-inset-top, 2.5rem))' }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Track your office presence</p>
      </header>

      <main className="flex-1 overflow-y-auto px-4" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        {/* All tabs stay mounted — hidden with display:none so they always receive prop updates */}
        <div className={tab === 'dashboard' ? '' : 'hidden'}>
          <Dashboard attendanceMap={attendanceMap} holidayDates={holidayDates} settings={settings} />
        </div>
        <div className={tab === 'calendar' ? '' : 'hidden'}>
          <CalendarView attendanceMap={attendanceMap} holidayDates={holidayDates} markDay={markDay} />
        </div>
        <div className={tab === 'holidays' ? '' : 'hidden'}>
          <HolidayManager holidays={holidays} addHoliday={addHoliday} deleteHoliday={deleteHoliday} />
        </div>
        <div className={tab === 'settings' ? '' : 'hidden'}>
          <Settings settings={settings} update={update} />
        </div>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex max-w-lg mx-auto w-full"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs transition-colors ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Icon active={active} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
