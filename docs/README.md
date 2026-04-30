# Docs Index

## Main Entry Points

- [roadmap/PLATFORM_MIGRATION_PLAN.md](./roadmap/PLATFORM_MIGRATION_PLAN.md) - main architecture and migration plan
- [roadmap/ARCHITECTURE.md](./roadmap/ARCHITECTURE.md) - target architecture model
- [roadmap/BOUNDARIES.md](./roadmap/BOUNDARIES.md) - auth/storage/media/realtime/domain boundaries
- [roadmap/STAGE_STATUS.md](./roadmap/STAGE_STATUS.md) - current stage status and next correct step
- [waves/FIRST_MIGRATION.md](./waves/FIRST_MIGRATION.md) - Wave 1, closed wave for `Stage 1`
- [waves/NEST_FOUNDATION.md](./waves/NEST_FOUNDATION.md) - Wave 2, closed wave for `Stage 2`
- [waves/DOMAIN_EXTRACTION_SLICE_1.md](./waves/DOMAIN_EXTRACTION_SLICE_1.md) - Wave 3, closed wave for the first `Stage 3` slice
- [waves/DOMAIN_EXTRACTION_SLICE_2_MESSAGES.md](./waves/DOMAIN_EXTRACTION_SLICE_2_MESSAGES.md) - Wave 4, closed wave for the `messages/direct-messages` slice in `Stage 3`
- [waves/SOCKET_TRANSPORT_EXTRACTION.md](./waves/SOCKET_TRANSPORT_EXTRACTION.md) - Wave 5, closed wave for `Stage 3` transport extraction
- [waves/AUTH_FOUNDATION.md](./waves/AUTH_FOUNDATION.md) - Wave 6, closed auth-foundation wave at the start of `Stage 4`
- [waves/AUTH_CONTEXT_INTEGRATION.md](./waves/AUTH_CONTEXT_INTEGRATION.md) - Wave 7, closed auth-context integration wave inside `Stage 4`
- [waves/AUTH_RUNTIME_INTEGRATION.md](./waves/AUTH_RUNTIME_INTEGRATION.md) - Wave 8, closed auth runtime integration wave inside `Stage 4`
- [waves/AUTH_MIDDLEWARE_INTEGRATION.md](./waves/AUTH_MIDDLEWARE_INTEGRATION.md) - Wave 9, closed middleware-focused auth wave inside `Stage 4`
- [waves/AUTH_SESSIONS_FOUNDATION.md](./waves/AUTH_SESSIONS_FOUNDATION.md) - Wave 10, closed sessions/cookie-foundation wave inside `Stage 4`
- [waves/AUTH_COOKIE_RUNTIME_INTEGRATION.md](./waves/AUTH_COOKIE_RUNTIME_INTEGRATION.md) - Wave 11, closed runtime/browser auth integration wave inside `Stage 4`
- [waves/AUTH_IDENTITY_OWNERSHIP_FOUNDATION.md](./waves/AUTH_IDENTITY_OWNERSHIP_FOUNDATION.md) - Wave 12, closed auth-ownership foundation wave inside `Stage 4`
- [waves/AUTH_OWN_ENTRYPOINTS_INTEGRATION.md](./waves/AUTH_OWN_ENTRYPOINTS_INTEGRATION.md) - Wave 13, closed auth-entrypoints wave inside `Stage 4`
- [waves/AUTH_CLERK_REMOVAL.md](./waves/AUTH_CLERK_REMOVAL.md) - Wave 14, closed active-path provider-removal wave inside `Stage 4`
- [waves/AUTH_RESIDUAL_CLERK_CLEANUP.md](./waves/AUTH_RESIDUAL_CLERK_CLEANUP.md) - Wave 15, closed residual-cleanup wave inside `Stage 4`
- [waves/AUTH_STAGE4_COMPATIBILITY_CLEANUP.md](./waves/AUTH_STAGE4_COMPATIBILITY_CLEANUP.md) - Wave 16, closed final compatibility-cleanup wave inside `Stage 4`
- [waves/STORAGE_FOUNDATION.md](./waves/STORAGE_FOUNDATION.md) - Wave 17, closed storage-foundation wave at the start of `Stage 5`
- [waves/STORAGE_S3_PROVIDER_IMPLEMENTATION.md](./waves/STORAGE_S3_PROVIDER_IMPLEMENTATION.md) - Wave 18, closed `S3-compatible` provider implementation wave inside `Stage 5`
- [waves/STORAGE_MANAGED_CLOUD_VALIDATION.md](./waves/STORAGE_MANAGED_CLOUD_VALIDATION.md) - Wave 19, closed managed-cloud validation wave inside `Stage 5`
- [waves/STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP.md](./waves/STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP.md) - Wave 20, closed compatibility-cleanup wave inside `Stage 5`
- [waves/STORAGE_METADATA_OWNERSHIP_FOUNDATION.md](./waves/STORAGE_METADATA_OWNERSHIP_FOUNDATION.md) - Wave 21, closed metadata/file-key ownership wave inside `Stage 5`
- [waves/CLERK_REPO_CLEANUP.md](./waves/CLERK_REPO_CLEANUP.md) - Wave 22, closed optional repo-level Clerk cleanup
- [waves/STORAGE_RUNTIME_READ_RESOLUTION.md](./waves/STORAGE_RUNTIME_READ_RESOLUTION.md) - Wave 23, closed runtime-read/file-access wave inside `Stage 5`
- [waves/STORAGE_ACCESS_POLICY_FOUNDATION.md](./waves/STORAGE_ACCESS_POLICY_FOUNDATION.md) - Wave 24, closed storage-access-policy wave inside `Stage 5`
- [waves/STORAGE_STAGED_UPLOAD_SWEEPER.md](./waves/STORAGE_STAGED_UPLOAD_SWEEPER.md) - Wave 25, closed narrow staged-upload cleanup wave that closes `Stage 5`
- [waves/WEB_RUNTIME_API_EXTRACTION.md](./waves/WEB_RUNTIME_API_EXTRACTION.md) - Wave 26, current web runtime extraction wave for `Stage 5A`
- [waves/VENDOR_REPO_CLEANUP.md](./waves/VENDOR_REPO_CLEANUP.md) - Wave 27, optional tiny repo-level cleanup for dead `Clerk` and `UploadThing` leftovers

## Wave Sequence

1. Wave 1 - `FIRST_MIGRATION`
2. Wave 2 - `NEST_FOUNDATION`
3. Wave 3 - `DOMAIN_EXTRACTION_SLICE_1`
4. Wave 4 - `DOMAIN_EXTRACTION_SLICE_2_MESSAGES`
5. Wave 5 - `SOCKET_TRANSPORT_EXTRACTION`
6. Wave 6 - `AUTH_FOUNDATION`
7. Wave 7 - `AUTH_CONTEXT_INTEGRATION`
8. Wave 8 - `AUTH_RUNTIME_INTEGRATION`
9. Wave 9 - `AUTH_MIDDLEWARE_INTEGRATION`
10. Wave 10 - `AUTH_SESSIONS_FOUNDATION`
11. Wave 11 - `AUTH_COOKIE_RUNTIME_INTEGRATION`
12. Wave 12 - `AUTH_IDENTITY_OWNERSHIP_FOUNDATION`
13. Wave 13 - `AUTH_OWN_ENTRYPOINTS_INTEGRATION`
14. Wave 14 - `AUTH_CLERK_REMOVAL`
15. Wave 15 - `AUTH_RESIDUAL_CLERK_CLEANUP`
16. Wave 16 - `AUTH_STAGE4_COMPATIBILITY_CLEANUP`
17. Wave 17 - `STORAGE_FOUNDATION`
18. Wave 18 - `STORAGE_S3_PROVIDER_IMPLEMENTATION`
19. Wave 19 - `STORAGE_MANAGED_CLOUD_VALIDATION`
20. Wave 20 - `STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP`
21. Wave 21 - `STORAGE_METADATA_OWNERSHIP_FOUNDATION`
22. Wave 22 - `CLERK_REPO_CLEANUP`
23. Wave 23 - `STORAGE_RUNTIME_READ_RESOLUTION`
24. Wave 24 - `STORAGE_ACCESS_POLICY_FOUNDATION`
25. Wave 25 - `STORAGE_STAGED_UPLOAD_SWEEPER`
26. Wave 26 - `WEB_RUNTIME_API_EXTRACTION`
27. Wave 27 - `VENDOR_REPO_CLEANUP`

## Delegation

- [delegation/DELEGATION_AGENT_GUIDE.md](./delegation/DELEGATION_AGENT_GUIDE.md) - operating rules for delegated agents
- [delegation/briefs/SEGMENT_BRIEF_001_APP_CORE_SEED.md](./delegation/briefs/SEGMENT_BRIEF_001_APP_CORE_SEED.md)
- [delegation/briefs/SEGMENT_BRIEF_002_SDK_SEED.md](./delegation/briefs/SEGMENT_BRIEF_002_SDK_SEED.md)
- [delegation/briefs/SEGMENT_BRIEF_003_UI_SEED.md](./delegation/briefs/SEGMENT_BRIEF_003_UI_SEED.md)
- [delegation/briefs/SEGMENT_BRIEF_004_PROVIDER_CONTRACTS.md](./delegation/briefs/SEGMENT_BRIEF_004_PROVIDER_CONTRACTS.md)
- [delegation/briefs/SEGMENT_BRIEF_005_NEST_SKELETON.md](./delegation/briefs/SEGMENT_BRIEF_005_NEST_SKELETON.md)
- [delegation/briefs/SEGMENT_BRIEF_006_INVITE_SERVER_DOMAIN.md](./delegation/briefs/SEGMENT_BRIEF_006_INVITE_SERVER_DOMAIN.md)
- [delegation/briefs/SEGMENT_BRIEF_007_DOMAIN_SLICE_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_007_DOMAIN_SLICE_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_008_DOMAIN_SLICE_REALTIME.md](./delegation/briefs/SEGMENT_BRIEF_008_DOMAIN_SLICE_REALTIME.md)
- [delegation/briefs/SEGMENT_BRIEF_009_MESSAGES_DOMAIN_SLICE.md](./delegation/briefs/SEGMENT_BRIEF_009_MESSAGES_DOMAIN_SLICE.md)
- [delegation/briefs/SEGMENT_BRIEF_010_SOCKET_TRANSPORT_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_010_SOCKET_TRANSPORT_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_011_AUTH_FOUNDATION.md](./delegation/briefs/SEGMENT_BRIEF_011_AUTH_FOUNDATION.md)
- [delegation/briefs/SEGMENT_BRIEF_012_AUTH_CONTEXT_INTEGRATION.md](./delegation/briefs/SEGMENT_BRIEF_012_AUTH_CONTEXT_INTEGRATION.md)
- [delegation/briefs/SEGMENT_BRIEF_013_AUTH_RUNTIME_INTEGRATION.md](./delegation/briefs/SEGMENT_BRIEF_013_AUTH_RUNTIME_INTEGRATION.md)
- [delegation/briefs/SEGMENT_BRIEF_014_AUTH_MIDDLEWARE_INTEGRATION.md](./delegation/briefs/SEGMENT_BRIEF_014_AUTH_MIDDLEWARE_INTEGRATION.md)
- [delegation/briefs/SEGMENT_BRIEF_015_AUTH_SESSIONS_FOUNDATION.md](./delegation/briefs/SEGMENT_BRIEF_015_AUTH_SESSIONS_FOUNDATION.md)
- [delegation/briefs/SEGMENT_BRIEF_016_AUTH_COOKIE_SESSION_FOUNDATION.md](./delegation/briefs/SEGMENT_BRIEF_016_AUTH_COOKIE_SESSION_FOUNDATION.md)
- [delegation/briefs/SEGMENT_BRIEF_017_AUTH_COOKIE_RUNTIME_INTEGRATION.md](./delegation/briefs/SEGMENT_BRIEF_017_AUTH_COOKIE_RUNTIME_INTEGRATION.md)
- [delegation/briefs/SEGMENT_BRIEF_018_AUTH_IDENTITY_OWNERSHIP_FOUNDATION.md](./delegation/briefs/SEGMENT_BRIEF_018_AUTH_IDENTITY_OWNERSHIP_FOUNDATION.md)
- [delegation/briefs/SEGMENT_BRIEF_019_AUTH_OWN_ENTRYPOINTS_INTEGRATION.md](./delegation/briefs/SEGMENT_BRIEF_019_AUTH_OWN_ENTRYPOINTS_INTEGRATION.md)
- [delegation/briefs/SEGMENT_BRIEF_020_AUTH_CLERK_REMOVAL.md](./delegation/briefs/SEGMENT_BRIEF_020_AUTH_CLERK_REMOVAL.md)
- [delegation/briefs/SEGMENT_BRIEF_021_AUTH_RESIDUAL_CLERK_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_021_AUTH_RESIDUAL_CLERK_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_022_AUTH_STAGE4_COMPATIBILITY_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_022_AUTH_STAGE4_COMPATIBILITY_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_023_STORAGE_FOUNDATION.md](./delegation/briefs/SEGMENT_BRIEF_023_STORAGE_FOUNDATION.md)
- [delegation/briefs/SEGMENT_BRIEF_024_STORAGE_S3_PROVIDER_IMPLEMENTATION.md](./delegation/briefs/SEGMENT_BRIEF_024_STORAGE_S3_PROVIDER_IMPLEMENTATION.md)
- [delegation/briefs/SEGMENT_BRIEF_025_STORAGE_MANAGED_CLOUD_VALIDATION.md](./delegation/briefs/SEGMENT_BRIEF_025_STORAGE_MANAGED_CLOUD_VALIDATION.md)
- [delegation/briefs/SEGMENT_BRIEF_026_STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_026_STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_027_STORAGE_METADATA_OWNERSHIP_FOUNDATION.md](./delegation/briefs/SEGMENT_BRIEF_027_STORAGE_METADATA_OWNERSHIP_FOUNDATION.md)
- [delegation/briefs/SEGMENT_BRIEF_028_CLERK_REPO_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_028_CLERK_REPO_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_029_STORAGE_RUNTIME_READ_RESOLUTION.md](./delegation/briefs/SEGMENT_BRIEF_029_STORAGE_RUNTIME_READ_RESOLUTION.md)
- [delegation/briefs/SEGMENT_BRIEF_030_STORAGE_ACCESS_POLICY_FOUNDATION.md](./delegation/briefs/SEGMENT_BRIEF_030_STORAGE_ACCESS_POLICY_FOUNDATION.md)
- [delegation/briefs/SEGMENT_BRIEF_031_STORAGE_STAGED_UPLOAD_SWEEPER.md](./delegation/briefs/SEGMENT_BRIEF_031_STORAGE_STAGED_UPLOAD_SWEEPER.md)
- [delegation/briefs/SEGMENT_BRIEF_032_WEB_RUNTIME_API_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_032_WEB_RUNTIME_API_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_033_VENDOR_REPO_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_033_VENDOR_REPO_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_034_WEB_RUNTIME_SDK_QUERY_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_034_WEB_RUNTIME_SDK_QUERY_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_035_WEB_RUNTIME_FEATURE_MUTATION_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_035_WEB_RUNTIME_FEATURE_MUTATION_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_036_WEB_RUNTIME_CHANNEL_MUTATION_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_036_WEB_RUNTIME_CHANNEL_MUTATION_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_037_WEB_RUNTIME_MEMBERSHIP_MUTATION_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_037_WEB_RUNTIME_MEMBERSHIP_MUTATION_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_038_WEB_RUNTIME_MESSAGE_MUTATION_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_038_WEB_RUNTIME_MESSAGE_MUTATION_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_039_WEB_RUNTIME_CHAT_QUERY_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_039_WEB_RUNTIME_CHAT_QUERY_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_040_WEB_RUNTIME_AUTH_ACTION_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_040_WEB_RUNTIME_AUTH_ACTION_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_041_WEB_RUNTIME_STORAGE_ACTION_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_041_WEB_RUNTIME_STORAGE_ACTION_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_042_WEB_RUNTIME_MEDIA_TOKEN_EXTRACTION.md](./delegation/briefs/SEGMENT_BRIEF_042_WEB_RUNTIME_MEDIA_TOKEN_EXTRACTION.md)
- [delegation/briefs/SEGMENT_BRIEF_043_WEB_RUNTIME_CHAT_CONTRACT_NORMALIZATION.md](./delegation/briefs/SEGMENT_BRIEF_043_WEB_RUNTIME_CHAT_CONTRACT_NORMALIZATION.md)
- [delegation/briefs/SEGMENT_BRIEF_044_WEB_RUNTIME_PROXY_ROUTE_INVENTORY.md](./delegation/briefs/SEGMENT_BRIEF_044_WEB_RUNTIME_PROXY_ROUTE_INVENTORY.md)
- [delegation/briefs/SEGMENT_BRIEF_045_PAGES_SOCKET_CHANNELS_MEMBERS_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_045_PAGES_SOCKET_CHANNELS_MEMBERS_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_046_PAGES_SOCKET_SERVERS_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_046_PAGES_SOCKET_SERVERS_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_047_PAGES_SOCKET_MESSAGES_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_047_PAGES_SOCKET_MESSAGES_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_048_APP_API_CHANNELS_MEMBERS_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_048_APP_API_CHANNELS_MEMBERS_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_049_APP_API_SERVERS_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_049_APP_API_SERVERS_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_050_APP_API_CHAT_MEDIA_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_050_APP_API_CHAT_MEDIA_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_051_APP_API_AUTH_PROFILE_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_051_APP_API_AUTH_PROFILE_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_052_APP_API_SERVER_UPLOAD_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_052_APP_API_SERVER_UPLOAD_CLEANUP.md)
- [delegation/briefs/SEGMENT_BRIEF_053_STORAGE_ACCESS_DIRECT_BACKEND_CLEANUP.md](./delegation/briefs/SEGMENT_BRIEF_053_STORAGE_ACCESS_DIRECT_BACKEND_CLEANUP.md)

## Recommended Reading Order

1. [roadmap/PLATFORM_MIGRATION_PLAN.md](./roadmap/PLATFORM_MIGRATION_PLAN.md)
2. [roadmap/STAGE_STATUS.md](./roadmap/STAGE_STATUS.md)
3. relevant wave doc
4. [delegation/DELEGATION_AGENT_GUIDE.md](./delegation/DELEGATION_AGENT_GUIDE.md)
5. relevant `SEGMENT_BRIEF`
