import { useMemo, useState } from 'react'
import { Field, Hero, Metric, Pill, ScoreBar } from './ui'
import { MATERIAL_LIFE, RISK_COLORS } from './constants'
import { addDays, fmtDate, inr, iso } from './geo'
import { computeRisk } from './risk'
import { useStore } from './store'

export default function Planner() {
  const data = useStore()
  const risk = useMemo(() => computeRisk(data), [data])
  const [levels, setLevels] = useState(['High', 'Critical'])
  const [ward, setWard] = useState('All')
  const [horizon, setHorizon] = useState(365)

  const wards = [...new Set(risk.map((r) => r.ward))].sort()
  const cutoff = iso(addDays(new Date(), horizon))
  const rows = risk.filter(
    (r) => levels.includes(r.risk_level) && (ward === 'All' || r.ward === ward) && r.next_failure <= cutoff
  )
  const totalM = rows.reduce((s, r) => s + r.length_m, 0)
  const budget = rows.reduce((s, r) => s + r.est_cost, 0)

  const toggleLevel = (l) => setLevels((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]))

  const downloadCsv = () => {
    const head = ['Pipe', 'Ward', 'Material', 'Age', 'Total leaks', 'Leaks 12m', 'Open complaints', 'Risk score', 'Risk level', 'Next failure', 'Action', 'Est cost INR']
    const lines = rows.map((r) =>
      [r.pipe, r.ward, r.material, r.age, r.total_leaks, r.leaks_12m, r.open_complaints, r.risk_score, r.risk_level, r.next_failure, r.action, r.est_cost]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'maintenance_plan.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Hero title="🛠️ Maintenance Planner" subtitle="Risk-ranked, explainable predictions to plan budgets and crews." />

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row">
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Risk level</div>
            <div className="toggles">
              {Object.keys(RISK_COLORS).map((l) => (
                <label key={l}>
                  <input type="checkbox" checked={levels.includes(l)} onChange={() => toggleLevel(l)} />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <Field label="Ward">
            <select value={ward} onChange={(e) => setWard(e.target.value)}>
              <option>All</option>
              {wards.map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label={`Failure horizon: ${horizon} days`}>
            <input type="range" min="30" max="730" step="30" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} />
          </Field>
        </div>
      </div>

      <div className="grid g3">
        <Metric label="Segments selected" value={rows.length} />
        <Metric label="Length" value={`${(totalM / 1000).toFixed(2)} km`} />
        <Metric label="Estimated budget" value={inr(budget)} />
      </div>

      <div className="row" style={{ margin: '14px 0 10px', justifyContent: 'flex-end' }}>
        <button className="btn" style={{ flex: '0 0 auto' }} onClick={downloadCsv} disabled={!rows.length}>
          ⬇️ Download plan (CSV)
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pipe</th><th>Ward</th><th>Material</th><th>Age</th><th>Leaks</th><th>12m</th>
              <th>Complaints</th><th>Risk</th><th>Level</th><th>Next failure</th><th>Action</th><th>Est. cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pipe_id}>
                <td><b>{r.pipe}</b></td>
                <td>{r.ward}</td>
                <td>{r.material}</td>
                <td>{r.age} yrs</td>
                <td>{r.total_leaks}</td>
                <td>{r.leaks_12m}</td>
                <td>{r.open_complaints}</td>
                <td><ScoreBar score={r.risk_score} /></td>
                <td><Pill level={r.risk_level} /></td>
                <td>{fmtDate(r.next_failure)}</td>
                <td>{r.action}</td>
                <td>{inr(r.est_cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">No pipes match these filters.</div>}
      </div>

      <details className="card" style={{ marginTop: 14 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>How is the risk score calculated?</summary>
        <ul>
          <li><b>Age vs design life (35 pts)</b> — material life: {Object.entries(MATERIAL_LIFE).map(([k, v]) => `${k} ${v} yrs`).join(', ')}</li>
          <li><b>Leak history (30 pts)</b> — recent leaks weigh more than old ones</li>
          <li><b>Severity (10 pts)</b> — average severity over the last 2 years</li>
          <li><b>Time since last repair (15 pts)</b></li>
          <li><b>Open complaints (10 pts)</b></li>
        </ul>
        <p>
          The next-failure estimate uses the mean gap between past leaks (3 or more leaks), otherwise a
          risk-scaled window. It is a transparent heuristic — replace it with a trained model once enough
          data has been collected.
        </p>
      </details>
    </div>
  )
}
