-- CreateEnum
CREATE TYPE "MessageMentionKind" AS ENUM ('USER', 'ALL');

-- CreateTable
CREATE TABLE "messagemention" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kind" "MessageMentionKind" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messagemention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "messagemention_messageId_memberId_key" ON "messagemention"("messageId", "memberId");

-- CreateIndex
CREATE INDEX "messagemention_messageId_idx" ON "messagemention"("messageId");

-- CreateIndex
CREATE INDEX "messagemention_memberId_idx" ON "messagemention"("memberId");
