export type Role = 'sales' | 'distributor' | 'admin' | 'supervisor'

export const roles: Record<Role, { label: string; shortLabel: string }> = {
  sales: { label: 'Sales Associate', shortLabel: 'Sales' },
  distributor: { label: 'Distributor', shortLabel: 'Distributor' },
  admin: { label: 'Administrator', shortLabel: 'Admin' },
  supervisor: { label: 'Supervisor', shortLabel: 'Supervisor' },
}

export const navigation = [
  { label: 'Outlets', icon: 'Store' },
  { label: 'Routes', icon: 'Map' },
  { label: 'Assignments', icon: 'Truck' },
  { label: 'PINs', icon: 'KeyRound' },
  { label: 'Reports', icon: 'BarChart3' },
  { label: 'Pickups', icon: 'PackageCheck' },
  { label: 'Inventory', icon: 'Boxes' },
  { label: 'People & roles', icon: 'UsersRound' },
]

export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.example.com/v1',
  credentials: 'Replace with your API credentials in environment variables',
}

const iconNames = ['LayoutDashboard', 'PackageCheck', 'Boxes', 'UsersRound', 'Store', 'Map', 'Truck', 'KeyRound', 'BarChart3'] as const
export type IconName = typeof iconNames[number]
export const isIconName = (value: string): value is IconName => iconNames.includes(value as IconName)