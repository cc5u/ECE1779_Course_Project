import { Router } from "express";
import * as messageController from "../controllers/messageController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/messages/conversations         — get all user's conversations
router.get("/conversations", requireAuth, messageController.getConversations);

// GET /api/reports/:reportId/messages     — get messages for a report
router.get("/:reportId/messages", requireAuth, messageController.listByReport);

// POST /api/reports/:reportId/messages    — send a message
router.post("/:reportId/messages", requireAuth, messageController.send);

export default router;
