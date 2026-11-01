export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toR = Math.PI / 180
  const p1 = lat1 * toR
  const p2 = lat2 * toR
  const dphi = p2 - p1
  const dl = (lon2 - lon1) * toR
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// small deterministic random generator so demo data is the same for everyone
export function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pointOnPipe = (p, t) => [p.lat1 + t * (p.lat2 - p.lat1), p.lon1 + t * (p.lon2 - p.lon1)]

export function nearestPipe(lat, lon, pipes) {
  let best = null
  let bestD = Infinity
  for (const p of pipes) {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const [la, lo] = pointOnPipe(p, t)
      const d = haversine(lat, lon, la, lo)
      if (d < bestD) {
        bestD = d
        best = p.id
      }
    }
  }
  return best
}

export const iso = (d) => new Date(d).toISOString().slice(0, 10)
export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
