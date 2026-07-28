// Shallow camelCase <-> snake_case key conversion for talking to Postgres.
// Date fields are NOT touched here — each entity's read/write functions in
// queries.ts convert their own date fields to/from `Date` explicitly, since
// which fields are dates varies per entity.

function camelToSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

// `undefined` becomes `null` (not omitted) so clearing an optional field
// (e.g. toggling a bill off installment mode) actually clears the column
// instead of leaving the previous value in place.
export function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnakeKey(key)] = value === undefined ? null : value
  }
  return result
}

export function toCamelCase<T = Record<string, unknown>>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamelKey(key)] = value
  }
  return result as T
}
 