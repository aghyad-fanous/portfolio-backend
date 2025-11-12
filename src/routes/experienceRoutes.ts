// src/routes/experienceRoutes.ts

import { Router } from "express";
import {
  createExperience,
  updateExperience,
  deleteExperience,
  getExperiences,
  getExperience,
} from "../controllers/experienceController.js";
// تأكد من أن المسار صحيح لملفات الـ Middleware لديك
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// 🚀 CRUD Experiences

// إنشاء خبرة جديدة (Admin فقط)
router.post("/", verifyToken, requireAdmin, createExperience);

// تعديل خبرة (Admin فقط)
router.put("/:id", verifyToken, requireAdmin, updateExperience);

// حذف خبرة (Admin فقط)
router.delete("/:id", verifyToken, requireAdmin, deleteExperience);

// ----------------------------------------------------
// جلب جميع الخبرات (متاحة للعامة)
router.get("/", getExperiences);

// جلب خبرة واحدة حسب id (متاحة للعامة)
router.get("/:id", getExperience);

export default router;