import { CommunityNode, FederationAuditRecord, EmergencyKillSwitchState } from '../types/broadcast';

export const INITIAL_COMMUNITY_NODES: CommunityNode[] = [
  {
    id: 'comm-bengal-core',
    name: 'Bengal TV / Banglar Darpan LIVE',
    domain: 'bengaltv.com',
    country: 'United Kingdom / Bangladesh',
    region: 'London & Dhaka HQ',
    language: 'Bengali / English',
    operator: 'Sheikh Mehedi Hasan Nadim (UKSAI Ltd #17041560)',
    relationship: 'ALLOW',
    allowedCategories: ['NEWS', 'LIVE_NEWS', 'DOCUMENTARY', 'EDUCATION', 'COMMUNITY', 'PUBLIC_SERVICE'],
    deniedCategories: [],
    totalChannels: 4,
    activeStreams: 2,
    trustScore: 100,
    isReferenceNode: true,
    lastSync: 'Real-time Ingest Active'
  },
  {
    id: 'comm-usa-east',
    name: 'North America Diaspora Media Node',
    domain: 'usabengal.federation.org',
    country: 'United States',
    region: 'New York & Washington DC',
    language: 'English / Bengali',
    operator: 'North American Community Editorial Board',
    relationship: 'ALLOW',
    allowedCategories: ['EDUCATION', 'CULTURE', 'DOCUMENTARY', 'NEWS'],
    deniedCategories: ['POLITICAL_PROPAGANDA'],
    totalChannels: 3,
    activeStreams: 1,
    trustScore: 98,
    isReferenceNode: false,
    lastSync: '2 mins ago'
  },
  {
    id: 'comm-london-eu',
    name: 'UK & European Diaspora Node',
    domain: 'europe.open-iptv.net',
    country: 'United Kingdom',
    region: 'London & Birmingham',
    language: 'English / Bengali',
    operator: 'European Citizen Broadcasters Syndicate',
    relationship: 'ALLOW',
    allowedCategories: ['DOCUMENTARY', 'CULTURE', 'EDUCATION', 'PUBLIC_SERVICE'],
    deniedCategories: [],
    totalChannels: 2,
    activeStreams: 1,
    trustScore: 99,
    isReferenceNode: false,
    lastSync: '4 mins ago'
  },
  {
    id: 'comm-dhaka-rural',
    name: 'Grassroots Citizen Reporting Network',
    domain: 'citizen.bengaltv.com',
    country: 'Bangladesh',
    region: 'Sylhet, Chittagong, Rajshahi',
    language: 'Bengali',
    operator: 'Independent Regional Correspondents Guild',
    relationship: 'FOLLOW',
    allowedCategories: ['COMMUNITY', 'AGRICULTURE', 'PUBLIC_SERVICE', 'NEWS'],
    deniedCategories: [],
    totalChannels: 6,
    activeStreams: 3,
    trustScore: 95,
    isReferenceNode: false,
    lastSync: '1 min ago'
  },
  {
    id: 'comm-middle-east',
    name: 'Gulf Expatriate Media Hub',
    domain: 'gulf.open-iptv.net',
    country: 'UAE & Saudi Arabia',
    region: 'Dubai / Riyadh Expatriate Hub',
    language: 'Bengali / Arabic',
    operator: 'Middle East Migrant Worker Welfare Media',
    relationship: 'ALLOW',
    allowedCategories: ['PUBLIC_SERVICE', 'CULTURE', 'COMMUNITY', 'EDUCATION'],
    deniedCategories: [],
    totalChannels: 2,
    activeStreams: 1,
    trustScore: 96,
    isReferenceNode: false,
    lastSync: '6 mins ago'
  }
];

export const INITIAL_AUDIT_LOGS: FederationAuditRecord[] = [
  {
    eventId: 'evt-sec-901',
    timestamp: '2026-09-28 17:20:12 UTC',
    actorId: 'op-nadim-uk',
    actorRole: 'OPERATIONAL_LEAD',
    communityId: 'comm-bengal-core',
    action: 'POLICY_ENFORCE_CLASSIFICATION',
    targetResource: 'stream-dryrun-32-loop',
    result: 'SUCCESS',
    policyVersion: 'v1.0-CONST',
    signature: 'rsa4096:9a4e...78f1'
  },
  {
    eventId: 'evt-sec-902',
    timestamp: '2026-09-28 16:55:04 UTC',
    actorId: 'standards-gateway-validator',
    actorRole: 'AUTOMATED_BROADCAST_AUDITOR',
    communityId: 'comm-dhaka-rural',
    action: 'TAXONOMY_STANDARDS_SCAN',
    targetResource: 'content-upload-batch-04',
    result: 'SUCCESS',
    policyVersion: 'v1.0-CONST',
    signature: 'hmac-sha256:7bc1...39d0'
  },
  {
    eventId: 'evt-sec-903',
    timestamp: '2026-09-28 15:30:19 UTC',
    actorId: 'node-federation-daemon',
    actorRole: 'FEDERATED_NODE_ROUTER',
    communityId: 'comm-usa-east',
    action: 'DISCOVERY_EXCHANGE_NO_REDISTRIBUTE',
    targetResource: 'meta-feed-docs-32',
    result: 'SUCCESS',
    policyVersion: 'v1.0-CONST',
    signature: 'ed25519:e18b...550a'
  },
  {
    eventId: 'evt-sec-904',
    timestamp: '2026-09-28 14:12:44 UTC',
    actorId: 'tenant-isolation-monitor',
    actorRole: 'ZERO_TRUST_ENGINE',
    communityId: 'comm-middle-east',
    action: 'ISOLATION_BOUNDARY_VERIFIED',
    targetResource: 'private-viewer-telemetry',
    result: 'ISOLATED',
    policyVersion: 'v1.0-CONST',
    signature: 'sha256:09fe...c218'
  }
];

export const INITIAL_KILL_SWITCH_STATE: EmergencyKillSwitchState = {
  globalFederationPause: false,
  communityFederationPause: false,
  channelDisable: false,
  streamDisable: false,
  userDisable: false,
  apiDisable: false
};

