import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { seasonStart, seasonYear } from '../lib/season.js'

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

  if (score !== totalQuestions) {
    // В рейтинг засчитываются только тесты, пройденные без единой ошибки.
    res.json({ ok: true, counted: false })
    return
  }

  const [existingRows] = await pool.query<(RowDataPacket & { best: number; total: number })[]>(
    `SELECT MAX(score) AS best, MAX(total_questions) AS total
     FROM quiz_attempts WHERE user_id = ? AND topic_id = ?`,
    [req.user!.id, topicId],
  )
  const alreadyPassed =
    existingRows[0]?.best != null && existingRows[0].best === existingRows[0].total

  if (alreadyPassed) {
    // Тема уже пройдена без ошибок — повторные попытки не засчитываются
    // (иначе рейтинг и монеты можно было бы бесконечно фармить пересдачей).
    res.json({ ok: true, counted: false })
    return
  }

  await pool.query(
    'INSERT INTO quiz_attempts (user_id, topic_id, score, total_questions) VALUES (?, ?, ?, ?)',
    [req.user!.id, topicId, score, totalQuestions],
  )
  res.json({ ok: true, counted: true })
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
  const currentSeasonStart = seasonStart(seasonYear())

  const [rows] = await pool.query<(RowDataPacket & { email: string; name: string | null; total: number })[]>(
    `SELECT u.email AS email, u.name AS name, COALESCE(SUM(a.score), 0) AS total
     FROM users u
     LEFT JOIN quiz_attempts a ON a.user_id = u.id AND a.created_at >= ?
     GROUP BY u.id
     ORDER BY total DESC, u.id ASC
     LIMIT 50`,
    [currentSeasonStart],
  )

  const leaderboard = rows.map((r, i) => ({
    rank: i + 1,
    name: r.name ?? r.email.split('@')[0],
    email: r.email,
    total: Number(r.total),
  }))

  res.json({ leaderboard, seasonYear: seasonYear() })
})

// «Зал легенд» — топ-20 прошлых сезонов (с 1 мая по 30 апреля), считается
// на лету из полной истории попыток. У непризёров эта история после конца
// сезона уже стёрта (см. lib/seasonReset.ts), поэтому прошлые сезоны здесь
// естественным образом сужаются до тех самых топ-20.
ratingRouter.get('/legends', async (_req, res) => {
  const [rows] = await pool.query<(RowDataPacket & { email: string; name: string | null; total: number; created_at: Date })[]>(
    `SELECT u.email AS email, u.name AS name, SUM(a.score) AS total, MIN(a.created_at) AS created_at
     FROM quiz_attempts a
     JOIN users u ON u.id = a.user_id
     GROUP BY a.user_id, YEAR(a.created_at) - IF(MONTH(a.created_at) >= 5, 0, 1)`,
  )

  const currentYear = seasonYear()
  const byYear = new Map<number, { name: string; email: string; total: number }[]>()

  for (const r of rows) {
    const year = seasonYear(r.created_at)
    if (year >= currentYear) continue // текущий сезон — ещё не легенда
    const entry = { name: r.name ?? r.email.split('@')[0], email: r.email, total: Number(r.total) }
    const list = byYear.get(year) ?? []
    list.push(entry)
    byYear.set(year, list)
  }

  const legends = [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, entries]) => ({
      year,
      entries: entries
        .sort((a, b) => b.total - a.total)
        .slice(0, 20)
        .map((e, i) => ({ rank: i + 1, ...e })),
    }))

  res.json({ legends })
})
