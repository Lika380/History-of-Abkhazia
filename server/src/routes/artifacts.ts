import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const artifactsRouter = Router()

async function getCoinBalance(userId: number): Promise<number> {
  const [passedRows] = await pool.query<(RowDataPacket & { passed: number })[]>(
    `SELECT COUNT(*) AS passed FROM (
       SELECT topic_id, MAX(score) AS best, MAX(total_questions) AS total
       FROM quiz_attempts WHERE user_id = ? GROUP BY topic_id
       HAVING best = total AND total > 0
     ) t`,
    [userId],
  )
  const [unlockedRows] = await pool.query<(RowDataPacket & { unlocked: number })[]>(
    'SELECT COUNT(*) AS unlocked FROM artifact_unlocks WHERE user_id = ?',
    [userId],
  )
  const testsPassed = Number(passedRows[0]?.passed ?? 0)
  const unlockedCount = Number(unlockedRows[0]?.unlocked ?? 0)
  return Math.max(0, testsPassed - unlockedCount)
}

artifactsRouter.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query<(RowDataPacket & { artifact_id: string })[]>(
    'SELECT artifact_id FROM artifact_unlocks WHERE user_id = ?',
    [req.user!.id],
  )
  const coins = await getCoinBalance(req.user!.id)
  res.json({ unlockedIds: rows.map((r) => r.artifact_id), coins })
})

artifactsRouter.post('/unlock', requireAuth, async (req, res) => {
  const artifactId = req.body?.artifactId
  if (typeof artifactId !== 'string' || !artifactId || artifactId.length > 64) {
    res.status(400).json({ error: 'invalid_artifact' })
    return
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM artifact_unlocks WHERE user_id = ? AND artifact_id = ?',
    [req.user!.id, artifactId],
  )
  if (existing.length > 0) {
    res.status(400).json({ error: 'already_unlocked' })
    return
  }

  const coins = await getCoinBalance(req.user!.id)
  if (coins <= 0) {
    res.status(400).json({ error: 'not_enough_coins' })
    return
  }

  await pool.query('INSERT INTO artifact_unlocks (user_id, artifact_id) VALUES (?, ?)', [req.user!.id, artifactId])
  res.json({ ok: true })
})
