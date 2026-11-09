-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "createdBy" TEXT;

-- CreateIndex
CREATE INDEX "Task_createdBy_idx" ON "Task"("createdBy");
