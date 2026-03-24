import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";
import prisma from "../prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

interface AuthTokenPayload {
  id: string;
  uoftEmail: string;
  displayName: string;
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
  });
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(401).json({ success: false, error: "User no longer exists" });
      return;
    }

    req.user = {
      id: decoded.id,
      uoftEmail: decoded.uoftEmail,
      displayName: decoded.displayName,
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
      req.user = {
        id: decoded.id,
        uoftEmail: decoded.uoftEmail,
        displayName: decoded.displayName,
      };
    }
  } catch {
    // Token invalid — continue without user
  }
  next();
}
