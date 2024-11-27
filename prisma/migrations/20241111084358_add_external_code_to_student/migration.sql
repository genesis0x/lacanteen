/*
  Warnings:

  - A unique constraint covering the columns `[externalCode]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "externalCode" TEXT NOT NULL DEFAULT 'defaultCode';

-- CreateIndex
CREATE UNIQUE INDEX "Student_externalCode_key" ON "Student"("externalCode");
