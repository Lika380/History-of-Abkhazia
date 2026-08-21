import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

export const OTP_CODE_TTL_MS = Number(process.env.OTP_CODE_TTL_MINUTES ?? 10) * 60_000
export const OTP_REQUEST_COOLDOWN_MS = Number(process.env.OTP_REQUEST_COOLDOWN_SECONDS ?? 60) * 1000
export const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS ?? 5)

const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET ?? 'dev-otp-secret'

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashCode(code: string): string {
  return createHmac('sha256', OTP_HASH_SECRET).update(code).digest('hex')
}

export function verifyCodeHash(code: string, hash: string): boolean {
  const expected = Buffer.from(hashCode(code))
  const actual = Buffer.from(hash)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}
