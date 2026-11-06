import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  writeBatch,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { ContentCategory, DistributionScope } from './types/broadcast';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on application boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface ContributorProfile {
  uid: string;
  displayName: string;
  communityId: string;
  communityName: string;
  region: string;
  bio: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PublishedBroadcastDoc {
  id: string;
  authorId: string;
  authorName: string;
  communityId: string;
  communityName: string;
  distributionScope: 'PUBLIC' | 'COMMUNITY_ONLY';
  title: string;
  description: string;
  category: ContentCategory;
  location: string;
  language: string;
  videoUrl: string;
  complianceStatus: 'APPROVED';
  complianceScore: number;
  complianceReasoning: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Sanitize strings to guarantee adherence to firebase-blueprint.json & firestore.rules bounds
function sanitizeId(raw: string, fallback: string = 'desk-global'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  return cleaned.length >= 2 ? cleaned : fallback;
}

function clampString(raw: string, minLen: number, maxLen: number, fallback: string): string {
  const trimmed = raw.trim().slice(0, maxLen);
  if (trimmed.length >= minLen) return trimmed;
  return fallback.slice(0, maxLen);
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutContributor(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function getContributorProfile(uid: string): Promise<ContributorProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as ContributorProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertContributorProfile(input: {
  uid: string;
  email: string;
  displayName: string;
  communityId: string;
  communityName: string;
  region: string;
  bio: string;
  isExisting: boolean;
}): Promise<ContributorProfile> {
  const userPath = `users/${input.uid}`;
  const safeProfile = {
    uid: input.uid,
    displayName: clampString(input.displayName, 2, 80, 'Bengal TV Correspondent'),
    communityId: sanitizeId(input.communityId, 'global-bengal-desk'),
    communityName: clampString(input.communityName, 2, 80, 'Global Bengal Desk'),
    region: clampString(input.region, 2, 80, 'Dhaka / Global'),
    bio: input.bio.trim().slice(0, 300),
  };

  try {
    if (input.isExisting) {
      await updateDoc(doc(db, 'users', input.uid), {
        displayName: safeProfile.displayName,
        communityId: safeProfile.communityId,
        communityName: safeProfile.communityName,
        region: safeProfile.region,
        bio: safeProfile.bio,
        updatedAt: serverTimestamp(),
      });
    } else {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', input.uid), {
        ...safeProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'users', input.uid, 'private', 'info'), {
        uid: input.uid,
        email: clampString(input.email, 3, 160, 'verified@bengaltv.com'),
        createdAt: serverTimestamp(),
      });
      await batch.commit();
    }
    return safeProfile;
  } catch (error) {
    handleFirestoreError(
      error,
      input.isExisting ? OperationType.UPDATE : OperationType.CREATE,
      userPath
    );
  }
}

export async function publishVerifiedBroadcast(input: {
  authorId: string;
  authorName: string;
  communityId: string;
  communityName: string;
  distributionScope: 'PUBLIC' | 'COMMUNITY_ONLY';
  title: string;
  description: string;
  category: ContentCategory;
  location: string;
  language: string;
  videoUrl: string;
  complianceScore: number;
  complianceReasoning: string;
}): Promise<string> {
  const broadcastId = `bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `broadcasts/${broadcastId}`;

  const allowedCats: ContentCategory[] = [
    'NEWS',
    'LIVE_NEWS',
    'DOCUMENTARY',
    'EDUCATION',
    'SCIENCE',
    'PUBLIC_SERVICE',
    'COMMUNITY',
  ];
  const safeCat: ContentCategory = allowedCats.includes(input.category) ? input.category : 'NEWS';

  const payload = {
    id: broadcastId,
    authorId: input.authorId,
    authorName: clampString(input.authorName, 2, 80, 'Bengal TV Contributor'),
    communityId: sanitizeId(input.communityId, 'global-bengal-desk'),
    communityName: clampString(input.communityName, 2, 80, 'Global Bengal Desk'),
    distributionScope: input.distributionScope === 'COMMUNITY_ONLY' ? 'COMMUNITY_ONLY' : 'PUBLIC',
    title: clampString(input.title, 5, 140, 'Journalistic Broadcast Dispatch'),
    description: clampString(
      input.description,
      10,
      1200,
      'Verified journalistic report published on Bengal TV.'
    ),
    category: safeCat,
    location: clampString(input.location, 2, 100, 'Global Desk'),
    language: clampString(input.language, 2, 40, 'Bengali / English'),
    videoUrl: clampString(input.videoUrl, 5, 600, '/uploads/sample.mp4'),
    complianceStatus: 'APPROVED' as const,
    complianceScore: Math.max(70, Math.min(100, Math.round(input.complianceScore))),
    complianceReasoning: clampString(
      input.complianceReasoning,
      5,
      600,
      'Approved by Bengal TV Journalistic & Humanitarian Compliance Gate.'
    ),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'broadcasts', broadcastId), payload);
    return broadcastId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBroadcastDistributionScope(
  broadcastId: string,
  newScope: Extract<DistributionScope, 'PUBLIC' | 'COMMUNITY_ONLY'>
): Promise<void> {
  const path = `broadcasts/${broadcastId}`;
  try {
    await updateDoc(doc(db, 'broadcasts', broadcastId), {
      distributionScope: newScope,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePublishedBroadcast(broadcastId: string): Promise<void> {
  const path = `broadcasts/${broadcastId}`;
  try {
    await deleteDoc(doc(db, 'broadcasts', broadcastId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribePublicBroadcasts(
  onData: (items: PublishedBroadcastDoc[]) => void
): Unsubscribe {
  const path = 'broadcasts';
  const q = query(
    collection(db, 'broadcasts'),
    where('complianceStatus', '==', 'APPROVED'),
    where('distributionScope', '==', 'PUBLIC')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map((d) => d.data() as PublishedBroadcastDoc);
      docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      onData(docs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeCommunityBroadcasts(
  communityId: string,
  onData: (items: PublishedBroadcastDoc[]) => void
): Unsubscribe {
  const path = 'broadcasts';
  const safeCommunityId = sanitizeId(communityId, 'global-bengal-desk');
  const q = query(
    collection(db, 'broadcasts'),
    where('complianceStatus', '==', 'APPROVED'),
    where('distributionScope', '==', 'COMMUNITY_ONLY'),
    where('communityId', '==', safeCommunityId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map((d) => d.data() as PublishedBroadcastDoc);
      docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      onData(docs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
