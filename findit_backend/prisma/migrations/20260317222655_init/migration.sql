-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('lost', 'possibly_found', 'found', 'archived');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "uoft_email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lost_reports" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lost_time" TIMESTAMP(3) NOT NULL,
    "lost_location_text" TEXT,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,
    "radius_meters" INTEGER NOT NULL DEFAULT 100,
    "status" "ReportStatus" NOT NULL DEFAULT 'lost',
    "found_confirmed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lost_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_images" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sightings" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "finder_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sightings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sighting_images" (
    "id" TEXT NOT NULL,
    "sighting_id" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sighting_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uoft_email_key" ON "users"("uoft_email");

-- CreateIndex
CREATE INDEX "lost_reports_owner_id_idx" ON "lost_reports"("owner_id");

-- CreateIndex
CREATE INDEX "lost_reports_status_idx" ON "lost_reports"("status");

-- CreateIndex
CREATE INDEX "lost_reports_latitude_longitude_idx" ON "lost_reports"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "report_images_report_id_idx" ON "report_images"("report_id");

-- CreateIndex
CREATE INDEX "sightings_report_id_idx" ON "sightings"("report_id");

-- CreateIndex
CREATE INDEX "sightings_finder_id_idx" ON "sightings"("finder_id");

-- CreateIndex
CREATE UNIQUE INDEX "sightings_report_id_finder_id_key" ON "sightings"("report_id", "finder_id");

-- CreateIndex
CREATE INDEX "sighting_images_sighting_id_idx" ON "sighting_images"("sighting_id");

-- CreateIndex
CREATE INDEX "messages_report_id_idx" ON "messages"("report_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_receiver_id_idx" ON "messages"("receiver_id");

-- AddForeignKey
ALTER TABLE "lost_reports" ADD CONSTRAINT "lost_reports_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_images" ADD CONSTRAINT "report_images_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "lost_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sightings" ADD CONSTRAINT "sightings_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "lost_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sightings" ADD CONSTRAINT "sightings_finder_id_fkey" FOREIGN KEY ("finder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sighting_images" ADD CONSTRAINT "sighting_images_sighting_id_fkey" FOREIGN KEY ("sighting_id") REFERENCES "sightings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "lost_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
