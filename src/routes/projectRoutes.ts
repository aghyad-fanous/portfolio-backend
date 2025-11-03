// src/routes/projectRoutes.ts
import { Router } from "express";
import {
  createProject,
  updateProject,
  deleteProject,
  getProjects,
  getProject,
} from "../controllers/projectController.js";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// 🚀 CRUD Projects

// إنشاء مشروع جديد (Admin فقط)
router.post("/", verifyToken, requireAdmin, createProject);

// تعديل مشروع (Admin فقط)
router.put("/:id", verifyToken, requireAdmin, updateProject);

// حذف مشروع (Admin فقط)
router.delete("/:id", verifyToken, requireAdmin, deleteProject);

// جلب جميع المشاريع
router.get("/", getProjects);

// جلب مشروع واحد حسب id
router.get("/:id", getProject);

export default router;
