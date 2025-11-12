// src/controllers/experienceController.ts

import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client'
import { Experience } from "../shared/types.js"; // قد تحتاج لتعديل مسار الـ Type إذا لم يكن لديك ملف shared/types

const prisma = new PrismaClient()

// ================== CRUD ==================

// إنشاء خبرة جديدة (Admin فقط)
export const createExperience = async (req: Request, res: Response) => {
  try {
    const { title, company, from, to, description, locale } = req.body as Experience;
    const ownerId = (req as any).user?.id; // جلب الـ ownerId من الـ Request بعد الـ verifyToken

    if (!title) { // Title هو الحقل الوحيد الضروري حسب الـ Model
      return res.status(400).json({ message: "Missing required fields: title" });
    }

    const experience = await prisma.experience.create({
      data: { title, company, from, to, description, locale, ownerId },
    });

    return res.status(201).json(experience);
  } catch (err: any) {
    console.error("🔥 createExperience error:", err.message);
    return res.status(500).json({ message: "Server error", context: "createExperience" });
  }
};

// تعديل خبرة (Admin فقط)
export const updateExperience = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // نستخدم Experience ونقوم بحذف الـ id منها لأننا نستخدمه من الـ params
    const { title, company, from, to, description, locale } = req.body as Partial<Experience>;

    const experience = await prisma.experience.findUnique({ where: { id } });
    if (!experience) return res.status(404).json({ message: "Experience not found" });

    const updated = await prisma.experience.update({
      where: { id },
      data: { title, company, from, to, description, locale },
    });

    return res.json(updated);
  } catch (err: any) {
    console.error("🔥 updateExperience error:", err.message);
    return res.status(500).json({ message: "Server error", context: "updateExperience" });
  }
};

// حذف خبرة (Admin فقط)
export const deleteExperience = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const experience = await prisma.experience.findUnique({ where: { id } });
    if (!experience) return res.status(404).json({ message: "Experience not found" });

    await prisma.experience.delete({ where: { id } });
    return res.json({ message: "Experience deleted successfully" });
  } catch (err: any) {
    console.error("🔥 deleteExperience error:", err.message);
    return res.status(500).json({ message: "Server error", context: "deleteExperience" });
  }
};

// ----------------------------------------------------

// جلب جميع الخبرات (متاحة للعامة)
export const getExperiences = async (_req: Request, res: Response) => {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: { from: "desc" }, // الترتيب حسب تاريخ البداية تنازلياً
      // يمكن إضافة include: { owner: { select: { id: true, name: true, email: true } } } إذا كنت تحتاج بيانات الـ Admin
    });
    return res.json(experiences);
  } catch (err: any) {
    console.error("🔥 getExperiences error:", err.message);
    return res.status(500).json({ message: "Server error", context: "getExperiences" });
  }
};

// جلب خبرة واحدة حسب id (متاحة للعامة)
export const getExperience = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const experience = await prisma.experience.findUnique({
      where: { id },
    });

    if (!experience) return res.status(404).json({ message: "Experience not found" });
    return res.json(experience);
  } catch (err: any) {
    console.error("🔥 getExperience error:", err.message);
    return res.status(500).json({ message: "Server error", context: "getExperience" });
  }
};