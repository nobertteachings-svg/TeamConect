-- CreateTable
CREATE TABLE "StartupTeam" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StartupTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPost" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamResource" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMeeting" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "meetingUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMeeting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StartupTeam_ideaId_key" ON "StartupTeam"("ideaId");

CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

CREATE INDEX "TeamPost_teamId_createdAt_idx" ON "TeamPost"("teamId", "createdAt");

CREATE INDEX "TeamResource_teamId_idx" ON "TeamResource"("teamId");

CREATE INDEX "TeamMeeting_teamId_idx" ON "TeamMeeting"("teamId");

ALTER TABLE "StartupTeam" ADD CONSTRAINT "StartupTeam_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "StartupIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "StartupTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamPost" ADD CONSTRAINT "TeamPost_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "StartupTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamPost" ADD CONSTRAINT "TeamPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamResource" ADD CONSTRAINT "TeamResource_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "StartupTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamResource" ADD CONSTRAINT "TeamResource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamMeeting" ADD CONSTRAINT "TeamMeeting_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "StartupTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamMeeting" ADD CONSTRAINT "TeamMeeting_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
