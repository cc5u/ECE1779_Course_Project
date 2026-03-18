import { Response, NextFunction } from "express";
import { AuthRequest, ReportQueryParams } from "../types";
import * as reportService from "../services/reportService";
import { createReportSchema, updateReportSchema } from "../utils/validation";
import { broadcastToReport } from "../utils/websocket";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = createReportSchema.parse(req.body);
    const report = await reportService.createReport(req.user!.id, input);
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.getReportById(req.params.id);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as ReportQueryParams;
    const result = await reportService.listReports(query);
    res.json({
      success: true,
      data: result.reports,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = updateReportSchema.parse(req.body);
    const report = await reportService.updateReport(req.params.id, req.user!.id, input);

    // Broadcast status change to subscribers
    if (input.status) {
      broadcastToReport(req.params.id, {
        type: "status_change",
        reportId: req.params.id,
        newStatus: input.status,
        data: report,
      });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await reportService.deleteReport(req.params.id, req.user!.id);
    res.json({ success: true, message: "Report deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getMyReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reports = await reportService.getReportsByOwner(req.user!.id);
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
}

export async function getMapData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reports = await reportService.getMapReports();
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
}
