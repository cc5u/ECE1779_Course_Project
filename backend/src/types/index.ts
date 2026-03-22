import { Request } from "express";

export interface AuthUser {
  id: string;
  uoftEmail: string;
  displayName: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface ReportQueryParams {
  status?: string;
  search?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: string;
}
