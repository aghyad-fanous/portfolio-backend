// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";

const COOKIE_NAME = process.env.COOKIE_NAME || "token";
const COOKIE_MAX_AGE = Number(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000; // 7 days

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as { email: string; password: string; name?: string };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    // If first user, make ADMIN
    const usersCount = await prisma.user.count();
    const role = usersCount === 0 ? "ADMIN" : "USER";

    const user = await prisma.user.create({
      data: { email, password: hashed, name: name ?? null, role },
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
        message: "Registered successfully",
      });
  } catch (err: any) {
    console.error("register error:", err.message || err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res
      .cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      })
      .json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        message: "Logged in",
      });
  } catch (err: any) {
    console.error("login error:", err.message || err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res
    .clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .json({ message: "Logged out" });
};

export const me = async (req: Request, res: Response) => {
  try {
    // middleware verifyToken adds req.user
    // but if not using middleware, allow token parsing here
    // prefer to use verifyToken on route
    const authReq = req as any;
    if (!authReq.user) return res.status(401).json({ message: "Not authenticated" });

    const user = await prisma.user.findUnique({ where: { id: authReq.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    console.error("me error:", err.message || err);
    return res.status(500).json({ message: "Server error" });
  }
};
