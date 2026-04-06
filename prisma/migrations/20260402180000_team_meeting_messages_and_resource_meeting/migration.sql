-- AlterTable
ALTER TABLE "TeamResource" ADD COLUMN "meetingId" TEXT;

-- CreateTable
CREATE TABLE "TeamMeetingMessage" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMeetingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamResource_meetingId_idx" ON "TeamResource"("meetingId");

-- CreateIndex
CREATE INDEX "TeamMeetingMessage_meetingId_createdAt_idx" ON "TeamMeetingMessage"("meetingId", "createdAt");

-- AddForeignKey
ALTER TABLE "TeamResource" ADD CONSTRAINT "TeamResource_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "TeamMeeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMeetingMessage" ADD CONSTRAINT "TeamMeetingMessage_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "TeamMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMeetingMessage" ADD CONSTRAINT "TeamMeetingMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
