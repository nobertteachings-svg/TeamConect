-- AlterTable
ALTER TABLE "TeamPost" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "TeamPost_parentId_idx" ON "TeamPost"("parentId");

-- AddForeignKey
ALTER TABLE "TeamPost" ADD CONSTRAINT "TeamPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TeamPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
