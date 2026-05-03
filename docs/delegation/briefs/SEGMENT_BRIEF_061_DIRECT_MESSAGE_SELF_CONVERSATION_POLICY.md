# Segment 061. Direct Message Self-Conversation Policy

Branch:
- `wave/stage6-direct-message-self-conversation-policy`

Segment:
- `direct-message-self-conversation-policy`

## Goal

Document and enforce the product policy that a direct-message conversation must connect two different server members. A member must not create or open a direct-message conversation with itself.

This segment does not clean existing data. It does not change `DATABASE_URL`, Prisma provider, `prisma/schema.prisma`, Prisma migrations, Postgres validation infrastructure, or provider-switch baseline generation.

## Policy

Self-conversations are invalid for new direct-message bootstrap requests:
- backend source of truth: reject `targetMember.id === currentMember.id`
- web route guard: redirect away before requesting conversation bootstrap when the route `memberId` is the current member
- existing self-conversation rows remain review/data-cleanup candidates and are not modified in this segment

Backend response:
- status: `400 Bad Request`
- message: `Self Conversation Not Allowed`

The `400` response is intentional because the request targets a valid member identifier but violates direct-message policy.

## Implementation

Backend:
- `apps/api/src/modules/direct-messages/direct-messages.service.ts`
- `getOrCreateConversation` now loads the current member and target member as before, then rejects when both resolved member ids are equal
- the guard runs before `findConversation` and before `conversation.create`, so it blocks both opening an existing self-conversation through this bootstrap path and creating a new self-conversation

Web route:
- `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx`
- after resolving `currentMember`, the route redirects to the server page if `currentMember.id === memberId`
- normal direct-message routes for a different member continue to call backend conversation bootstrap

Ordinary direct messages:
- member lookup, existing-conversation lookup, and create behavior for two different members are unchanged
- symmetric conversation lookup remains unchanged for valid member pairs
- message read/write behavior for existing valid conversations is unchanged

## Existing Local Data Review

Read-only local MySQL snapshot found two existing self-conversation rows:

| conversation_id | member_id | server_id | profile_id | direct_message_count |
|---|---|---|---|---:|
| `41d108c6-a926-4df7-b653-d2bb19e8faf4` | `96f13ad4-c32e-4d12-b0dc-247a668802dc` | `5feba041-9092-4a83-9a1e-a5f2a938701a` | `311b6cfa-545e-41a9-8a3f-6ddeb05c295b` | 0 |
| `666feef1-66a8-482b-ad79-b418d489d274` | `4bab205e-304f-4989-ab41-5ec401da7e5f` | `e4407f30-6732-43a1-aeb0-819c1d52c6cd` | `311b6cfa-545e-41a9-8a3f-6ddeb05c295b` | 0 |

Classification:
- review/data-cleanup candidate
- not a Postgres baseline blocker
- no cleanup was performed in this segment

Recommended cleanup handling:
- handle these rows in a later explicit data-cleanup segment if product policy requires local fixture normalization before import rehearsal
- cleanup must be separately scoped, backed up, and verified with the data-audit query pack

## Pass/Review/Fail Classification

Pass:
- new self-conversation bootstrap is blocked in backend service
- web route redirects away from own member direct-message route
- ordinary direct-message bootstrap for different members keeps the existing code path

Review:
- two existing local self-conversation rows remain as cleanup candidates

Fail:
- none

Block:
- none for Postgres baseline generation

## Recommended Next Segment

Recommended next segment:
- `postgres-validation-schema-baseline`

Goal:
- create an isolated Postgres validation schema path and generate/review a clean local validation baseline.

Required constraints:
- keep active `DATABASE_URL` unchanged
- keep active `prisma/schema.prisma` on `provider = "mysql"`
- do not edit Prisma migrations
- do not change runtime database provider
- do not clean local data unless a separate cleanup segment is approved

## Verification

Verification performed:
- `git diff --check` passed
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed
- `bun.cmd run typecheck:api` passed
- `bun.cmd x next lint` passed with one pre-existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`
- write-keyword grep on this report returned no matches
- provider/env grep confirmed active Prisma schema still uses `provider = "mysql"` and `env("DATABASE_URL")`
