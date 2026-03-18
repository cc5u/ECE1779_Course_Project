import { Request } from "express";

export interface AuthUser {
  id: string;
  uoftEmail: string;
  displayName: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
