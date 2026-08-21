import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const VALID_CHARACTER_IDS = [
  'male-1', 'male-2', 'male-3', 'male-4', 'male-5', 'male-6',
  'female-1', 'female-2', 'female-3', 'female-4', 'female-5', 'female-6',
]

export const characterRouter = Router()

characterRouter.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query<(RowDataPacket & { character_id: string | null })[]>(
    'SELECT character_id FROM users WHERE id = ?',
    [req.user!.id],
  )
  res.json({ characterId: rows[0]?.character_id ?? null })
})

characterRouter.put('/', requireAuth, async (req, res) => {
  const characterId = req.body?.characterId
  if (typeof characterId !== 'string' || !VALID_CHARACTER_IDS.includes(characterId)) {
    res.status(400).json({ error: 'invalid_character' })
    return
  }

  await pool.query('UPDATE users SET character_id = ? WHERE id = ?', [characterId, req.user!.id])
  res.json({ characterId })
})
