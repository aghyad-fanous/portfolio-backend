// src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: string;
  };
};

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 🚨 التعديل: التركيز على قراءة التوكن من هيدر Authorization فقط
    const authHeader = req.headers.authorization;
    
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authenticated (Token missing from Authorization header)" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

    // optional: fetch fresh user from DB (to verify role/exists)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) return res.status(401).json({ message: "Invalid token (user not found)" });

    req.user = { id: user.id, email: user.email, role: user.role };

    return next();
  } catch (err: any) {
    console.error("verifyToken error:", err.message || err);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden: Admins only" });
  return next();
};
