export const MAP_CENTER = [13.0033, 76.1004] // Hassan, Karnataka - change for your region

export const MATERIAL_LIFE = { PVC: 50, HDPE: 50, GI: 30, 'Cast Iron': 60, AC: 40, DI: 70 }
export const CAUSES = [
  'Corrosion', 'Joint failure', 'Third-party damage', 'Pressure surge',
  'Root intrusion', 'Ground movement', 'Poor workmanship', 'Unknown',
]
export const SEVERITY = ['Minor', 'Moderate', 'Major']
export const SEV_NUM = { Minor: 1, Moderate: 2, Major: 3 }
export const SEV_COLOR = { Minor: '#4dabf7', Moderate: '#f0a202', Major: '#c92a2a' }
export const SEVERITY_LOSS = { Minor: [300, 1500], Moderate: [1500, 6000], Major: [6000, 25000] }
export const REPAIR_TYPES = [
  'Clamp / patch', 'Joint replacement', 'Section replacement', 'Valve repair', 'Full segment replacement',
]
export const COMPLAINT_TYPES = ['Leakage', 'Low pressure', 'No supply', 'Dirty water', 'Burst pipe']
export const COMPLAINT_STATUS = ['Open', 'In progress', 'Resolved']
export const STATUS_COLOR = { Open: '#c92a2a', 'In progress': '#f0a202', Resolved: '#2e9e5b' }
export const RISK_COLORS = { Low: '#2e9e5b', Medium: '#f0a202', High: '#e8590c', Critical: '#c92a2a' }
export const COST_PER_METER = {
  'Replace segment': 3500,
  'Inspect & pressure test': 150,
  'Add to next survey': 40,
  'Routine monitoring': 0,
}
