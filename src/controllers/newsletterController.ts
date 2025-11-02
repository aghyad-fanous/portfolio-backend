import { Request, Response } from 'express'
import { Resend } from 'resend'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * 💡 دالة مساعدة لترميز النص ليتوافق مع تنسيق MarkdownV2 في التليجرام.
 * يجب ترميز الأحرف: _, *, [, ], (, ), ~, `, >, #, +, -, =, |, {, }, ., !
 */
const escapeMarkdownV2 = (text: string) => {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
};

// 📨 الاشتراك بالبريد
export const subscribe = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const exists = await prisma.subscriber.findUnique({ where: { email } })
    if (exists) return res.status(400).json({ message: 'Already subscribed' })

    await prisma.subscriber.create({ data: { email } })
    return res.status(201).json({ message: 'Subscribed successfully' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// 📣 إرسال إشعار بالبريد والتلغرام
export const notify = async (req: Request, res: Response) => {
  try {
    const { subject, message } = req.body
    if (!subject || !message)
      return res.status(400).json({ message: 'Subject and message required' })

    // جلب المشتركين من القاعدة
    const subscribers = await prisma.subscriber.findMany()
    if (subscribers.length === 0)
      return res.status(200).json({ message: 'No subscribers found' })

    // إرسال البريد عبر Resend
    type Subscriber = { 
        id: string
        email: string
        subsecribedAt: Date
     }
    await Promise.all(
      subscribers.map((sub:Subscriber) =>
        resend.emails.send({
          from: 'Aghyad Fanous Blog <aghyad.fanous@gmail.com>',
          to: sub.email,
          subject,
          html: `<p>${message}</p>`,
        })
      )
    )

    // إرسال نفس الرسالة لقناة تلغرام
    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHANNEL = process.env.TELEGRAM_CHANNEL_ID

    if (TELEGRAM_TOKEN && TELEGRAM_CHANNEL) {
        
        // 1. ترميز Subject و Message
        const escapedSubject = escapeMarkdownV2(subject);
        const escapedMessage = escapeMarkdownV2(message);
        
        // 2. تجميع الرسالة بتنسيق MarkdownV2 (غامق للعنوان، وفصل بسطرين)
        const telegramText = 
            `*📰 ${escapedSubject}*\n\n` + 
            `${escapedMessage}`;

      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        {
          chat_id: TELEGRAM_CHANNEL,
          text: telegramText,
          parse_mode: 'MarkdownV2', // ⬅️ تم التغيير إلى MarkdownV2
        }
      )
    }

    return res.status(200).json({ message: 'Notification sent successfully' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Failed to send notifications' })
  }
}