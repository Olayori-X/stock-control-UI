export type Role = 'sales' | 'distributor' | 'admin'

export const roles: Record<Role, { label: string; shortLabel: string }> = {
  sales: { label: 'Sales Associate', shortLabel: 'Sales' },
  distributor: { label: 'Distributor', shortLabel: 'Distributor' },
  admin: { label: 'Administrator', shortLabel: 'Admin' },
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

export const metrics = [
  { label: 'Active sales associates', value: '48', change: '+8.2%', note: 'vs. last month', tone: 'teal' },
  { label: 'Pending authorizations', value: '12', change: '+3', note: 'since yesterday', tone: 'amber' },
  { label: 'Outstanding balance', value: '$84,250', change: '-6.4%', note: 'vs. last month', tone: 'blue' },
  { label: 'Items below threshold', value: '07', change: 'Needs action', note: 'across 3 categories', tone: 'rose' },
]

export const pickups = [
  { id: 'PU-10482', person: 'Maya Chen', initials: 'MC', items: '24 items', total: '$3,480', status: 'Ready for pickup', date: 'Today, 10:42 AM' },
  { id: 'PU-10481', person: 'Luis Rivera', initials: 'LR', items: '18 items', total: '$2,160', status: 'Awaiting payment', date: 'Today, 9:18 AM' },
  { id: 'PU-10480', person: 'Amina Okafor', initials: 'AO', items: '42 items', total: '$5,920', status: 'Completed', date: 'Yesterday, 4:06 PM' },
  { id: 'PU-10479', person: 'Theo Martin', initials: 'TM', items: '11 items', total: '$1,280', status: 'Completed', date: 'Yesterday, 2:35 PM' },
]

export const invoices = [
  { number: 'INV-2024-084', account: 'Northstar Distribution', amount: '$12,480', due: 'Due in 4 days', status: 'Open' },
  { number: 'INV-2024-079', account: 'Metro Supply Co.', amount: '$8,210', due: 'Overdue by 2 days', status: 'Overdue' },
  { number: 'INV-2024-075', account: 'Greenline Wholesale', amount: '$6,840', due: 'Due in 9 days', status: 'Open' },
]

export const alerts = [
  { title: 'Low stock threshold reached', detail: '07 SKUs need replenishment across 3 categories.', action: 'Review inventory', tone: 'amber' },
  { title: 'Authorization queue growing', detail: '12 distributor requests are waiting for review.', action: 'Review requests', tone: 'blue' },
]

export const roleData = {
  sales: { greeting: 'Good morning, Maya', subtitle: 'Here is your pickup activity for today.', balance: '$2,840', nextPickup: 'Today at 2:30 PM', pickups: '18' },
  distributor: { greeting: 'Good morning, Jordan', subtitle: 'Review requests and release inventory.', balance: '$18,640', nextPickup: '3 requests pending', pickups: '42' },
  admin: { greeting: 'Good morning, Alex', subtitle: 'Here is what is happening across your operation.', balance: '$84,250', nextPickup: '12 authorizations', pickups: '156' },
}

export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.example.com/v1',
  credentials: 'Replace with your API credentials in environment variables',
}

export const mockApi = {
  async get<T>(path: string): Promise<T> {
    // Swap this mock for fetch(`${apiConfig.baseUrl}${path}`, { headers }) when API is ready.
    console.info(`[mock-api] GET ${apiConfig.baseUrl}${path}`)
    return Promise.resolve({} as T)
  },
}
const iconNames = ['LayoutDashboard', 'PackageCheck', 'Boxes', 'ReceiptText', 'UsersRound', 'Store', 'Map', 'Truck', 'KeyRound', 'BarChart3'] as const
export type IconName = typeof iconNames[number]
export const isIconName = (value: string): value is IconName => iconNames.includes(value as IconName)
