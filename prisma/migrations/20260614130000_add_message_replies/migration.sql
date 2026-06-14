-- Add channel/direct reply relationships without changing existing rows.
ALTER TABLE "message" ADD COLUMN "replyToMessageId" TEXT;
ALTER TABLE "directmessage" ADD COLUMN "replyToDirectMessageId" TEXT;

CREATE INDEX "message_replyToMessageId_idx" ON "message"("replyToMessageId");
CREATE INDEX "directmessage_replyToDirectMessageId_idx" ON "directmessage"("replyToDirectMessageId");
