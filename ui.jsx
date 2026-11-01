import { RISK_COLORS } from '../lib/constants'

export const Hero = ({ title, subtitle }) => (
  <div className="hero">
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </div>
)

export const Metric = ({ label, value }) => (
  <div className="card metric">
    <div className="label">{label}</div>
    <div className="value">{value}</div>
  </div>
)

export const Pill = ({ level, color }) => (
  <span className="pill" style={{ background: color || RISK_COLORS[level] }}>
    {level}
  </span>
)

export const ScoreBar = ({ score }) => {
  const level = score >= 75 ? 'Critical' : score >= 55 ? 'High' : score >= 35 ? 'Medium' : 'Low'
  return (
    <div className="score">
      <div className="bar">
        <i style={{ width: `${score}%`, background: RISK_COLORS[level] }} />
      </div>
      <b>{Math.round(score)}</b>
    </div>
  )
}

export const Field = ({ label, children }) => (
  <label className="field">
    {label}
    {children}
  </label>
)

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="tabs">
    {tabs.map((t) => (
      <button key={t} className={`tab ${value === t ? 'on' : ''}`} onClick={() => onChange(t)}>
        {t}
      </button>
    ))}
  </div>
)
