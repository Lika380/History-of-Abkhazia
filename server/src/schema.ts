import type { RowDataPacket } from 'mysql2'
import { pool } from './db.js'

async function ensureColumn(table: string, column: string, ddl: string) {
  const [columns] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  )
  if (columns.length === 0) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
  }
}

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_codes (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      code_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
      requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consumed_at TIMESTAMP NULL DEFAULT NULL,
      INDEX idx_login_codes_email (email)
    )
  `)

  // На MariaDB с explicit_defaults_for_timestamp=0 «голая» колонка TIMESTAMP
  // без явного DEFAULT неявно получает ON UPDATE CURRENT_TIMESTAMP — из-за
  // этого expires_at сбрасывался на «сейчас» при любом обновлении строки
  // (неверная попытка, подтверждение кода), и код мгновенно «истекал».
  // DATETIME такого поведения не имеет; чиним колонку на уже созданной базе.
  await pool.query(`ALTER TABLE login_codes MODIFY COLUMN expires_at DATETIME NOT NULL`)

  await pool.query(`DELETE FROM login_codes WHERE requested_at < NOW() - INTERVAL 1 DAY`)

  await ensureColumn('users', 'character_id', 'character_id VARCHAR(32) NULL')
  await ensureColumn('users', 'name', 'name VARCHAR(100) NULL')
  await ensureColumn('users', 'avatar', 'avatar MEDIUMTEXT NULL')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      topic_id VARCHAR(64) NOT NULL,
      score TINYINT UNSIGNED NOT NULL,
      total_questions TINYINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_quiz_attempts_user (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS artifact_unlocks (
      user_id INT UNSIGNED NOT NULL,
      artifact_id VARCHAR(64) NOT NULL,
      unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, artifact_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS season_resets (
      season_year SMALLINT UNSIGNED PRIMARY KEY,
      processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}
