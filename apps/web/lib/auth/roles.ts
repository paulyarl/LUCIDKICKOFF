export type AppRole = 'admin' | 'parent' | 'child'

export const ROLES: AppRole[] = ['admin', 'parent', 'child']

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (ROLES as string[]).includes(value)
}
