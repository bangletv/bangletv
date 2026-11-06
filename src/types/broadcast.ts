export type ContentCategory = 
  | 'NEWS'
  | 'LIVE_NEWS'
  | 'SPORTS'
  | 'EDUCATION'
  | 'SCIENCE'
  | 'TECHNOLOGY'
  | 'CULTURE'
  | 'DOCUMENTARY'
  | 'ENTERTAINMENT'
  | 'MUSIC'
  | 'RELIGION'
  | 'COMMUNITY'
  | 'PUBLIC_SERVICE'
  | 'CHILDREN'
  | 'CARTOONS'
  | 'COOKING'
  | 'SPIRITUAL'
  | 'OTHER';

export type DistributionScope = 
  | 'PRIVATE'
  | 'COMMUNITY_ONLY'
  | 'FOLLOWERS_ONLY'
  | 'FEDERATION_ALLOWED'
  | 'PUBLIC';

export type FederationRelationship = 
  | 'DISCOVER'
  | 'FOLLOW'
  | 'ALLOW'
  | 'DENY'
  | 'BLOCK'
  | 'UNFOLLOW';

export type StreamProtocol = 'hls' | 'dash' | 'youtube' | 'mp4' | 'direct';

export type TimeshiftStoragePolicy = 
  | 'IN_MEMORY_EPHEMERAL' 
  | 'CLIENT_INDEXEDDB' 
  | 'DISABLED_BY_RIGHTSHOLDER';

export interface TimeshiftPolicy {
  allowed: boolean;
  maxBufferMinutes: number; // e.g. 15, 30, 60, 120 minutes
  storagePolicy: TimeshiftStoragePolicy;
  rightsHolderAttribution?: string;
  allowOfflineCache?: boolean;
}

export interface EpgProgram {
  id: string;
  channelId: string;
  title: string;
  description: string;
  startTime: string; // HH:MM or ISO
  endTime: string;
  durationMinutes: number;
  category: ContentCategory;
  rating?: string;
  isCurrent?: boolean;
}

export interface BroadcastItem {
  id: string;
  channelNumber?: number;
  title: string;
  category: ContentCategory | 'breaking' | 'national' | 'citizen' | 'investigative' | 'economy' | 'tech';
  categoryLabel: string;
  reporter?: string;
  location: string;
  duration: number; // in seconds
  videoUrl: string; // HLS .m3u8, direct mp4 or embed
  hlsUrl?: string; // Direct HLS stream URL for HLS.js
  backupStreams?: string[]; // Resilient backup stream URLs
  streamType?: StreamProtocol;
  youtubeId?: string; // YouTube video/live ID for free playout
  backupYoutubeIds?: string[]; // Alternative YouTube video/live IDs for the same channel
  youtubeChannelId?: string; // YouTube Channel ID (UC...) for 24/7 real-time live streaming
  sourceNetwork?: string;
  thumbnailUrl: string;
  logoUrl?: string;
  regulatoryApproved: boolean;
  complianceScore: number;
  uploadedAt: string;
  views: number;
  isLive?: boolean;
  isShort?: boolean;
  description: string;
  openSourceLicense: string;
  currentProgramTitle?: string;
  currentProgramCategory?: string;
  epgSchedule?: EpgProgram[];
  
  // Open IPTV Federation Sovereign Properties
  ownerCommunityId?: string;
  communityName?: string;
  distributionScope?: DistributionScope;
  classificationTaxonomy?: {
    country: string;
    region: string;
    language: string;
    ageClass: 'ALL' | '12+' | '16+' | '18+';
    editorialClass: 'STANDARD' | 'VERIFIED_INVESTIGATIVE' | 'COMMUNITY_DISPATCH';
  };
  contentHash?: string;
  metadataHash?: string;
  federationReversible?: boolean;
  timeshiftPolicy?: TimeshiftPolicy;
}

export interface RegulatoryDeclaration {
  factualAccuracy: boolean;
  noHateSpeechOrDefamation: boolean;
  copyrightClearance: boolean;
  noThirdPartyWatermark: boolean;
  publicInterestCompliance: boolean;
  distributionScopeExplicitConsent: boolean;
  communitySovereigntyAcknowledged: boolean;
}

export interface PlayoutStatus {
  currentProgramId: string;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  quality: '1080p' | '720p' | '480p' | 'auto';
  serverUptime: string;
  activeBitrate: string;
  fps: number;
  droppedFrames: number;
  logoPosition: 'top-right' | 'top-left';
  autoLoopEnabled: boolean;
  emergencyOverrideActive?: boolean;
}

export interface CommunityNode {
  id: string;
  name: string;
  domain: string;
  country: string;
  region: string;
  language: string;
  operator: string;
  relationship: FederationRelationship;
  allowedCategories: string[];
  deniedCategories: string[];
  totalChannels: number;
  activeStreams: number;
  trustScore: number;
  isReferenceNode?: boolean;
  lastSync: string;
}

export interface FederationAuditRecord {
  eventId: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  communityId: string;
  action: string;
  targetResource: string;
  result: 'SUCCESS' | 'DENIED' | 'REVOKED' | 'ISOLATED';
  policyVersion: string;
  signature: string;
}

export interface EmergencyKillSwitchState {
  globalFederationPause: boolean;
  communityFederationPause: boolean;
  channelDisable: boolean;
  streamDisable: boolean;
  userDisable: boolean;
  apiDisable: boolean;
}

export interface AiModerationResult {
  id: string;
  title: string;
  detectedLanguage: string;
  suggestedCategory: ContentCategory;
  suggestedAgeRating: 'ALL' | '12+' | '16+' | '18+';
  complianceStatus: 'APPROVED' | 'FLAGGED_FOR_REVIEW' | 'REJECTED';
  riskScore: number; // 0 to 100
  policyChecks: {
    noHateSpeech: boolean;
    noGraphicViolence: boolean;
    licensingAwareness: boolean;
    privacyRespect: boolean;
    noPropaganda: boolean;
  };
  reasoning: string;
  reviewedByHuman?: boolean;
  reviewerNotes?: string;
  timestamp: string;
}
