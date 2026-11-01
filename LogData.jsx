import { useState } from 'react'
import { Field, Hero, Tabs } from './ui'
import {
  CAUSES, COMPLAINT_TYPES, MAP_CENTER, MATERIAL_LIFE, REPAIR_TYPES, SEVERITY,
} from './constants'
import { fmtDate, iso } from './geo'
import { actions, toast, usePick, useStore } from './store'

const TABS = ['💦 Leak', '🔧 Repair', '📣 Complaint', '➕ New pipe', '✅ Close complaint']
const today = () => iso(new Date())

function PipeSelect({ pipes, value, onChange }) {
  return (
    <Field label="Pipe">
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {pipes.map((p) => (
          <option key={p.id} value={p.id}>{p.name} — {p.ward}</option>
        ))}
      </select>
    </Field>
  )
}

function LeakForm({ pipes, loc }) {
  const [f, setF] = useState({ pipe_id: pipes[0]?.id, date: today(), severity: 'Minor', cause: CAUSES[0], water_loss_lpd: 1000, notes: '' })
  const [lat, setLat] = useState(loc[0])
  const [lon, setLon] = useState(loc[1])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        actions.addLeak({ ...f, pipe_id: Number(f.pipe_id), water_loss_lpd: Number(f.water_loss_lpd), lat: Number(lat), lon: Number(lon) })
        toast('💦 Leak incident saved')
        setF({ ...f, notes: '' })
      }}
    >
      <div className="row">
        <PipeSelect pipes={pipes} value={f.pipe_id} onChange={(v) => setF({ ...f, pipe_id: v })} />
        <Field label="Date"><input type="date" required max={today()} value={f.date} onChange={set('date')} /></Field>
      </div>
      <div className="row">
        <Field label="Severity"><select value={f.severity} onChange={set('severity')}>{SEVERITY.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Cause"><select value={f.cause} onChange={set('cause')}>{CAUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Water loss (L/day)"><input type="number" min="0" step="100" value={f.water_loss_lpd} onChange={set('water_loss_lpd')} /></Field>
      </div>
      <div className="row">
        <Field label="Latitude"><input type="number" step="any" required value={lat} onChange={(e) => setLat(e.target.value)} /></Field>
        <Field label="Longitude"><input type="number" step="any" required value={lon} onChange={(e) => setLon(e.target.value)} /></Field>
      </div>
      <Field label="Notes"><textarea value={f.notes} onChange={set('notes')} /></Field>
      <button className="btn" type="submit">Save leak</button>
    </form>
  )
}

function RepairForm({ pipes }) {
  const [f, setF] = useState({ pipe_id: pipes[0]?.id, date: today(), repair_type: REPAIR_TYPES[0], cost_inr: 5000, crew: '', notes: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        actions.addRepair({ ...f, pipe_id: Number(f.pipe_id), cost_inr: Number(f.cost_inr) })
        toast('🔧 Repair saved')
        setF({ ...f, notes: '', crew: '' })
      }}
    >
      <div className="row">
        <PipeSelect pipes={pipes} value={f.pipe_id} onChange={(v) => setF({ ...f, pipe_id: v })} />
        <Field label="Date"><input type="date" required max={today()} value={f.date} onChange={set('date')} /></Field>
      </div>
      <div className="row">
        <Field label="Repair type"><select value={f.repair_type} onChange={set('repair_type')}>{REPAIR_TYPES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Cost (₹)"><input type="number" min="0" step="500" value={f.cost_inr} onChange={set('cost_inr')} /></Field>
        <Field label="Crew / contractor"><input value={f.crew} onChange={set('crew')} /></Field>
      </div>
      <Field label="Notes"><textarea value={f.notes} onChange={set('notes')} /></Field>
      <button className="btn" type="submit">Save repair</button>
    </form>
  )
}

function ComplaintForm({ loc, pipes }) {
  const [f, setF] = useState({ complaint_type: COMPLAINT_TYPES[0], reported_by: '', date: today(), description: '' })
  const [lat, setLat] = useState(loc[0])
  const [lon, setLon] = useState(loc[1])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        const id = actions.addComplaint({ ...f, lat: Number(lat), lon: Number(lon) })
        const name = pipes.find((p) => p.id === id)?.name || 'n/a'
        toast(`📣 Complaint linked to ${name}`)
        setF({ ...f, description: '' })
      }}
    >
      <div className="row">
        <Field label="Complaint type"><select value={f.complaint_type} onChange={set('complaint_type')}>{COMPLAINT_TYPES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Reported by"><input value={f.reported_by} onChange={set('reported_by')} /></Field>
        <Field label="Date"><input type="date" required max={today()} value={f.date} onChange={set('date')} /></Field>
      </div>
      <div className="row">
        <Field label="Latitude"><input type="number" step="any" required value={lat} onChange={(e) => setLat(e.target.value)} /></Field>
        <Field label="Longitude"><input type="number" step="any" required value={lon} onChange={(e) => setLon(e.target.value)} /></Field>
      </div>
      <Field label="Description"><textarea value={f.description} onChange={set('description')} /></Field>
      <button className="btn" type="submit">Register complaint</button>
    </form>
  )
}

function PipeForm({ loc }) {
  const [f, setF] = useState({ name: '', ward: '', material: 'PVC', diameter_mm: 110, install_year: 2005 })
  const [c, setC] = useState({ lat1: loc[0], lon1: loc[1], lat2: loc[0] + 0.002, lon2: loc[1] + 0.002 })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setCo = (k) => (e) => setC({ ...c, [k]: e.target.value })
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        actions.addPipe({
          ...f, diameter_mm: Number(f.diameter_mm), install_year: Number(f.install_year),
          lat1: Number(c.lat1), lon1: Number(c.lon1), lat2: Number(c.lat2), lon2: Number(c.lon2),
        })
        toast('➕ Pipe added')
        setF({ ...f, name: '' })
      }}
    >
      <div className="row">
        <Field label="Pipe name / ID"><input required value={f.name} onChange={set('name')} /></Field>
        <Field label="Ward / village"><input required value={f.ward} onChange={set('ward')} /></Field>
        <Field label="Material"><select value={f.material} onChange={set('material')}>{Object.keys(MATERIAL_LIFE).map((m) => <option key={m}>{m}</option>)}</select></Field>
      </div>
      <div className="row">
        <Field label="Diameter (mm)"><input type="number" min="20" max="1200" value={f.diameter_mm} onChange={set('diameter_mm')} /></Field>
        <Field label="Installed year"><input type="number" min="1900" max={new Date().getFullYear()} value={f.install_year} onChange={set('install_year')} /></Field>
      </div>
      <div className="row">
        <Field label="Start lat"><input type="number" step="any" value={c.lat1} onChange={setCo('lat1')} /></Field>
        <Field label="Start lon"><input type="number" step="any" value={c.lon1} onChange={setCo('lon1')} /></Field>
        <Field label="End lat"><input type="number" step="any" value={c.lat2} onChange={setCo('lat2')} /></Field>
        <Field label="End lon"><input type="number" step="any" value={c.lon2} onChange={setCo('lon2')} /></Field>
      </div>
      <button className="btn" type="submit">Add pipe</button>
    </form>
  )
}

function CloseComplaint({ complaints }) {
  const open = complaints.filter((c) => c.status !== 'Resolved').sort((a, b) => b.date.localeCompare(a.date))
  const [id, setId] = useState('')
  const [status, setStatus] = useState('In progress')
  if (open.length === 0) return <div className="empty">No open complaints 🎉</div>
  const current = open.some((c) => String(c.id) === String(id)) ? id : String(open[0].id)
  return (
    <div className="stack">
      <Field label="Complaint">
        <select value={current} onChange={(e) => setId(e.target.value)}>
          {open.map((c) => (
            <option key={c.id} value={c.id}>#{c.id} · {c.complaint_type} · {fmtDate(c.date)} · {c.status}</option>
          ))}
        </select>
      </Field>
      <Field label="New status">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>In progress</option>
          <option>Resolved</option>
        </select>
      </Field>
      <button
        className="btn"
        onClick={() => {
          actions.setComplaintStatus(Number(current), status)
          toast('✅ Status updated')
        }}
      >
        Update status
      </button>
    </div>
  )
}

export default function LogData() {
  const data = useStore()
  const pick = usePick()
  const [tab, setTab] = useState(TABS[0])
  const loc = pick || MAP_CENTER
  // remount forms when the picked location changes so the lat/lon fields refresh
  const key = loc.join(',')

  return (
    <div>
      <Hero title="📝 Log Data" subtitle="Capture field knowledge before it is lost — leaks, repairs, complaints and new pipes." />
      {pick && (
        <div className="info">📍 Using map-selected location {pick[0].toFixed(5)}, {pick[1].toFixed(5)} (change it on the Map page).</div>
      )}
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="card">
        {tab === TABS[0] && <LeakForm key={key} pipes={data.pipes} loc={loc} />}
        {tab === TABS[1] && <RepairForm pipes={data.pipes} />}
        {tab === TABS[2] && <ComplaintForm key={key} pipes={data.pipes} loc={loc} />}
        {tab === TABS[3] && <PipeForm key={key} loc={loc} />}
        {tab === TABS[4] && <CloseComplaint complaints={data.complaints} />}
      </div>
    </div>
  )
}
