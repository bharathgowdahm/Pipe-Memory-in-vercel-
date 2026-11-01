import { COST_PER_METER, MATERIAL_LIFE, SEV_NUM } from './constants'
import { addDays, daysBetween, iso } from './geo'

export const riskLevel = (s) => (s >= 75 ? 'Critical' : s >= 55 ? 'High' : s >= 35 ? 'Medium' : 'Low')
export const actionFor = (s) =>
  s >= 75 ? 'Replace segment' : s >= 55 ? 'Inspect & pressure test' : s >= 35 ? 'Add to next survey' : 'Routine monitoring'

/** Explainable 0-100 risk score + next-failure estimate for every pipe. */
export function computeRisk({ pipes, leaks, repairs, complaints }) {
  const today = iso(new Date())
  const year = new Date().getFullYear()

  const rows = pipes.map((p) => {
    const life = MATERIAL_LIFE[p.material] || 50
    const age = year - p.install_year
    const pl = leaks.filter((l) => l.pipe_id === p.id).sort((a, b) => a.date.localeCompare(b.date))
    const pr = repairs.filter((r) => r.pipe_id === p.id)
    const pc = complaints.filter((c) => c.pipe_id === p.id && c.status !== 'Resolved')

    const agePts = (Math.min(age / life, 1.5) / 1.5) * 35
    const l12 = pl.filter((l) => daysBetween(l.date, today) <= 365).length
    const leakPts = Math.min(l12 * 9 + Math.max(pl.length - l12, 0) * 2, 30)

    let sevPts = 0
    if (pl.length) {
      const recent = pl.filter((l) => daysBetween(l.date, today) <= 730)
      if (recent.length) {
        const mean = recent.reduce((s, l) => s + SEV_NUM[l.severity], 0) / recent.length
        sevPts = Math.min((mean / 3) * 10, 10)
      }
    }

    const lastRepair = pr.length ? pr.map((r) => r.date).sort().slice(-1)[0] : null
    const since = lastRepair ? daysBetween(lastRepair, today) : age * 365
    const repairPts = pl.length ? Math.min(since / 1460, 1) * 15 : Math.min(since / 3650, 1) * 5
    const compPts = Math.min(pc.length * 5, 10)

    const score = Math.round(Math.min(agePts + leakPts + sevPts + repairPts + compPts, 100) * 10) / 10

    let next
    if (pl.length >= 3) {
      const gaps = []
      for (let i = 1; i < pl.length; i++) gaps.push(daysBetween(pl[i - 1].date, pl[i].date))
      const interval = Math.max(Math.floor(gaps.reduce((a, b) => a + b, 0) / gaps.length), 30)
      const cand = iso(addDays(pl[pl.length - 1].date, interval))
      const min = iso(addDays(today, 7))
      next = cand > min ? cand : min
    } else {
      next = iso(addDays(today, Math.max(30, Math.floor((100 - score) * 7))))
    }

    const action = actionFor(score)
    return {
      pipe_id: p.id,
      pipe: p.name,
      ward: p.ward,
      material: p.material,
      age,
      length_m: p.length_m,
      total_leaks: pl.length,
      leaks_12m: l12,
      open_complaints: pc.length,
      risk_score: score,
      risk_level: riskLevel(score),
      action,
      next_failure: next,
      est_cost: Math.round(COST_PER_METER[action] * p.length_m),
    }
  })
  return rows.sort((a, b) => b.risk_score - a.risk_score)
}
