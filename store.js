import { useSyncExternalStore } from 'react'
import {
  CAUSES, COMPLAINT_TYPES, MAP_CENTER, MATERIAL_LIFE, REPAIR_TYPES, SEVERITY, SEVERITY_LOSS,
} from './constants'
import { addDays, haversine, iso, mulberry32, nearestPipe, pointOnPipe } from './geo'

/*
 * Data layer. Everything is stored in the browser (localStorage) so the app works
 * on Vercel with zero setup. To move to a real database later (Supabase / Neon),
 * replace the functions in this file - the pages only use useStore() and the actions.
 */
const KEY = 'pipememory:v1'

function seed() {
  const rnd = mulberry32(42)
  const range = (a, b) => a + rnd() * (b - a)
  const int = (a, b) => Math.floor(range(a, b + 1))
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
  const wpick = (arr, w) => {
    const r = rnd()
    let s = 0
    for (let i = 0; i < arr.length; i++) {
      s += w[i]
      if (r < s) return arr[i]
    }
    return arr[arr.length - 1]
  }
  const poisson = (lam) => {
    const L = Math.exp(-lam)
    let k = 0
    let p = 1
    do {
      k++
      p *= rnd()
    } while (p > L)
    return k - 1
  }

  const today = new Date()
  const wards = [
    'Ward 1 - Bus Stand', 'Ward 2 - Market Road', 'Ward 3 - Temple Street',
    'Ward 4 - Railway Colony', 'Ward 5 - Lake View', 'Ward 6 - School Layout',
  ]
  const street = ['Main', 'Cross', 'Link', 'Feeder', 'Branch', 'Loop']
  const materials = Object.keys(MATERIAL_LIFE)

  const pipes = []
  for (let i = 0; i < 30; i++) {
    const material = wpick(materials, [0.3, 0.2, 0.22, 0.1, 0.1, 0.08])
    const old = ['GI', 'AC', 'Cast Iron'].includes(material)
    const lat1 = MAP_CENTER[0] + range(-0.022, 0.022)
    const lon1 = MAP_CENTER[1] + range(-0.028, 0.028)
    const lat2 = lat1 + range(-0.004, 0.004)
    const lon2 = lon1 + range(-0.005, 0.005)
    pipes.push({
      id: i + 1,
      name: `${street[i % 6]} line ${String(i + 1).padStart(2, '0')}`,
      ward: wards[i % wards.length],
      material,
      diameter_mm: pick([63, 90, 110, 160, 200, 250]),
      install_year: old ? int(1972, 2003) : int(1998, 2023),
      lat1, lon1, lat2, lon2,
      length_m: Math.round(haversine(lat1, lon1, lat2, lon2) * 10) / 10,
    })
  }

  const leaks = []
  const repairs = []
  const complaints = []
  let lid = 1
  let rid = 1
  let cid = 1
  for (const p of pipes) {
    const life = MATERIAL_LIFE[p.material]
    const age = today.getFullYear() - p.install_year
    const lam = 0.3 + 2.4 * Math.min(age / life, 1.6)
    const n = Math.min(poisson(lam), 7)
    for (let k = 0; k < n; k++) {
      const d = addDays(today, -int(5, 1100))
      const [lat, lon] = pointOnPipe(p, range(0.05, 0.95))
      const severity = wpick(SEVERITY, [0.5, 0.35, 0.15])
      const [lo, hi] = SEVERITY_LOSS[severity]
      leaks.push({
        id: lid++, pipe_id: p.id, date: iso(d), severity,
        cause: wpick(CAUSES, [0.28, 0.2, 0.12, 0.1, 0.06, 0.08, 0.08, 0.08]),
        lat, lon, water_loss_lpd: Math.round(range(lo, hi)), notes: '',
      })
      if (rnd() < 0.9) {
        let rd = addDays(d, int(1, 6))
        if (rd > today) rd = today
        repairs.push({
          id: rid++, pipe_id: p.id, date: iso(rd),
          repair_type: [REPAIR_TYPES[0], REPAIR_TYPES[1], REPAIR_TYPES[2]][SEVERITY.indexOf(severity)],
          cost_inr: Math.round(range(1500, 9000) * (1 + SEVERITY.indexOf(severity))),
          crew: pick(['Crew A', 'Crew B', 'Crew C']), notes: '',
        })
      }
    }
  }
  for (let i = 0; i < 36; i++) {
    const p = pipes[int(0, pipes.length - 1)]
    const [lat, lon] = pointOnPipe(p, rnd())
    complaints.push({
      id: cid++, pipe_id: p.id, date: iso(addDays(today, -int(0, 120))),
      complaint_type: wpick(COMPLAINT_TYPES, [0.35, 0.25, 0.15, 0.1, 0.15]),
      status: wpick(['Open', 'In progress', 'Resolved'], [0.3, 0.2, 0.5]),
      lat: lat + (rnd() - 0.5) * 0.0006, lon: lon + (rnd() - 0.5) * 0.0006,
      reported_by: pick(['Resident', 'Ward member', 'Pump operator', 'Field staff']),
      description: 'Reported via helpline / ward office.',
    })
  }
  return { pipes, leaks, repairs, complaints }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.pipes) return parsed
    }
  } catch {
    /* ignore - fall through to seed */
  }
  return seed()
}

let state = load()
const listeners = new Set()

function commit(next) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage may be blocked - the app still works for this session */
  }
  listeners.forEach((l) => l())
}

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const useStore = () => useSyncExternalStore(subscribe, () => state)

const nextId = (rows) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1

export const actions = {
  addPipe(p) {
    const length_m = Math.round(haversine(p.lat1, p.lon1, p.lat2, p.lon2) * 10) / 10
    commit({ ...state, pipes: [...state.pipes, { ...p, id: nextId(state.pipes), length_m }] })
  },
  addLeak(l) {
    commit({ ...state, leaks: [...state.leaks, { ...l, id: nextId(state.leaks) }] })
  },
  addRepair(r) {
    commit({ ...state, repairs: [...state.repairs, { ...r, id: nextId(state.repairs) }] })
  },
  addComplaint(c) {
    const pipe_id = nearestPipe(c.lat, c.lon, state.pipes)
    commit({
      ...state,
      complaints: [...state.complaints, { ...c, pipe_id, status: 'Open', id: nextId(state.complaints) }],
    })
    return pipe_id
  },
  setComplaintStatus(id, status) {
    commit({ ...state, complaints: state.complaints.map((c) => (c.id === id ? { ...c, status } : c)) })
  },
  resetDemo() {
    commit(seed())
  },
}

export function toast(message) {
  window.dispatchEvent(new CustomEvent('pm-toast', { detail: message }))
}

/* Map location chosen by clicking the map - pre-fills the Log Data forms. */
let pick = null
const pickListeners = new Set()
export const setPick = (v) => {
  pick = v
  pickListeners.forEach((l) => l())
}
export const usePick = () =>
  useSyncExternalStore(
    (fn) => {
      pickListeners.add(fn)
      return () => pickListeners.delete(fn)
    },
    () => pick
  )
