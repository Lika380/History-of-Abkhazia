import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'
import { sendLoginCode } from '../lib/email.js'
import { signSession, SESSION_COOKIE_NAME, sessionCookieOptions } from '../lib/jwt.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  generateCode,
  hashCode,
  verifyCodeHash,
  OTP_CODE_TTL_MS,
  OTP_REQUEST_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
} from '../lib/otp.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  return EMAIL_RE.test(email) ? email : null
}

interface LoginCodeRow extends RowDataPacket {
  id: number
  code_hash: string
  expires_at: Date
  attempts: number
  requested_at: Date
}

export const authRouter = Router()

authRouter.post('/request-code', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  if (!email) {
    res.status(400).json({ error: 'invalid_email' })
    return
  }

  const [rows] = await pool.query<LoginCodeRow[]>(
    'SELECT id, requested_at FROM login_codes WHERE email = ? ORDER BY requested_at DESC LIMIT 1',
    [email],
  )
  const last = rows[0]
  if (last) {
    const elapsed = Date.now() - new Date(last.requested_at).getTime()
    if (elapsed < OTP_REQUEST_COOLDOWN_MS) {
      res.status(429).json({
        error: 'cooldown',
        retryAfterSeconds: Math.ceil((OTP_REQUEST_COOLDOWN_MS - elapsed) / 1000),
      })
      return
    }
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + OTP_CODE_TTL_MS)
  await pool.query('INSERT INTO login_codes (email, code_hash, expires_at) VALUES (?, ?, ?)', [
    email,
    hashCode(code),
    expiresAt,
  ])

  // Не ждём реальную отправку письма — SMTP может быть медленным (особенно
  // первое соединение после старта сервера) и превышать таймаут клиента.
  sendLoginCode(email, code).catch((err) => {
    console.error('Failed to send login code email', err)
  })

  res.json({ ok: true })
})

authRouter.post('/verify-code', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : null
  if (!email || !code) {
    res.status(400).json({ error: 'invalid_request' })
    return
  }

  const [rows] = await pool.query<LoginCodeRow[]>(
    'SELECT id, code_hash, expires_at, attempts FROM login_codes WHERE email = ? AND consumed_at IS NULL ORDER BY requested_at DESC LIMIT 1',
    [email],
  )
  const pending = rows[0]
  if (!pending) {
    res.status(400).json({ error: 'no_pending_code' })
    return
  }
  if (new Date(pending.expires_at).getTime() < Date.now()) {
    res.status(400).json({ error: 'expired' })
    return
  }
  if (pending.attempts >= OTP_MAX_ATTEMPTS) {
    res.status(400).json({ error: 'too_many_attempts' })
    return
  }

  if (!verifyCodeHash(code, pending.code_hash)) {
    await pool.query('UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?', [pending.id])
    res.status(400).json({ error: 'invalid_code' })
    return
  }

  await pool.query('UPDATE login_codes SET consumed_at = NOW() WHERE id = ?', [pending.id])
  await pool.query('INSERT IGNORE INTO users (email) VALUES (?)', [email])
  const [userRows] = await pool.query<(RowDataPacket & { id: number; email: string; name: string | null })[]>(
    'SELECT id, email, name FROM users WHERE email = ?',
    [email],
  )
  const user = userRows[0]

  const token = signSession({ sub: user.id, email: user.email })
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions())
  res.json({ user })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query<(RowDataPacket & { id: number; email: string; name: string | null })[]>(
    'SELECT id, email, name FROM users WHERE id = ?',
    [req.user!.id],
  )
  const user = rows[0]
  if (!user) {
    res.status(401).json({ error: 'unauthenticated' })
    return
  }
  res.json({ user })
})

authRouter.put('/name', requireAuth, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name || name.length > 100) {
    res.status(400).json({ error: 'invalid_name' })
    return
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM users WHERE LOWER(name) = LOWER(?) AND id != ?',
    [name, req.user!.id],
  )
  if (existing.length > 0) {
    res.status(400).json({ error: 'name_taken' })
    return
  }

  await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user!.id])
  res.json({ name })
})

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions())
  res.json({ ok: true })
})
