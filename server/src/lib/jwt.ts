import jwt from 'jsonwebtoken'
import type { CookieOptions } from 'express'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-jwt-secret'
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 30)

export const SESSION_COOKIE_NAME = 'ak_session'

export interface SessionPayload {
  sub: number
  email: string
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_TTL_DAYS}d` })
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as SessionPayload
  } catch {
    return null
  }
}

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 86_400_000,
  }
}
