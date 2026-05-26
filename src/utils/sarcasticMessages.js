// d = { pct, targetPct, present, absent, unmarked, elapsed, total, remaining }

const EXCELLENT = [
  d => `${d.pct.toFixed(0)}%? The office plants are starting to feel judged by your consistency.`,
  d => `${d.present} days in ${d.elapsed}. Your chair has filed a restraining order.`,
  () => `You show up so much the janitor works around your schedule.`,
  () => `Gold star! Now please go home. The building needs to miss you.`,
  d => `${d.pct.toFixed(0)}% attendance. Management suspects something. Nobody is this dedicated by accident.`,
  () => `Congratulations — you've become the benchmark everyone else quietly resents.`,
  () => `At this rate they'll name a parking spot after you. Or a therapy room. Hard to say which.`,
  d => `Only ${d.absent} absent day${d.absent !== 1 ? 's' : ''}. Either you love it here or home is worse. Either way — yikes.`,
  () => `You've shown up so often the photocopier knows your coffee order.`,
  () => `HR flagged your account as an error. Then realised it wasn't.`,
  d => `${d.pct.toFixed(0)}% attendance. Your dedication is admirable. Your social life is a concern.`,
  () => `You're so on track that the track is starting to feel suffocated.`,
  () => `Keep this up and they'll upgrade your desk from a flat surface to an actual desk.`,
  d => `${d.present} days present out of ${d.elapsed}. Someone's either disciplined or their home WiFi is broken.`,
  () => `You're practically a fixture. The security guard waves at you by name now.`,
  () => `Outstanding attendance! Have you tried hobbies? Quite popular on weekends, apparently.`,
  d => `Well above the ${d.targetPct}% target. Someone's been doing the maths before every questionable life choice.`,
  () => `You show up so often IT stopped bothering to lock your computer.`,
  () => `Impeccable attendance. The kind that makes colleagues quietly question their own life choices.`,
  () => `You're here more than the vending machine. And it's bolted to the wall.`,
]

const ONTRACK = [
  d => `${d.pct.toFixed(0)}% — right on target. Like a very boring, very responsible robot.`,
  () => `On track! Which is great, because nobody enjoys a performance improvement plan.`,
  d => `${d.remaining > 0 ? `Just ${d.remaining} working days left this month. Don't get creative now.` : `Month wrapped up. You survived. Barely, but still.`}`,
  () => `Technically compliant. The system accepts this. That is high praise from a system.`,
  d => `${d.pct.toFixed(0)}% attendance. The bare minimum has never looked so… intentional.`,
  () => `You're doing it! The low bar of simply showing up has been cleared. Well done.`,
  d => `Present ${d.present} of ${d.elapsed} days. Like a Swiss watch. A mildly reluctant one.`,
  () => `Right on target. Not because you care, but because you did the maths and cared just enough.`,
  () => `Meeting expectations. Management won't make a film about you, but they also won't fire you.`,
  d => `${d.remaining > 0 ? `${d.remaining} days remaining. Hold on. You're almost through another one.` : `Month done. You made it. Take a moment.`}`,
  () => `Attendance: acceptable. Enthusiasm: unverified. Outcome: acceptable.`,
  d => `${d.pct.toFixed(0)}% — technically on track. Practically a miracle given the general vibes.`,
  () => `You've hit target! Feel something. Anything. Maybe not joy, but something.`,
  d => `${d.present} days in${d.remaining > 0 ? `, ${d.remaining} to go` : ''}. Almost like a functional employee.`,
  () => `On track! The benchmark here is 'exists in the building.' Cleared with minimal drama.`,
  () => `You're right where you should be. Congratulations on the bare minimum.`,
  () => `Target met. HR breathes a sigh of relief. Just barely, but a sigh nonetheless.`,
  d => `${d.remaining > 0 ? `With ${d.remaining} days left you can coast from here. Don't tell anyone.` : `Month done. You did it by showing up. Quietly heroic.`}`,
  () => `On track! Mostly because you counted very carefully before every potentially risky decision.`,
  d => `${d.pct.toFixed(0)}% — you're winning. Only technically, but that still counts.`,
]

const CLOSE = [
  d => `${d.pct.toFixed(0)}% out of a ${d.targetPct}% target. Close enough to smell it, not close enough to taste it.`,
  d => `Just ${Math.abs(d.targetPct - d.pct).toFixed(1)}% off target. That's like one extra Tuesday. You have Tuesdays, right?`,
  () => `So close. So very, tantalizingly, frustratingly close.`,
  d => `${d.remaining > 0 ? `${d.remaining} days left to save yourself. No pressure. Some pressure.` : `The month is done. You finished just shy. Respectable. Mostly.`}`,
  () => `Almost on track. Like a train that's late but insisting it's absolutely fine.`,
  d => `${d.remaining > 0 ? `A few more appearances and you hit ${d.targetPct}%. Your chair is waiting.` : `Ended close to target. The gap is small. The regret, smaller.`}`,
  () => `You're approaching the target like a cat approaching a bath. Reluctantly and sideways.`,
  d => `${d.present} days present, ${d.absent} absent. The maths is close but not currently your friend.`,
  () => `The target is right there. Can you reach it? Statistically, maybe.`,
  d => `${d.pct.toFixed(0)}% vs ${d.targetPct}% target. One of these numbers is correct. One is you.`,
  () => `You're in the zone. The danger zone. Still a zone though.`,
  d => `${d.remaining > 0 ? `${d.remaining} working days left. Show up and you might just make it. Wild concept.` : `Ended close. Respect for trying.`}`,
  () => `Almost there! Like a streaming show that's nearly good but not quite.`,
  d => `You've attended ${d.pct.toFixed(0)}% of the time. A little more and you'll shock everyone, including yourself.`,
  () => `Close to the target. Don't celebrate. Don't even smile. Not yet.`,
  () => `Hovering near target like an anxious drone. Might make it. Might not. Thrilling.`,
  () => `The finish line is in sight. Whether you cross it remains another story entirely.`,
  d => `${d.remaining > 0 ? `Mark present for ${d.remaining} more days and you're golden. Theoretically.` : `Almost, but not quite. The story of this month.`}`,
  () => `Like a film trailer — promising, but the actual delivery is still pending.`,
  d => `${d.absent} absence${d.absent !== 1 ? 's' : ''} noted. Your record has the vibe of abstract art.`,
]

const BEHIND = [
  d => `${d.pct.toFixed(0)}% out of ${d.targetPct}% goal. Calculators everywhere are quietly suffering.`,
  () => `Your attendance record has entered its villain arc.`,
  d => `You've been absent ${d.absent} day${d.absent !== 1 ? 's' : ''}. Your desk plant, meanwhile, has perfect attendance.`,
  d => `${d.remaining > 0 ? `${d.remaining} days left. You'd need a clone to catch up. Have you looked into that?` : `The month is over. The numbers have spoken. They were not kind.`}`,
  () => `Your attendance is like dial-up — technically it works, just not really.`,
  d => `${d.pct.toFixed(0)}% attendance. The office has sent your desk a 'Thinking of You' card.`,
  () => `You're behind on attendance. But hey, awareness is the first step. Apparently.`,
  d => `${Math.abs(d.targetPct - d.pct).toFixed(1)}% below target. Your screensaver is confused about who owns this computer.`,
  () => `The office rumour is you've switched to astral projection. Bold career strategy.`,
  d => `You've marked ${d.present + d.absent} of ${d.elapsed} elapsed day${d.elapsed !== 1 ? 's' : ''}. The rest are wrapped in a duvet of mystery.`,
  () => `Your attendance graph looks like a stock market correction. Dramatic and unexplained.`,
  d => `${d.remaining > 0 ? `You'd need ${Math.max(0, Math.ceil(d.targetPct / 100 * d.total) - d.present)} more present days to hit target. Totally doable. Theoretically.` : `Month closed. The gap will haunt you briefly.`}`,
  () => `Behind, yes. But failure is just success that hasn't had enough coffee yet. Probably.`,
  d => `${d.pct.toFixed(0)}% vs ${d.targetPct}% target. The gap between those numbers has a name: accountability.`,
  () => `Attendance: questionable. Commitment: philosophical. Outcome: unclear.`,
  () => `At this pace your office access card might expire before your attendance improves.`,
  d => `Present ${d.present} day${d.present !== 1 ? 's' : ''}. The coffee machine has forgotten your usual order.`,
  () => `You're behind. Your excuses are also behind. There's still time for both.`,
  () => `Your attendance is a cautionary tale HR will discuss in future induction sessions.`,
  () => `Your chair has started subletting your space to a ficus. Just FYI.`,
]

const WAYBEHIND = [
  d => `${d.pct.toFixed(0)}% attendance. Target: ${d.targetPct}%. The gap is not a metaphor.`,
  () => `At this point, the office has classified your absence as an architectural feature.`,
  d => `${d.absent} absent day${d.absent !== 1 ? 's' : ''}. ${d.present} present. One of these numbers should be the smaller one.`,
  () => `Your attendance is so low your shadow stopped showing up in solidarity.`,
  d => `${d.remaining > 0 ? `${d.remaining} days left. Even perfect attendance from here might not save you. Just so you know.` : `Month complete. The numbers are in. They are not flattering.`}`,
  () => `Bold choice to treat the office like a subscription you forgot to cancel.`,
  d => `${d.pct.toFixed(0)}% this month. That's not an attendance record, that's a disappearing act.`,
  () => `You've technically attended less than most public holidays this month. A unique achievement.`,
  d => `${d.elapsed} elapsed day${d.elapsed !== 1 ? 's' : ''}, ${d.present} attended. Your desk has developed a whole personality in your absence.`,
  () => `Legend says if you attend enough days in a row, you unlock the mythical power of 'job security.'`,
  () => `Have you tried showing up? Niche strategy, but some people swear by it.`,
  () => `The office WiFi password has changed twice since your last visit.`,
  d => `${d.pct.toFixed(0)}% — you're less an employee, more an occasional collaborator at this point.`,
  () => `HR has a folder with your name on it. It's not the high performer folder.`,
  d => `Attendance this month: ${d.pct.toFixed(0)}%. The potential: still technically there, somewhere.`,
  () => `You are, technically, still employed. That is the most optimistic reading of this data.`,
  d => `${d.present} day${d.present !== 1 ? 's' : ''} out of ${d.elapsed} elapsed. The rest is between you and your alarm clock.`,
  () => `The office plant has better attendance than you. It doesn't even have legs.`,
  d => `${d.pct.toFixed(0)}% this month. Your desk moonlights as a storage unit.`,
  () => `At this attendance level, your employee ID is basically a collector's item.`,
]

export function getSarcasticMessage(data, idx) {
  const { pct, targetPct } = data
  const ratio = targetPct > 0 ? pct / targetPct : 1

  const pool = ratio >= 1.15 ? EXCELLENT
             : ratio >= 1.0  ? ONTRACK
             : ratio >= 0.85 ? CLOSE
             : ratio >= 0.6  ? BEHIND
             : WAYBEHIND

  return pool[idx % pool.length](data)
}
