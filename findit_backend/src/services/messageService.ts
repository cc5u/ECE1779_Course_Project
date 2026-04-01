import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { CreateMessageInput } from "../utils/validation";
import { broadcastToReport, sendToUser } from "../utils/websocket";

export async function sendMessage(reportId: string, senderId: string, input: CreateMessageInput) {
  // Verify report exists
  const report = await prisma.lostReport.findUnique({
    where: { id: reportId },
    select: { id: true, ownerId: true, status: true },
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  // Verify receiver exists
  const receiver = await prisma.user.findUnique({
    where: { id: input.receiverId },
    select: { id: true },
  });

  if (!receiver) {
    throw new AppError("Receiver not found", 404);
  }

  // Sender cannot message themselves
  if (senderId === input.receiverId) {
    throw new AppError("You cannot send a message to yourself", 400);
  }

  const message = await prisma.message.create({
    data: {
      reportId,
      senderId,
      receiverId: input.receiverId,
      messageText: input.messageText,
    },
    include: {
      sender: {
        select: { id: true, displayName: true },
      },
      receiver: {
        select: { id: true, displayName: true },
      },
    },
  });

  // Broadcast to anyone viewing this report
  broadcastToReport(reportId, { type: "new_message", reportId, data: message });

  // Mirror the event back to the sender so conversation lists stay live without a manual refresh.
  sendToUser(senderId, { type: "new_message", reportId, data: message });

  // Also send directly to the receiver (even if they're not subscribed to the report)
  sendToUser(input.receiverId, { type: "new_message", reportId, data: message });

  return message;
}

export async function getMessagesByReport(reportId: string, userId: string) {
  // Only return messages where the user is sender or receiver
  const messages = await prisma.message.findMany({
    where: {
      reportId,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: {
        select: { id: true, displayName: true },
      },
      receiver: {
        select: { id: true, displayName: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return messages;
}

/**
 * Get all conversations for a user (grouped by report)
 */
export async function getUserConversations(userId: string) {
  // Find all distinct report IDs where user has messages
  const reports = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: {
      reportId: true,
    },
    distinct: ["reportId"],
  });

  // For each report, get the latest message and report info
  const conversations = await Promise.all(
    reports.map(async ({ reportId }) => {
      const [latestMessage, report] = await Promise.all([
        prisma.message.findFirst({
          where: {
            reportId,
            OR: [{ senderId: userId }, { receiverId: userId }],
          },
          include: {
            sender: { select: { id: true, displayName: true } },
            receiver: { select: { id: true, displayName: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.lostReport.findUnique({
          where: { id: reportId },
          select: { id: true, itemName: true, status: true },
        }),
      ]);

      return { report, latestMessage };
    })
  );

  return conversations;
}
