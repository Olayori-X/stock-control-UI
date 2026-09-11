export const ROUTE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export type RouteDay = typeof ROUTE_DAYS[number]