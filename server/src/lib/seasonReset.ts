import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'
import { seasonStart, seasonYear } from './season.js'

const TOP_N = 20

// Кто не попал в топ-20 прошедшего сезона, теряет весь прогресс (галочки
// тестов, монеты — они считаются от количества попыток, — и артефакты).
// Призёры сохраняют всё навсегда. Идемпотентно: каждый сезон обрабатывается
// только один раз (см. таблицу season_resets), поэтому безопасно вызывать
// сколько угодно раз — например, на каждом старте сервера.
async function getTopUserIds(year: number): Promise<number[]> {
  const [rows] = await pool.query<(RowDataPacket & { user_id: number })[]>(
    `SELECT user_id, SUM(score) AS total
     FROM quiz_attempts
     WHERE created_at >= ? AND created_at < ?
     GROUP BY user_id
     ORDER BY total DESC, user_id ASC
     LIMIT ${TOP_N}`,
    [seasonStart(year), seasonStart(year + 1)],
  )
  return rows.map((r) => r.user_id)
}

async function resetSeason(year: number) {
  const topUserIds = await getTopUserIds(year)

  if (topUserIds.length > 0) {
    const placeholders = topUserIds.map(() => '?').join(', ')
    await pool.query(`DELETE FROM quiz_attempts WHERE user_id NOT IN (${placeholders})`, topUserIds)
    await pool.query(`DELETE FROM artifact_unlocks WHERE user_id NOT IN (${placeholders})`, topUserIds)
  } else {
    await pool.query('DELETE FROM quiz_attempts')
    await pool.query('DELETE FROM artifact_unlocks')
  }

  await pool.query('INSERT IGNORE INTO season_resets (season_year) VALUES (?)', [year])
  console.log(`Season ${year} reset: kept ${topUserIds.length} top participants, wiped the rest`)
}

export async function runSeasonResetIfNeeded() {
  const justEndedYear = seasonYear() - 1

  const [processed] = await pool.query<RowDataPacket[]>('SELECT 1 FROM season_resets WHERE season_year = ?', [
    justEndedYear,
  ])
  if (processed.length > 0) return

  const [hasAttempts] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM quiz_attempts WHERE created_at >= ? AND created_at < ? LIMIT 1',
    [seasonStart(justEndedYear), seasonStart(justEndedYear + 1)],
  )
  if (hasAttempts.length === 0) {
    await pool.query('INSERT IGNORE INTO season_resets (season_year) VALUES (?)', [justEndedYear])
    return
  }

  await resetSeason(justEndedYear)
}
