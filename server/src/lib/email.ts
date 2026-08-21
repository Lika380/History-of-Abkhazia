import nodemailer from 'nodemailer'

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env

const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      })
    : null

export async function sendLoginCode(email: string, code: string) {
  if (!transporter) {
    // Dev-фоллбэк: SMTP не настроен, код печатается в консоль сервера.
    console.log(`[DEV EMAIL] Login code for ${email}: ${code}`)
    return
  }

  await transporter.sendMail({
    from: SMTP_FROM ?? SMTP_USER,
    to: email,
    subject: 'Код для входа',
    text: `Ваш код для входа: ${code}\n\nКод действителен 10 минут.`,
  })
}
