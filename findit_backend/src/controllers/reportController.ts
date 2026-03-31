import { Response, NextFunction } from "express";
import { AuthRequest, ReportQueryParams } from "../types";
import * as reportService from "../services/reportService";
import { createReportSchema, updateReportSchema } from "../utils/validation";
import { broadcastToReport, broadcastToReports } from "../utils/websocket";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = createReportSchema.parse(req.body);
    const report = await reportService.createReport(req.user!.id, input);

    broadcastToReports({
      type: "report_created",
      reportId: report.id,
      data: report,
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reportId = String(req.params.id);
    const report = await reportService.getReportById(reportId);
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
    const reportId = String(req.params.id);
    const report = await reportService.updateReport(reportId, req.user!.id, input);

    broadcastToReports({
      type: "report_updated",
      reportId,
      data: report,
    });

    broadcastToReport(reportId, {
      type: "report_updated",
      reportId,
      data: report,
    });

    // Broadcast status change to subscribers
    if (input.status) {
      broadcastToReport(reportId, {
        type: "status_change",
        reportId,
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
    const reportId = String(req.params.id);
    await reportService.deleteReport(reportId, req.user!.id);

    const deletedEvent = {
      type: "report_deleted",
      reportId,
      data: { id: reportId },
    };

    broadcastToReports(deletedEvent);
    broadcastToReport(reportId, deletedEvent);

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
