import {
  getWorkingDays, getMonthBounds, getQuarterBounds,
  getWeekBounds, getYearBounds, toISO
} from '../utils/workingDays'

function getPeriodBounds(period, date, quarterStart = 0) {
  switch (period) {
    case 'weekly':    return getWeekBounds(date)
    case 'monthly':   return getMonthBounds(date)
    case 'quarterly': return getQuarterBounds(date, quarterStart)
    case 'yearly':    return getYearBounds(date)
    default:          return getMonthBounds(date)
  }
}

const PERIOD_LABELS = {
  weekly: 'This Week', monthly: 'This Month', quarterly: 'This Quarter', yearly: 'This Year',
}

const PERIOD_SUFFIX = {
  weekly: 'this week', monthly: 'this month', quarterly: 'this quarter', yearly: 'this year',
}

function StatCard({ label, pct, present, totalSoFar, totalFull, needed, target, type, isPolicy }) {
  const onTrack     = type === 'percentage' ? pct >= target : present >= target
  const displayVal  = type === 'percentage' ? `${pct.toFixed(1)}%` : `${present} days`
  const targetLabel = type === 'percentage' ? `${target}%` : `${target} days`

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-2 shadow-sm ${isPolicy ? 'border-2 border-blue-500 dark:border-blue-500' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
        {isPolicy && <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">Policy</span>}
      </div>
      <p className={`text-4xl font-bold ${onTrack ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        {displayVal}
      </p>
      {type === 'percentage' && (
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${onTrack ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
      <p className="text-gray-500 dark:text-gray-400 text-xs">
        {present} present / {totalSoFar} working days elapsed
        {totalFull !== totalSoFar ? ` (${totalFull} total)` : ''}
      </p>
      {!onTrack && needed > 0 && (
        <p className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">
          Need {needed} more day{needed !== 1 ? 's' : ''} to reach {targetLabel}
        </p>
      )}
      {onTrack && (
        <p className="text-green-600 dark:text-green-400 text-xs font-medium">On track</p>
      )}
    </div>
  )
}

function PlanCard({ label, present, totalFull, target, type, period }) {
  const required  = type === 'percentage' ? Math.ceil((target / 100) * totalFull) : target
  const goalMet   = present >= required
  const progress  = required > 0 ? Math.min((present / required) * 100, 100) : 100
  const remaining = Math.max(0, required - present)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
        <span className="text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">Target</span>
      </div>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-1">All marked days this period, including ones you've planned ahead</p>
      <p className={`text-4xl font-bold ${goalMet ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'}`}>
        {present} / {required} days
      </p>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${goalMet ? 'bg-green-500 dark:bg-green-400' : 'bg-blue-500 dark:bg-blue-400'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-xs">
        {totalFull} working days {PERIOD_SUFFIX[period]}
      </p>
      {goalMet ? (
        <p className="text-green-600 dark:text-green-400 text-xs font-medium">Plan complete!</p>
      ) : (
        <p className="text-blue-600 dark:text-blue-400 text-xs font-medium">
          {remaining} more day{remaining !== 1 ? 's' : ''} needed
        </p>
      )}
    </div>
  )
}

function buildCard(bounds, attendanceMap, holidayDates, today, target, type) {
  const todayISO    = toISO(today)
  const allDays     = getWorkingDays(bounds.start, bounds.end, holidayDates)
  const elapsed     = allDays.filter(d => d <= todayISO)
  const present     = elapsed.filter(d => attendanceMap[d] === 'present').length
  const presentFull = allDays.filter(d => attendanceMap[d] === 'present').length
  const pct         = elapsed.length ? (present / elapsed.length) * 100 : 0
  const needed      = type === 'percentage'
    ? Math.max(0, Math.ceil((target / 100) * allDays.length) - present)
    : Math.max(0, target - present)
  return { pct, present, presentFull, totalSoFar: elapsed.length, totalFull: allDays.length, needed }
}

export default function Dashboard({ attendanceMap, holidayDates, settings }) {
  const today  = new Date()
  const { period, type, value: target, quarterStart = 0 } = settings

  const policyData = buildCard(getPeriodBounds(period, today, quarterStart), attendanceMap, holidayDates, today, target, type)
  const monthData  = period !== 'monthly'
    ? buildCard(getMonthBounds(today), attendanceMap, holidayDates, today, target, type)
    : null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Overview</h2>

      <StatCard
        label={PERIOD_LABELS[period]}
        {...policyData}
        target={target}
        type={type}
        isPolicy
      />

      {monthData && (
        <StatCard
          label="This Month"
          {...monthData}
          target={target}
          type={type}
          isPolicy={false}
        />
      )}

      <PlanCard
        label={PERIOD_LABELS[period]}
        present={policyData.presentFull}
        totalFull={policyData.totalFull}
        target={target}
        type={type}
        period={period}
      />
    </div>
  )
}
