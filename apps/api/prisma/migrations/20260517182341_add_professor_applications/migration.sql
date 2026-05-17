-- CreateEnum
CREATE TYPE "ProfessorApplicationPurpose" AS ENUM ('PROJECT', 'ARTICLE');

-- CreateEnum
CREATE TYPE "ProfessorApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProfessorApplication" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "purpose" "ProfessorApplicationPurpose" NOT NULL DEFAULT 'PROJECT',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tagIds" TEXT NOT NULL,
    "message" TEXT,
    "status" "ProfessorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfessorApplication_studentId_idx" ON "ProfessorApplication"("studentId");

-- CreateIndex
CREATE INDEX "ProfessorApplication_professorId_idx" ON "ProfessorApplication"("professorId");

-- AddForeignKey
ALTER TABLE "ProfessorApplication" ADD CONSTRAINT "ProfessorApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorApplication" ADD CONSTRAINT "ProfessorApplication_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
