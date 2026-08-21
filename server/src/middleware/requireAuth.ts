import type { NextFunction, Request, Response } from 'express'
import { SESSION_COOKIE_NAME, sessionCookieOptions, verifySession } from '../lib/jwt.js'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[SESSION_COOKIE_NAME] as string | undefined
  const session = token ? verifySession(token) : null

  if (!session) {
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions())
    res.status(401).json({ error: 'unauthenticated' })
    return
  }

  req.user = { id: session.sub, email: session.email }
  next()
}
