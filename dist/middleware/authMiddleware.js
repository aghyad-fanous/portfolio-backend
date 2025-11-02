import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
export const verifyToken = async (req, res, next) => {
    try {
        // Prefer cookie first
        const token = req.cookies?.token ||
            req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : undefined;
        if (!token) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        // optional: fetch fresh user from DB (to verify role/exists)
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user)
            return res.status(401).json({ message: "Invalid token (user not found)" });
        req.user = { id: user.id, email: user.email, role: user.role };
        return next();
    }
    catch (err) {
        console.error("verifyToken error:", err.message || err);
        return res.status(401).json({ message: "Authentication failed" });
    }
};
export const requireAdmin = (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role !== "ADMIN")
        return res.status(403).json({ message: "Forbidden: Admins only" });
    return next();
};
