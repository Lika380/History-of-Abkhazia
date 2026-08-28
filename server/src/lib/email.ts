import nodemailer from 'nodemailer'

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env

// connectionTimeout — nodemailer 9 резолвит smtp.yandex.ru сразу и в IPv4, и
// в IPv6, потом СЛУЧАЙНО выбирает, с какого адреса подключаться (см.
// shared/index.js: formatDNSValue). Путь по IPv6 до Яндекса с этого VPS
// битый: TCP «подключается», но дальше зависает — а дефолтный таймаут
// подключения у nodemailer 2 минуты, только после него включается запасной
// адрес (тот же IPv4, что уже быстро работает). Отсюда и было в логах
// "Login code email accepted... in 120463ms" — ровно 2 минуты потерь при
// каждом «невезучем» выборе IPv6. Сокращаем таймаут до 10с, чтобы
// откат на IPv4 происходил быстро, а не через 2 минуты.
const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
        connectionTimeout: 10_000,
      })
    : null

export async function sendLoginCode(email: string, code: string) {
  if (!transporter) {
    // Dev-фоллбэк: SMTP не настроен, код печатается в консоль сервера.
    console.log(`[DEV EMAIL] Login code for ${email}: ${code}`)
    return
  }

  const startedAt = Date.now()
  const info = await transporter.sendMail({
    from: SMTP_FROM ?? SMTP_USER,
    to: email,
    subject: 'Код для входа',
    text: `Ваш код для входа: ${code}\n\nКод действителен 10 минут.`,
  })
  console.log(
    `Login code email accepted for ${email} in ${Date.now() - startedAt}ms, messageId=${info.messageId}, response=${info.response}`,
  )
}
