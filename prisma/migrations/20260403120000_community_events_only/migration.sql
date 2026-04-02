-- Drop community circles & resource library (team workspaces keep TeamResource).
DROP TABLE IF EXISTS "CirclePost";
DROP TABLE IF EXISTS "Circle";
DROP TABLE IF EXISTS "Resource";

-- User-submitted tech events
ALTER TABLE "Event" ADD COLUMN "authorId" TEXT;
CREATE INDEX "Event_authorId_idx" ON "Event"("authorId");
CREATE INDEX "Event_startAt_idx" ON "Event"("startAt");
ALTER TABLE "Event" ADD CONSTRAINT "Event_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
