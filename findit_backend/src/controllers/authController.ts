import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as authService from "../services/authService";
import { registerSchema, loginSchema } from "../utils/validation";

export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getProfile(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
