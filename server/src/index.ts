import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { pool } from './db.js'
import { ensureSchema } from './schema.js'
import { authRouter } from './routes/auth.js'
import { characterRouter } from './routes/character.js'
import { ratingRouter } from './routes/rating.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'ok' })
  } catch (err) {
    res.status(500).json({ status: 'ok', db: 'error', message: (err as Error).message })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/character', characterRouter)
app.use('/api/rating', ratingRouter)

const port = Number(process.env.PORT ?? 3001)
ensureSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`server listening on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error('Failed to initialize DB schema', err)
    process.exit(1)
  })
