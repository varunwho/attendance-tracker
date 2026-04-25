import {
  getWorkingDays, getMonthBounds, getQuarterBounds,
  getWeekBounds, getYearBounds, toISO
} from '../utils/workingDays'

function getPeriodBounds(period, date) {
  switch (period) {
    case 'weekly':    return getWeekBounds(date)
    case 'monthly':   return getMonthBounds(date)
    case 'quarterly': return getQuarterBounds(date)
    case 'yearly':    return getYearBounds(date)
    default:          return getMonthBounds(date)
  }
}

const PERIOD_LABELS = {
  weekly: 'This Week', monthly: 'This Month', quarterly: 'This Quarter', yearly: 'This Year',
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

function buildCard(bounds, attendanceMap, holidayDates, today, target, type) {
  const todayISO   = toISO(today)
  const allDays    = getWorkingDays(bounds.start, bounds.end, holidayDates)
  const elapsed    = allDays.filter(d => d <= todayISO)
  const present    = elapsed.filter(d => attendanceMap[d] === 'present').length
  const pct        = elapsed.length ? (present / elapsed.length) * 100 : 0
  const needed     = type === 'percentage'
    ? Math.max(0, Math.ceil((target / 100) * allDays.length) - present)
    : Math.max(0, target - present)
  return { pct, present, totalSoFar: elapsed.length, totalFull: allDays.length, needed }
}

export default function Dashboard({ attendanceMap, holidayDates, settings }) {
  const today  = new Date()
  const { period, type, value: target } = settings

  const weekData    = buildCard(getWeekBounds(today),    attendanceMap, holidayDates, today, target, type)
  const monthData   = buildCard(getMonthBounds(today),   attendanceMap, holidayDates, today, target, type)
  const policyData  = buildCard(getPeriodBounds(period, today), attendanceMap, holidayDates, today, target, type)

  const showPolicyCard = period !== 'weekly' && period !== 'monthly'

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Overview</h2>

      {/* Policy card — only if it's quarterly / yearly */}
      {showPolicyCard && (
        <StatCard
          label={PERIOD_LABELS[period]}
          {...policyData}
          target={target}
          type={type}
          isPolicy
        />
      )}

      {/* Always-visible: This Week */}
      <StatCard
        label="This Week"
        {...weekData}
        target={target}
        type={type}
        isPolicy={period === 'weekly'}
      />

      {/* Always-visible: This Month */}
      <StatCard
        label="This Month"
        {...monthData}
        target={target}
        type={type}
        isPolicy={period === 'monthly'}
      />
    </div>
  )
}
