import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as messageService from "../services/messageService";
import { createMessageSchema } from "../utils/validation";
import { broadcastToReport, sendToUser } from "../utils/websocket";

export async function send(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = createMessageSchema.parse(req.body);
    const message = await messageService.sendMessage(req.params.reportId, req.user!.id, input);

    // Broadcast to report subscribers
    broadcastToReport(req.params.reportId, {
      type: "new_message",
      reportId: req.params.reportId,
      data: message,
    });

    // Also notify the receiver directly
    sendToUser(input.receiverId, {
      type: "new_message_notification",
      reportId: req.params.reportId,
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
    const messages = await messageService.getMessagesByReport(req.params.reportId, req.user!.id);
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
