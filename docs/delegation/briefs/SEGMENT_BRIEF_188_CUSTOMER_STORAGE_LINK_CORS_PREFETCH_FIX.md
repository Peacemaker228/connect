# Segment Brief 188: Customer Storage Link CORS Prefetch Fix

## Metadata

- Branch: `feature/customer-agent-code-review-control-rule`
- Segment: `customer-storage-link-cors-prefetch-fix`
- Type: customer-priority storage display follow-up
- Status: `pass / local code fix`

## Context

After storage images started rendering inline, browser devtools still showed production-only CORS noise:

- direct Yandex Object Storage URLs returned `403` for `OPTIONS`;
- UI images could still appear because image rendering itself was not the failing path;
- the failing requests were browser-side fetch/prefetch-style requests around storage access URLs.

## Root Cause

Storage file URLs were wrapped with `next/link`.

For backend storage access URLs such as `/api/storage/access?...`, this is the wrong primitive:

- the URL is a file/access endpoint, not a Next page route;
- Next can treat visible links as navigation/prefetch candidates;
- the access endpoint redirects to the Yandex Object Storage public object URL;
- that JavaScript fetch/prefetch path can trigger CORS preflight;
- Yandex Object Storage rejects the preflight with `403`, creating console/network errors even when the image itself is usable.

## Fix

Use plain browser anchors for storage assets:

- chat image attachments now use `<a>` around the image;
- chat PDF attachments now use `<a>`;
- upload-preview PDF links now use `<a>`;
- `next/image unoptimized` remains in place for storage images.

## Files Changed

- `src/lib/chat/features/chat-item.tsx`
- `src/lib/shared/features/file-upload.tsx`

## Intentionally Not Changed

- storage upload API;
- storage provider;
- Yandex bucket settings;
- CORS configuration;
- auth;
- DB/schema;
- media/WebRTC/LiveKit;
- production env values.

## Verification

Expected local verification:

```bash
git diff --check
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
bun.cmd run build:web
```

Expected staging/browser smoke after deploy:

- open a chat with image attachments;
- Network should no longer show `OPTIONS 403` to Yandex caused by storage link prefetch;
- image requests should render through the direct browser image path;
- clicking an image/PDF still opens the file in a new tab.
