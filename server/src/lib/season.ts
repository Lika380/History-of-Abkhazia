const SEASON_START_MONTH = 4 // май (0-based: январь=0)

export function seasonYear(date = new Date()): number {
  return date.getUTCMonth() >= SEASON_START_MONTH ? date.getUTCFullYear() : date.getUTCFullYear() - 1
}

export function seasonStart(year: number): Date {
  return new Date(Date.UTC(year, SEASON_START_MONTH, 1))
}
