import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const VALID_GENDERS = ['male', 'female']
const MAX_AVATAR_LENGTH = 150_000

export const characterRouter = Router()

characterRouter.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query<(RowDataPacket & { character_id: string | null; avatar: string | null })[]>(
    'SELECT character_id, avatar FROM users WHERE id = ?',
    [req.user!.id],
  )
  res.json({ characterId: rows[0]?.character_id ?? null, avatar: rows[0]?.avatar ?? null })
})

characterRouter.put('/', requireAuth, async (req, res) => {
  const { characterId, avatar } = req.body ?? {}

  const hasCharacterId = characterId !== undefined
  const hasAvatar = avatar !== undefined

  if (hasCharacterId && (typeof characterId !== 'string' || !VALID_GENDERS.includes(characterId))) {
    res.status(400).json({ error: 'invalid_character' })
    return
  }
  if (hasAvatar && avatar !== null && (typeof avatar !== 'string' || !avatar.startsWith('data:image/') || avatar.length > MAX_AVATAR_LENGTH)) {
    res.status(400).json({ error: 'invalid_avatar' })
    return
  }
  if (!hasCharacterId && !hasAvatar) {
    res.status(400).json({ error: 'nothing_to_update' })
    return
  }

  const fields: string[] = []
  const values: (string | null)[] = []
  if (hasCharacterId) {
    fields.push('character_id = ?')
    values.push(characterId)
  }
  if (hasAvatar) {
    fields.push('avatar = ?')
    values.push(avatar)
  }
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...values, req.user!.id])

  const [rows] = await pool.query<(RowDataPacket & { character_id: string | null; avatar: string | null })[]>(
    'SELECT character_id, avatar FROM users WHERE id = ?',
    [req.user!.id],
  )
  res.json({ characterId: rows[0]?.character_id ?? null, avatar: rows[0]?.avatar ?? null })
})
