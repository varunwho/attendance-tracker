// Fixed India national holidays seeded automatically each year
export const NATIONAL_HOLIDAYS = [
  { month: 1,  day: 1,  label: "New Year's Day"   },
  { month: 1,  day: 26, label: 'Republic Day'      },
  { month: 5,  day: 1,  label: 'Labour Day'        },
  { month: 8,  day: 15, label: 'Independence Day'  },
  { month: 10, day: 2,  label: 'Gandhi Jayanti'    },
]

/** Returns YYYY-MM-DD strings for all national holidays in the given year */
export function nationalHolidayDates(year) {
  return NATIONAL_HOLIDAYS.map(({ month, day, label }) => ({
    date:  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    label,
  }))
}

/** Returns true if a YYYY-MM-DD date matches any national holiday (any year) */
export function isNationalHolidayDate(isoDate) {
  const parts = isoDate.split('-')
  const mm = parts[1]
  const dd = parts[2]
  return NATIONAL_HOLIDAYS.some(
    h => String(h.month).padStart(2, '0') === mm && String(h.day).padStart(2, '0') === dd
  )
}
