// src/controllers/projectController.ts
import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ================== CRUD ==================

// إنشاء مشروع جديد (Admin فقط)
export const createProject = async (req: Request, res: Response) => {
  try {
    const { title, description, image, liveUrl, codeUrl, tags } = req.body as {
      title: string;
      description: string;
      image?: string;
      liveUrl?: string;
      codeUrl?: string;
      tags: string[];
    };
    const ownerId = (req as any).user?.id;

    if (!title || !description || !tags?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const project = await prisma.project.create({
      data: { title, description, image, liveUrl, codeUrl, tags, ownerId },
    });

    return res.status(201).json(project);
  } catch (err: any) {
    console.error("🔥 createProject error:", err.message);
    return res.status(500).json({ message: "Server error", context: "createProject" });
  }
};

// تعديل مشروع (Admin فقط)
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, image, liveUrl, codeUrl, tags } = req.body as {
      title?: string;
      description?: string;
      image?: string;
      liveUrl?: string;
      codeUrl?: string;
      tags?: string[];
    };

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const updated = await prisma.project.update({
      where: { id },
      data: { title, description, image, liveUrl, codeUrl, tags },
    });

    return res.json(updated);
  } catch (err: any) {
    console.error("🔥 updateProject error:", err.message);
    return res.status(500).json({ message: "Server error", context: "updateProject" });
  }
};

// حذف مشروع (Admin فقط)
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ message: "Project not found" });

    await prisma.project.delete({ where: { id } });
    return res.json({ message: "Project deleted successfully" });
  } catch (err: any) {
    console.error("🔥 deleteProject error:", err.message);
    return res.status(500).json({ message: "Server error", context: "deleteProject" });
  }
};

// جلب جميع المشاريع
export const getProjects = async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    return res.json(projects);
  } catch (err: any) {
    console.error("🔥 getProjects error:", err.message);
    return res.status(500).json({ message: "Server error", context: "getProjects" });
  }
};

// جلب مشروع واحد حسب id
export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json(project);
  } catch (err: any) {
    console.error("🔥 getProject error:", err.message);
    return res.status(500).json({ message: "Server error", context: "getProject" });
  }
};
