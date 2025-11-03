import { Request, Response } from 'express'
import { Resend } from 'resend'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

// دالة لترميز النص لتنسيق MarkdownV2 في تيلغرام
const escapeMarkdownV2 = (text: string) =>
  text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')

// 📨 الاشتراك بالبريد
export const subscribe = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // التحقق من وجود المشترك
    const exists = await prisma.subscriber.findUnique({ where: { email } }).catch(err => {
      console.error('❌ Database error (findUnique):', err)
      throw new Error('Database connection failed')
    })

    if (exists) {
      return res.status(400).json({ message: 'Already subscribed' })
    }

    // إنشاء مشترك جديد
    await prisma.subscriber.create({ data: { email } }).catch(err => {
      console.error('❌ Database error (create):', err)
      throw new Error('Database write failed')
    })

    return res.status(201).json({ message: 'Subscribed successfully' })
  } catch (err: any) {
    console.error('🔥 Subscribe Error:', err.message)
    return res.status(500).json({
      message: err.message || 'Server error',
      context: 'subscribe',
    })
  }
}

// 📣 إرسال إشعار بالبريد والتلغرام
export const notify = async (req: Request, res: Response) => {
  try {
    const { subject, message } = req.body
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message required' })
    }

    // جلب المشتركين
    const subscribers = await prisma.subscriber.findMany().catch(err => {
      console.error('❌ Database error (findMany):', err)
      throw new Error('Database connection failed')
    })

    if (subscribers.length === 0) {
      return res.status(200).json({ message: 'No subscribers found' })
    }

    // 📨 محاولة إرسال البريد عبر Resend (مع تجاهل الأخطاء الفردية)
    const emailErrors: string[] = []

    await Promise.all(
      subscribers.map(async (sub) => {
        try {
          await resend.emails.send({
            from: 'Aghyad Fanous Blog <aghyad.fanous@resend.dev>',
            to: sub.email,
            subject,
            html: `<p>${message}</p>`,
          })
        } catch (err: any) {
          console.error(`❌ Email send failed for ${sub.email}:`, err.message)
          emailErrors.push(sub.email)
        }
      })
    )

    // 💬 إرسال إشعار لتيلغرام (مع حماية إضافية)
    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHANNEL = process.env.TELEGRAM_CHANNEL_ID

    if (TELEGRAM_TOKEN && TELEGRAM_CHANNEL) {
      try {
        const escapedSubject = escapeMarkdownV2(subject)
        const escapedMessage = escapeMarkdownV2(message)
        const telegramText = `*📰 ${escapedSubject}*\n\n${escapedMessage}`

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          chat_id: TELEGRAM_CHANNEL,
          text: telegramText,
          parse_mode: 'MarkdownV2',
        })
      } catch (err: any) {
        console.error('❌ Telegram send failed:', err.message)
      }
    } else {
      console.warn('⚠️ Telegram credentials missing, skipped notification')
    }

    return res.status(200).json({
      message: 'Notification process finished',
      telegramSent: Boolean(TELEGRAM_TOKEN && TELEGRAM_CHANNEL),
      failedEmails: emailErrors,
    })
  } catch (err: any) {
    console.error('🔥 Notify Error:', err.message)
    return res.status(500).json({
      message: err.message || 'Failed to send notifications',
      context: 'notify',
    })
  }
}
