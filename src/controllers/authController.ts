// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";

const COOKIE_NAME = process.env.COOKIE_NAME || "token";
const COOKIE_MAX_AGE = Number(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000;

// نحول اللستة من env لمصفوفة نظيفة
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as { email: string; password: string; name?: string };

    // 🔒 التحقق من السماح بالتسجيل
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({ message: "Registration is restricted to admin emails only." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashed, name: name ?? null, role: "ADMIN" },
    });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res
      .cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      })
      .status(201)
      .json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        message: "Admin registered successfully",
      });
  } catch (err: any) {
    console.error("register error:", err.message || err);
    return res.status(500).json({ message: "Server error" });
  }
};
