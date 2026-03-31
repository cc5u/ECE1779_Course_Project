import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as messageService from "../services/messageService";
import { createMessageSchema } from "../utils/validation";
import { sendToUser } from "../utils/websocket";

export async function send(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = createMessageSchema.parse(req.body);
    const reportId = String(req.params.reportId);
    const message = await messageService.sendMessage(reportId, req.user!.id, input);

    // Also notify the receiver directly
    sendToUser(input.receiverId, {
      type: "new_message_notification",
      reportId,
      from: req.user!.displayName,
      preview: input.messageText.substring(0, 100),
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
}

export async function listByReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reportId = String(req.params.reportId);
    const messages = await messageService.getMessagesByReport(reportId, req.user!.id);
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
}

export async function getConversations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const conversations = await messageService.getUserConversations(req.user!.id);
    res.json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
}
