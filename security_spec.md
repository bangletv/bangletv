# Bengal TV Firestore Security Specification (Phase 0 Security TDD)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Unmatched paths are unconditionally denied (`allow read, write: if false`).
2. **Verified Identity Invariant**: All write operations require an authenticated Google account with `request.auth.token.email_verified == true`.
3. **PII Isolation Invariant**: `/users/{userId}` never stores `email`, `phone`, or private credentials. User `email` is isolated in `/users/{userId}/private/{docId}`, readable and writable solely by `request.auth.uid == userId` when parent `/users/{userId}` exists (or `existsAfter` during atomic registration).
4. **No Orphaned Broadcasts**: A `/broadcasts/{broadcastId}` document can only be created if `/users/$(request.auth.uid)` exists and `incoming().authorId == request.auth.uid`.
5. **Journalistic & Humanitarian Mandate**: `category` in `/broadcasts/{broadcastId}` is strictly constrained to `['NEWS', 'LIVE_NEWS', 'DOCUMENTARY', 'EDUCATION', 'SCIENCE', 'PUBLIC_SERVICE', 'COMMUNITY']`. General `ENTERTAINMENT`, `MUSIC`, or `CARTOONS` payloads are rejected at the database boundary.
6. **Compliance Lock Invariant**: Only `complianceStatus == 'APPROVED'` with `complianceScore >= 70 && complianceScore <= 100` can be persisted. Post-creation updates cannot alter `videoUrl`, `title`, `description`, `category`, `complianceStatus`, `complianceScore`, `authorId`, or `createdAt` (preventing post-approval content swap).
7. **Query Boundary Enforcement**: `allow list` on `/broadcasts/{broadcastId}` explicitly checks `resource.data.complianceStatus == 'APPROVED'` and (`resource.data.distributionScope == 'PUBLIC'` or authenticated community/author access) without delegating filtering to the client.
8. **Temporal Integrity**: `createdAt` and `updatedAt` must strictly equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing (`authorId` mismatch)**: Authenticated user `uid_A` creates `/broadcasts/bc_1` with `authorId: "uid_B"`. -> `PERMISSION_DENIED`
2. **Unverified Email Spoof**: Token with `email_verified: false` attempts to create `/users/uid_A`. -> `PERMISSION_DENIED`
3. **Shadow Field Injection**: Creating `/users/uid_A` with extra field `"isAdmin": true`. -> `PERMISSION_DENIED`
4. **General Entertainment Bypass**: Creating `/broadcasts/bc_2` with `category: "ENTERTAINMENT"`. -> `PERMISSION_DENIED`
5. **Rejected Compliance Bypass**: Creating `/broadcasts/bc_3` with `complianceStatus: "REJECTED"` or `complianceScore: 20`. -> `PERMISSION_DENIED`
6. **Post-Approval Video Swap (Update-Gap)**: Owner updates `/broadcasts/bc_1` changing `videoUrl` after AI approval. -> `PERMISSION_DENIED`
7. **PII Cross-Read**: Authenticated user `uid_B` performs `get` on `/users/uid_A/private/info`. -> `PERMISSION_DENIED`
8. **Orphaned Broadcast Creation**: User `uid_no_profile` without `/users/uid_no_profile` creates `/broadcasts/bc_4`. -> `PERMISSION_DENIED`
9. **ID Poisoning Attack**: Creating document with 500-char or special-char ID `bc$#@!`. -> `PERMISSION_DENIED`
10. **Denial-of-Wallet Oversized String**: Creating `/broadcasts/bc_5` with 50KB `description`. -> `PERMISSION_DENIED`
11. **Forged Client Timestamp**: Creating `/broadcasts/bc_6` with backdated `createdAt` != `request.time`. -> `PERMISSION_DENIED`
12. **Unauthorized Private Scope Scrape**: Unauthenticated client listing `/broadcasts` without `distributionScope == 'PUBLIC'` constraint. -> `PERMISSION_DENIED`
