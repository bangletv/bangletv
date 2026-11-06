/**
 * Security Rules Specification Verification Suite (Dirty Dozen Payloads)
 * Verifies all 12 adversarial payloads defined in security_spec.md are denied by firestore.rules.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing: authorId does not match request.auth.uid',
    auth: { uid: 'user_alpha', email: 'alpha@example.com', email_verified: true },
    operation: 'create',
    path: '/broadcasts/bc_spoof_01',
    payload: { id: 'bc_spoof_01', authorId: 'user_victim', category: 'NEWS', complianceStatus: 'APPROVED', complianceScore: 95 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Write Attempt',
    auth: { uid: 'user_unverified', email: 'spoof@example.com', email_verified: false },
    operation: 'create',
    path: '/users/user_unverified',
    payload: { uid: 'user_unverified', displayName: 'Unverified', communityId: 'dhaka', communityName: 'Dhaka Desk', region: 'BD', bio: '' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection: self-assigned isAdmin role',
    auth: { uid: 'user_alpha', email: 'alpha@example.com', email_verified: true },
    operation: 'create',
    path: '/users/user_alpha',
    payload: { uid: 'user_alpha', displayName: 'Alpha', communityId: 'dhaka', communityName: 'Dhaka Desk', region: 'BD', bio: '', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Editorial Mandate Violation: ENTERTAINMENT category prohibited',
    auth: { uid: 'user_alpha', email: 'alpha@example.com', email_verified: true },
    operation: 'create',
    path: '/broadcasts/bc_ent_04',
    payload: { id: 'bc_ent_04', authorId: 'user_alpha', category: 'ENTERTAINMENT', complianceStatus: 'APPROVED', complianceScore: 98 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Compliance Gate Bypass: REJECTED status or low compliance score',
    auth: { uid: 'user_alpha', email: 'alpha@example.com', email_verified: true },
    operation: 'create',
    path: '/broadcasts/bc_rej_05',
    payload: { id: 'bc_rej_05', authorId: 'user_alpha', category: 'NEWS', complianceStatus: 'REJECTED', complianceScore: 15 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Post-Approval Content Swap: attempting to mutate videoUrl after AI approval',
    auth: { uid: 'user_alpha', email: 'alpha@example.com', email_verified: true },
    operation: 'update',
    path: '/broadcasts/bc_valid_01',
    payload: { videoUrl: 'https://malicious.example.com/entertainment.mp4' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'PII Leak Attempt: non-owner reading /users/{userId}/private/info',
    auth: { uid: 'user_beta', email: 'beta@example.com', email_verified: true },
    operation: 'get',
    path: '/users/user_alpha/private/info',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Orphaned Broadcast: creating broadcast without existing /users/{uid} profile',
    auth: { uid: 'user_ghost', email: 'ghost@example.com', email_verified: true },
    operation: 'create',
    path: '/broadcasts/bc_orphan_08',
    payload: { id: 'bc_orphan_08', authorId: 'user_ghost', category: 'DOCUMENTARY', complianceStatus: 'APPROVED', complianceScore: 92 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Path ID Poisoning: special characters in document ID',
    auth: { uid: 'user_alpha', email: 'alpha@example.com', email_verified: true },
    operation: 'create',
    path: '/broadcasts/bad$id!@#',
    payload: { id: 'bad$id!@#', authorId: 'user_alpha' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Resource Exhaustion: oversized description > 1200 chars',
    auth: { uid: 'user_alpha', email: 'alpha@example.com', email_verified: true },
    operation: 'create',
    path: '/broadcasts/bc_oversize_10',
    payload: { id: 'bc_oversize_10', authorId: 'user_alpha', description: 'X'.repeat(5000) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Temporal Forgery: forged past createdAt timestamp',
    auth: { uid: 'user_alpha', email: 'alpha@example.com', email_verified: true },
    operation: 'create',
    path: '/broadcasts/bc_time_11',
    payload: { id: 'bc_time_11', authorId: 'user_alpha', createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthenticated Community-Only Broadcast Scrape',
    auth: null,
    operation: 'get',
    path: '/broadcasts/bc_community_private',
    expected: 'PERMISSION_DENIED',
  },
];
