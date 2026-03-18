import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // ─── Create Users ────────────────────────────────
  const password = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { uoftEmail: "alice@mail.utoronto.ca" },
    update: {},
    create: {
      uoftEmail: "alice@mail.utoronto.ca",
      passwordHash: password,
      displayName: "Alice Chen",
    },
  });

  const bob = await prisma.user.upsert({
    where: { uoftEmail: "bob@mail.utoronto.ca" },
    update: {},
    create: {
      uoftEmail: "bob@mail.utoronto.ca",
      passwordHash: password,
      displayName: "Bob Wang",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { uoftEmail: "charlie@mail.utoronto.ca" },
    update: {},
    create: {
      uoftEmail: "charlie@mail.utoronto.ca",
      passwordHash: password,
      displayName: "Charlie Liu",
    },
  });

  console.log("Created users: Alice, Bob, Charlie");
  console.log("Login password for all: password123\n");

  // ─── Create Lost Reports ─────────────────────────
  // UofT St. George campus coordinates
  const report1 = await prisma.lostReport.create({
    data: {
      ownerId: alice.id,
      itemName: "Black Leather Wallet",
      description:
        "Black leather wallet with multiple card slots. Contains driver's license and student card. Lost near the entrance of Robarts Library.",
      lostTime: new Date("2026-03-15T14:30:00Z"),
      lostLocationText: "Robarts Library, 130 St George St",
      latitude: 43.6644,
      longitude: -79.3997,
      radiusMeters: 50,
      status: "lost",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const report2 = await prisma.lostReport.create({
    data: {
      ownerId: bob.id,
      itemName: "Silver MacBook Pro Charger",
      description:
        "67W USB-C Apple charger with a small scratch on the side. Left it plugged in at Bahen Centre room 1190 after a study session.",
      lostTime: new Date("2026-03-16T11:00:00Z"),
      lostLocationText: "Bahen Centre, 40 St George St",
      latitude: 43.6596,
      longitude: -79.3975,
      radiusMeters: 30,
      status: "possibly_found",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const report3 = await prisma.lostReport.create({
    data: {
      ownerId: alice.id,
      itemName: "Blue Hydroflask Water Bottle",
      description:
        "32oz blue Hydroflask with UofT Engineering stickers on it. Might have left it in the Myhal Centre lobby or the Galbraith Building.",
      lostTime: new Date("2026-03-17T09:15:00Z"),
      lostLocationText: "Myhal Centre, 55 St George St",
      latitude: 43.6608,
      longitude: -79.3965,
      radiusMeters: 100,
      status: "lost",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const report4 = await prisma.lostReport.create({
    data: {
      ownerId: charlie.id,
      itemName: "AirPods Pro (2nd Gen)",
      description:
        "White AirPods Pro in the charging case. Has a small dent on the case lid. Lost somewhere between Sidney Smith Hall and the Medical Sciences Building.",
      lostTime: new Date("2026-03-14T16:45:00Z"),
      lostLocationText: "Sidney Smith Hall, 100 St George St",
      latitude: 43.6624,
      longitude: -79.3987,
      radiusMeters: 200,
      status: "lost",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Created 4 lost reports\n");

  // ─── Create Sightings ────────────────────────────
  await prisma.sighting.create({
    data: {
      reportId: report2.id,
      finderId: charlie.id,
      note: "I think I saw a charger like this on the desk in Bahen 1190 this morning. It was still there around 10 AM.",
    },
  });

  await prisma.sighting.create({
    data: {
      reportId: report4.id,
      finderId: alice.id,
      note: "Found white AirPods case near the Med Sci building entrance. Turned it in to the security desk.",
    },
  });

  console.log("Created 2 sightings\n");

  // ─── Create Messages ─────────────────────────────
  await prisma.message.create({
    data: {
      reportId: report2.id,
      senderId: charlie.id,
      receiverId: bob.id,
      messageText: "Hi! I think I found your charger in Bahen 1190. Are you able to pick it up today?",
    },
  });

  await prisma.message.create({
    data: {
      reportId: report2.id,
      senderId: bob.id,
      receiverId: charlie.id,
      messageText: "That's great! I'll be there around 3pm. Does it have a small scratch on the right side?",
    },
  });

  await prisma.message.create({
    data: {
      reportId: report2.id,
      senderId: charlie.id,
      receiverId: bob.id,
      messageText: "Yes it does! I'll leave it with the front desk at Bahen. You can pick it up there.",
    },
  });

  console.log("Created 3 messages\n");
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
