import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";
const COOKIE_NAME = process.env.COOKIE_NAME || "token";
const COOKIE_MAX_AGE = Number(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
// ✅ التسجيل مسموح فقط للإيميلات الموجودة في ADMIN_EMAILS
export const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password)
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
            return res
                .status(403)
                .json({ message: "Registration restricted to admin emails only." });
        }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing)
            return res.status(409).json({ message: "User already exists" });
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashed, name: name ?? null, role: "ADMIN" },
        });
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        res
            .cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: COOKIE_MAX_AGE,
        })
            .status(201)
            .json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            message: "Admin registered successfully",
        });
    }
    catch (err) {
        console.error("register error:", err.message || err);
        res.status(500).json({ message: "Server error" });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ message: "Invalid credentials" });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ message: "Invalid credentials" });
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        res
            .cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: COOKIE_MAX_AGE,
        })
            .json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            message: "Logged in",
        });
    }
    catch (err) {
        console.error("login error:", err.message || err);
        res.status(500).json({ message: "Server error" });
    }
};
export const logout = async (_req, res) => {
    res
        .clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    })
        .json({ message: "Logged out" });
};
export const me = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user)
            return res.status(401).json({ message: "Not authenticated" });
        const user = await prisma.user.findUnique({
            where: { id: authReq.user.id },
        });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error("me error:", err.message || err);
        res.status(500).json({ message: "Server error" });
    }
};
