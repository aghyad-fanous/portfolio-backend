import { Request, Response } from 'express'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 💬 دالة إرسال إشعار
const sendNotification = async (title: string, content: string) => {
  const BASE_URL = process.env.BASE_URL
  if (!BASE_URL) {
    console.warn('⚠️ BASE_URL not set, skipping notification')
    return
  }

  try {
    await axios.post(`${BASE_URL}/api/newsletter/notify`, {
      subject: `مقال جديد: ${title}`,
      message: `${content.slice(0, 150)}... اقرأ المزيد على موقعنا.`,
    })
    console.log('✅ Notification sent successfully')
  } catch (err: any) {
    console.error('❌ sendNotification error:', err.response?.data || err.message)
  }
}

// ================== CRUD ==================

// 🟢 إنشاء مقال جديد (Admin فقط)
export const createBlog = async (req: Request, res: Response) => {
  try {
    const { title, slug, content, thumbnail, category } = req.body
    const authorId = (req as any).user?.id

    if (!title || !slug || !content || !category) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const blog = await prisma.blog.create({
      data: { title, slug, content, thumbnail, category, authorId },
    }).catch(err => {
      console.error('❌ Database error (createBlog):', err)
      throw new Error('Database write failed')
    })

    // 🔔 إرسال إشعار بدون تعطيل العملية
    sendNotification(title, content).catch(err => {
      console.error('⚠️ Notification failed:', err.message)
    })

    return res.status(201).json(blog)
  } catch (err: any) {
    console.error('🔥 createBlog error:', err.message)
    return res.status(500).json({
      message: err.message || 'Server error',
      context: 'createBlog',
    })
  }
}

// 🟡 تعديل مقال (Admin فقط)
export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { title, slug, content, thumbnail, category } = req.body

    const blog = await prisma.blog.findUnique({ where: { id } }).catch(err => {
      console.error('❌ Database error (findUnique):', err)
      throw new Error('Database connection failed')
    })
    if (!blog) return res.status(404).json({ message: 'Blog not found' })

    const updated = await prisma.blog.update({
      where: { id },
      data: { title, slug, content, thumbnail, category },
    }).catch(err => {
      console.error('❌ Database error (update):', err)
      throw new Error('Database write failed')
    })

    return res.json(updated)
  } catch (err: any) {
    console.error('🔥 updateBlog error:', err.message)
    return res.status(500).json({
      message: err.message || 'Server error',
      context: 'updateBlog',
    })
  }
}

// 🔴 حذف مقال (Admin فقط)
export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const blog = await prisma.blog.findUnique({ where: { id } }).catch(err => {
      console.error('❌ Database error (findUnique):', err)
      throw new Error('Database connection failed')
    })
    if (!blog) return res.status(404).json({ message: 'Blog not found' })

    await prisma.blog.delete({ where: { id } }).catch(err => {
      console.error('❌ Database error (delete):', err)
      throw new Error('Database delete failed')
    })

    return res.json({ message: 'Blog deleted successfully' })
  } catch (err: any) {
    console.error('🔥 deleteBlog error:', err.message)
    return res.status(500).json({
      message: err.message || 'Server error',
      context: 'deleteBlog',
    })
  }
}

// 📚 جلب جميع المقالات
export const getBlogs = async (_req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true, email: true } } },
    }).catch(err => {
      console.error('❌ Database error (getBlogs):', err)
      throw new Error('Database read failed')
    })

    return res.json(blogs)
  } catch (err: any) {
    console.error('🔥 getBlogs error:', err.message)
    return res.status(500).json({
      message: err.message || 'Server error',
      context: 'getBlogs',
    })
  }
}

// 📄 جلب مقال واحد حسب slug
export const getBlog = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params

    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: { author: { select: { id: true, name: true, email: true } } },
    }).catch(err => {
      console.error('❌ Database error (getBlog):', err)
      throw new Error('Database read failed')
    })

    if (!blog) return res.status(404).json({ message: 'Blog not found' })
    return res.json(blog)
  } catch (err: any) {
    console.error('🔥 getBlog error:', err.message)
    return res.status(500).json({
      message: err.message || 'Server error',
      context: 'getBlog',
    })
  }
}
