-- Add persisted read-state for customer unread badge foundation.
-- This migration is additive and does not reset or rewrite existing message data.

CREATE TABLE "channelreadstate" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "channelreadstate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversationreadstate" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "conversationreadstate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "channelreadstate_memberId_channelId_key" ON "channelreadstate"("memberId", "channelId");
CREATE INDEX "channelreadstate_channelId_idx" ON "channelreadstate"("channelId");

CREATE UNIQUE INDEX "conversationreadstate_memberId_conversationId_key" ON "conversationreadstate"("memberId", "conversationId");
CREATE INDEX "conversationreadstate_conversationId_idx" ON "conversationreadstate"("conversationId");

CREATE INDEX "message_channelId_createdAt_idx" ON "message"("channelId", "createdAt");
CREATE INDEX "directmessage_conversationId_createdAt_idx" ON "directmessage"("conversationId", "createdAt");

-- Baseline existing chats as read at migration time so the feature does not
-- turn historical messages into unread badges on first deploy.
INSERT INTO "channelreadstate" ("id", "memberId", "channelId", "lastReadAt", "createdAt", "updatedAt")
SELECT
  'channel:' || "member"."id" || ':' || "channel"."id",
  "member"."id",
  "channel"."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "member"
INNER JOIN "channel" ON "channel"."serverId" = "member"."serverId"
WHERE "channel"."type" = 'TEXT'
ON CONFLICT ("memberId", "channelId") DO NOTHING;

INSERT INTO "conversationreadstate" ("id", "memberId", "conversationId", "lastReadAt", "createdAt", "updatedAt")
SELECT
  'conversation:' || "conversation"."memberOneId" || ':' || "conversation"."id",
  "conversation"."memberOneId",
  "conversation"."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "conversation"
ON CONFLICT ("memberId", "conversationId") DO NOTHING;

INSERT INTO "conversationreadstate" ("id", "memberId", "conversationId", "lastReadAt", "createdAt", "updatedAt")
SELECT
  'conversation:' || "conversation"."memberTwoId" || ':' || "conversation"."id",
  "conversation"."memberTwoId",
  "conversation"."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "conversation"
ON CONFLICT ("memberId", "conversationId") DO NOTHING;
