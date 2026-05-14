-- CreateEnum
CREATE TYPE "TeamIdeaStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "TeamInviteRole" AS ENUM ('PROFESSOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "TeamInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "TeamIdea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "professorSlots" INTEGER NOT NULL DEFAULT 1,
    "studentSlots" INTEGER NOT NULL DEFAULT 3,
    "status" "TeamIdeaStatus" NOT NULL DEFAULT 'OPEN',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamIdeaTag" (
    "teamIdeaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TeamIdeaTag_pkey" PRIMARY KEY ("teamIdeaId","tagId")
);

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "teamIdeaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamInviteRole" NOT NULL,
    "status" "TeamInviteStatus" NOT NULL DEFAULT 'PENDING',
    "handoffNote" TEXT,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_teamIdeaId_userId_key" ON "TeamInvite"("teamIdeaId", "userId");

-- AddForeignKey
ALTER TABLE "TeamIdea" ADD CONSTRAINT "TeamIdea_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamIdeaTag" ADD CONSTRAINT "TeamIdeaTag_teamIdeaId_fkey" FOREIGN KEY ("teamIdeaId") REFERENCES "TeamIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamIdeaTag" ADD CONSTRAINT "TeamIdeaTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_teamIdeaId_fkey" FOREIGN KEY ("teamIdeaId") REFERENCES "TeamIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
