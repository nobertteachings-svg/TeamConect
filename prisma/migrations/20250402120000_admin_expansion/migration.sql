-- Admin expansion: audit log, moderation flags, announcements

ALTER TABLE "User" ADD COLUMN "accountDisabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

ALTER TABLE "StartupIdea" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StartupIdea" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "CoFounderApplication" ADD COLUMN "adminNote" TEXT;

ALTER TABLE "Circle" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteAnnouncement" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteAnnouncement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
