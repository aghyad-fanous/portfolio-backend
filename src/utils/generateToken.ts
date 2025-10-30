// src/utils/generateToken.ts
import jwt, { Secret } from "jsonwebtoken";

type TokenPayload = {
  userId: string;
  email: string;
  role: string;
};

const JWT_SECRET : Secret = process.env.JWT_SECRET || "change_this_secret";

export const generateToken = (payload: TokenPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
