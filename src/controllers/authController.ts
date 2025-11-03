// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";

const COOKIE_NAME = process.env.COOKIE_NAME || "token";
const COOKIE_MAX_AGE = Number(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// ===================== REGISTER =====================
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as { email: string; password: string; name?: string };

    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) return res.status(403).json({ message: "Registration restricted to admin emails only." });

    const existing = await prisma.user.findUnique({ where: { email } }).catch(err => {
      console.error("Prisma findUnique error:", err);
      throw new Error("Database lookup failed");
    });

    if (existing) return res.status(409).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10).catch(err => {
      console.error("Hashing error:", err);
      throw new Error("Password hashing failed");
    });

    const user = await prisma.user.create({
      data: { email, password: hashed, name: name ?? null, role: "ADMIN" },
    }).catch(err => {
      console.error("Prisma create error:", err);
      throw new Error("Database write failed");
    });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    }).status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      message: "Admin registered successfully",
    });
  } catch (err: any) {
    console.error("🔥 register error:", err.message);
    res.status(500).json({ message: err.message || "Server error", context: "register" });
  }
};

// ===================== LOGIN =====================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await prisma.user.findUnique({ where: { email } }).catch(err => {
      console.error("Prisma findUnique error:", err);
      throw new Error("Database lookup failed");
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password).catch(err => {
      console.error("Bcrypt compare error:", err);
      throw new Error("Password validation failed");
    });

    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    }).status(200).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      message: "Logged in successfully",
    });
  } catch (err: any) {
    console.error("🔥 login error:", err.message);
    res.status(500).json({ message: err.message || "Server error", context: "login" });
  }
};

// ===================== LOGOUT =====================
export const logout = async (_req: Request, res: Response) => {
  try {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    }).status(200).json({ message: "Logged out successfully" });
  } catch (err: any) {
    console.error("🔥 logout error:", err.message);
    res.status(500).json({ message: err.message || "Server error", context: "logout" });
  }
};

// ===================== ME =====================
export const me = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (!authReq.user) return res.status(401).json({ message: "Not authenticated" });

    const user = await prisma.user.findUnique({ where: { id: authReq.user.id } }).catch(err => {
      console.error("Prisma findUnique error:", err);
      throw new Error("Database lookup failed");
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err: any) {
    console.error("🔥 me error:", err.message);
    res.status(500).json({ message: err.message || "Server error", context: "me" });
  }
};
