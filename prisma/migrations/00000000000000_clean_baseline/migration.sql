-- CreateEnum
CREATE TYPE "AuthIdentityProvider" AS ENUM ('PASSWORD');

-- CreateEnum
CREATE TYPE "AuthSessionStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MODERATOR', 'GUEST');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('TEXT', 'AUDIO', 'VIDEO');

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authidentity" (
    "id" TEXT NOT NULL,
    "provider" "AuthIdentityProvider" NOT NULL,
    "subject" VARCHAR(191) NOT NULL,
    "profileId" TEXT NOT NULL,
    "email" TEXT,
    "emailNormalized" VARCHAR(191),
    "lastAuthenticatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authidentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authpasswordcredential" (
    "identityId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authpasswordcredential_pkey" PRIMARY KEY ("identityId")
);

-- CreateTable
CREATE TABLE "authsession" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AuthSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "refreshTokenHash" VARCHAR(191) NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" VARCHAR(191),
    "lastAccessedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authsession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'GUEST',
    "profileId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL DEFAULT 'TEXT',
    "profileId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "memberId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "id" TEXT NOT NULL,
    "memberOneId" TEXT NOT NULL,
    "memberTwoId" TEXT NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directmessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "memberId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directmessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_userId_key" ON "profile"("userId");

-- CreateIndex
CREATE INDEX "authidentity_profileId_idx" ON "authidentity"("profileId");

-- CreateIndex
CREATE INDEX "authidentity_emailNormalized_idx" ON "authidentity"("emailNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "authidentity_provider_subject_key" ON "authidentity"("provider", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "authsession_refreshTokenHash_key" ON "authsession"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "authsession_profileId_idx" ON "authsession"("profileId");

-- CreateIndex
CREATE INDEX "authsession_userId_idx" ON "authsession"("userId");

-- CreateIndex
CREATE INDEX "authsession_status_idx" ON "authsession"("status");

-- CreateIndex
CREATE INDEX "authsession_refreshTokenExpiresAt_idx" ON "authsession"("refreshTokenExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "server_inviteCode_key" ON "server"("inviteCode");

-- CreateIndex
CREATE INDEX "server_profileId_idx" ON "server"("profileId");

-- CreateIndex
CREATE INDEX "member_profileId_idx" ON "member"("profileId");

-- CreateIndex
CREATE INDEX "member_serverId_idx" ON "member"("serverId");

-- CreateIndex
CREATE UNIQUE INDEX "member_profileId_serverId_key" ON "member"("profileId", "serverId");

-- CreateIndex
CREATE INDEX "channel_profileId_idx" ON "channel"("profileId");

-- CreateIndex
CREATE INDEX "channel_serverId_idx" ON "channel"("serverId");

-- CreateIndex
CREATE INDEX "message_channelId_idx" ON "message"("channelId");

-- CreateIndex
CREATE INDEX "message_memberId_idx" ON "message"("memberId");

-- CreateIndex
CREATE INDEX "conversation_memberTwoId_idx" ON "conversation"("memberTwoId");

-- CreateIndex
CREATE INDEX "conversation_memberOneId_idx" ON "conversation"("memberOneId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_memberOneId_memberTwoId_key" ON "conversation"("memberOneId", "memberTwoId");

-- CreateIndex
CREATE INDEX "directmessage_memberId_idx" ON "directmessage"("memberId");

-- CreateIndex
CREATE INDEX "directmessage_conversationId_idx" ON "directmessage"("conversationId");
