import { useMemo, useState } from 'react'
import { Field, Hero, Metric, Pill, ScoreBar } from './ui'
import { fmtDate, inr } from './geo'
import { computeRisk } from './risk'
import { useStore } from './store'

const EVENT_COLOR = { Leak: '#c92a2a', Repair: '#2e9e5b', Complaint: '#f0a202' }

export default function Registry() {
  const data = useStore()
  const risk = useMemo(() => computeRisk(data), [data])
  const riskById = useMemo(() => Object.fromEntries(risk.map((r) => [r.pipe_id, r])), [risk])

  const [q, setQ] = useState('')
  const [ward, setWard] = useState('All')
  const [mat, setMat] = useState('All')
  const [selected, setSelected] = useState(null)

  const wards = [...new Set(data.pipes.map((p) => p.ward))].sort()
  const mats = [...new Set(data.pipes.map((p) => p.material))].sort()

  const rows = data.pipes.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q.toLowerCase())) &&
      (ward === 'All' || p.ward === ward) &&
      (mat === 'All' || p.material === mat)
  )

  const pipe = data.pipes.find((p) => p.id === selected)
  const r = pipe ? riskById[pipe.id] : null

  const events = pipe
    ? [
        ...data.leaks.filter((l) => l.pipe_id === pipe.id).map((l) => ({
          date: l.date, type: 'Leak', text: `${l.severity} leak — ${l.cause} (${l.water_loss_lpd.toLocaleString('en-IN')} L/day)`,
        })),
        ...data.repairs.filter((x) => x.pipe_id === pipe.id).map((x) => ({
          date: x.date, type: 'Repair', text: `${x.repair_type} · ${inr(x.cost_inr)} · ${x.crew || 'n/a'}`,
        })),
        ...data.complaints.filter((c) => c.pipe_id === pipe.id).map((c) => ({
          date: c.date, type: 'Complaint', text: `${c.complaint_type} (${c.status})`,
        })),
      ].sort((a, b) => b.date.localeCompare(a.date))
    : []

  return (
    <div>
      <Hero title="📋 Pipe Registry & History" subtitle="Search any segment and read its full life story." />

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row">
          <Field label="Search by name">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Main line 01" />
          </Field>
          <Field label="Ward">
            <select value={ward} onChange={(e) => setWard(e.target.value)}>
              <option>All</option>
              {wards.map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Material">
            <select value={mat} onChange={(e) => setMat(e.target.value)}>
              <option>All</option>
              {mats.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Ward</th><th>Material</th><th>Dia (mm)</th><th>Installed</th>
              <th>Length (m)</th><th>Leaks</th><th>Risk</th><th>Level</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const x = riskById[p.id]
              return (
                <tr key={p.id} className="click" onClick={() => setSelected(p.id)}>
                  <td><b>{p.name}</b></td>
                  <td>{p.ward}</td>
                  <td>{p.material}</td>
                  <td>{p.diameter_mm}</td>
                  <td>{p.install_year}</td>
                  <td>{Math.round(p.length_m)}</td>
                  <td>{x?.total_leaks ?? 0}</td>
                  <td>{x && <ScoreBar score={x.risk_score} />}</td>
                  <td>{x && <Pill level={x.risk_level} />}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">No pipes match the filters.</div>}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Tap a row to open that pipe's history.</p>

      {pipe && r && (
        <div className="stack" style={{ marginTop: 18 }}>
          <div className="section-title" style={{ margin: 0 }}>
            {pipe.name} · {pipe.ward} · {pipe.material} · {pipe.diameter_mm} mm · {Math.round(pipe.length_m)} m{' '}
            <Pill level={r.risk_level} />
          </div>
          <div className="grid g4">
            <Metric label="Risk score" value={Math.round(r.risk_score)} />
            <Metric label="Age" value={`${r.age} yrs`} />
            <Metric label="Total leaks" value={r.total_leaks} />
            <Metric label="Next failure (est.)" value={fmtDate(r.next_failure)} />
          </div>
          <div className="info">Recommended action: <b>{r.action}</b></div>
          <div className="card">
            <h3>Event timeline</h3>
            {events.length === 0 ? (
              <div className="empty">No recorded events for this pipe yet.</div>
            ) : (
              <ul className="timeline">
                {events.map((e, i) => (
                  <li key={i}>
                    <span className="dot" style={{ background: EVENT_COLOR[e.type] }} />
                    <div>
                      <b>{e.type}</b> · {fmtDate(e.date)}
                      <div style={{ color: 'var(--muted)' }}>{e.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
