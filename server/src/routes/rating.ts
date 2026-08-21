import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const TOPIC_ID_PATTERN = /^s[0-9]+-[0-9]+$/

export const ratingRouter = Router()

ratingRouter.post('/attempts', requireAuth, async (req, res) => {
  const { topicId, score, totalQuestions } = req.body ?? {}

  if (typeof topicId !== 'string' || !TOPIC_ID_PATTERN.test(topicId)) {
    res.status(400).json({ error: 'invalid_topic' })
    return
  }
  if (
    !Number.isInteger(score) ||
    !Number.isInteger(totalQuestions) ||
    score < 0 ||
    totalQuestions <= 0 ||
    score > totalQuestions
  ) {
    res.status(400).json({ error: 'invalid_score' })
    return
  }

  await pool.query(
    'INSERT INTO quiz_attempts (user_id, topic_id, score, total_questions) VALUES (?, ?, ?, ?)',
    [req.user!.id, topicId, score, totalQuestions],
  )
  res.json({ ok: true })
})

ratingRouter.get('/me', requireAuth, async (req, res) => {
  const [totalRows] = await pool.query<(RowDataPacket & { total: number | null })[]>(
    'SELECT SUM(score) AS total FROM quiz_attempts WHERE user_id = ?',
    [req.user!.id],
  )
  const [byTopicRows] = await pool.query<
    (RowDataPacket & { topic_id: string; total: number; attempts: number; best_score: number; best_total: number })[]
  >(
    `SELECT topic_id, SUM(score) AS total, COUNT(*) AS attempts,
            MAX(score) AS best_score, MAX(total_questions) AS best_total
     FROM quiz_attempts WHERE user_id = ? GROUP BY topic_id`,
    [req.user!.id],
  )

  res.json({
    total: Number(totalRows[0]?.total ?? 0),
    byTopic: byTopicRows.map((r) => ({
      topicId: r.topic_id,
      total: Number(r.total),
      attempts: Number(r.attempts),
      bestScore: Number(r.best_score),
      totalQuestions: Number(r.best_total),
    })),
  })
})

ratingRouter.get('/leaderboard', async (_req, res) => {
  const [rows] = await pool.query<(RowDataPacket & { email: string; name: string | null; total: number })[]>(
    `SELECT u.email AS email, u.name AS name, SUM(a.score) AS total
     FROM quiz_attempts a
     JOIN users u ON u.id = a.user_id
     GROUP BY a.user_id
     ORDER BY total DESC
     LIMIT 50`,
  )

  const leaderboard = rows.map((r, i) => ({
    rank: i + 1,
    name: r.name ?? r.email.split('@')[0],
    email: r.email,
    total: Number(r.total),
  }))

  res.json({ leaderboard })
})
