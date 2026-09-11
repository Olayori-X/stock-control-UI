export function Status({ value }: { value: string }) {
  const tone =
    value === 'Completed' || value === 'Confirmed' ? 'success' :
    value === 'Overdue' || value === 'Awaiting payment' ? 'danger' :
    'warning'
  return <span className={`status status-${tone}`}><span className="status-dot" />{value}</span>
}