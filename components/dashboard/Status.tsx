type StatusTone = 'success' | 'warning' | 'danger'

// Explicit tone takes priority. Without one, tone is inferred from known
// keywords — this keeps every existing call site (Completed/Confirmed/
// Overdue/Awaiting payment/Pending) working unchanged.
function inferTone(value: string): StatusTone {
  if (value === 'Completed' || value === 'Confirmed') return 'success'
  if (value === 'Overdue' || value === 'Awaiting payment') return 'danger'
  return 'warning'
}

export function Status({ value, tone }: { value: string; tone?: StatusTone }) {
  const resolvedTone = tone ?? inferTone(value)
  return <span className={`status status-${resolvedTone}`}><span className="status-dot" />{value}</span>
}