import { useEffect, useState } from 'react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { actions, useStore } from './lib/store'
import Dashboard from './pages/Dashboard'
import MapPage from './pages/MapPage'
import Registry from './pages/Registry'
import LogData from './pages/LogData'
import Patterns from './pages/Patterns'
import Planner from './pages/Planner'

const NAV = [
  ['/', '🏠', 'Dashboard'],
  ['/map', '🗺️', 'Map'],
  ['/registry', '📋', 'Registry'],
  ['/log', '📝', 'Log data'],
  ['/patterns', '📈', 'Patterns'],
  ['/planner', '🛠️', 'Planner'],
]

function Toast() {
  const [msg, setMsg] = useState('')
  useEffect(() => {
    let timer
    const on = (e) => {
      setMsg(e.detail)
      clearTimeout(timer)
      timer = setTimeout(() => setMsg(''), 2800)
    }
    window.addEventListener('pm-toast', on)
    return () => {
      window.removeEventListener('pm-toast', on)
      clearTimeout(timer)
    }
  }, [])
  return msg ? <div className="toast" role="status">{msg}</div> : null
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('pm-theme') || 'light'
    } catch {
      return 'light'
    }
  })
  const data = useStore()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('pm-theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  return (
    <HashRouter>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            💧 PipeMemory
            <small>Underground Infrastructure Memory</small>
          </div>
          <nav className="nav">
            {NAV.map(([to, icon, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>
                <span>{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="side-foot">
            <div>
              {data.pipes.length} pipes · {data.leaks.length} leaks · {data.repairs.length} repairs ·{' '}
              {data.complaints.length} complaints
            </div>
            <button className="btn ghost small" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
            </button>
            <button
              className="btn ghost small"
              onClick={() => {
                if (window.confirm('Reset all data back to the demo dataset?')) actions.resetDemo()
              }}
            >
              ↺ Reset demo data
            </button>
          </div>
        </aside>

        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/log" element={<LogData />} />
            <Route path="/patterns" element={<Patterns />} />
            <Route path="/planner" element={<Planner />} />
          </Routes>
        </main>

        <nav className="bottom-nav">
          {NAV.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <Toast />
      </div>
    </HashRouter>
  )
}
