import React, { useState, useEffect, ChangeEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  Upload,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Globe,
  Users,
  Play,
  LogOut,
  UserCheck,
  RefreshCw,
  Trash2,
  Share2,
  FileVideo,
  Link as LinkIcon,
  Check,
  Edit3,
  Lock,
} from 'lucide-react';
import {
  signInWithGoogle,
  signOutContributor,
  upsertContributorProfile,
  publishVerifiedBroadcast,
  updateBroadcastDistributionScope,
  deletePublishedBroadcast,
  type ContributorProfile,
  type PublishedBroadcastDoc,
} from '../firebase';
import {
  analyzeContentStandards,
  uploadVideoBinary,
  type ComplianceAnalysisResponse,
} from '../services/complianceGateway';
import type { BroadcastItem, ContentCategory } from '../types/broadcast';
import { BENGAL_TV_OFFICIAL_LOGO, EDITORIAL_THUMBNAILS } from '../data/iptvChannels';

interface CommunityBroadcastStudioProps {
  currentUser: User | null;
  contributorProfile: ContributorProfile | null;
  onProfileUpdated: (profile: ContributorProfile) => void;
  publicBroadcasts: PublishedBroadcastDoc[];
  communityBroadcasts: PublishedBroadcastDoc[];
  onWatchBroadcast: (item: BroadcastItem) => void;
}

interface CommunityDeskPreset {
  id: string;
  name: string;
  region: string;
}

const COMMUNITY_DESKS: CommunityDeskPreset[] = [
  { id: 'dhaka-desk', name: 'Dhaka Editorial Desk', region: 'Dhaka, Bangladesh' },
  { id: 'kolkata-desk', name: 'Kolkata & West Bengal Desk', region: 'Kolkata, India' },
  { id: 'newyork-desk', name: 'North America Bengali Desk', region: 'New York, USA' },
  { id: 'london-desk', name: 'UK & Europe Bengali Desk', region: 'London, United Kingdom' },
  {
    id: 'global-humanitarian-desk',
    name: 'Global Humanitarian & Mankind Desk',
    region: 'Geneva · International',
  },
];

const ALLOWED_EDITORIAL_CATEGORIES: Array<{ value: ContentCategory; label: string }> = [
  { value: 'NEWS', label: 'Journalistic News Report' },
  { value: 'LIVE_NEWS', label: 'Live Field Dispatch' },
  { value: 'DOCUMENTARY', label: 'Humanitarian & Mankind Documentary' },
  { value: 'PUBLIC_SERVICE', label: 'Civic & Public Interest Briefing' },
  { value: 'EDUCATION', label: 'Educational & Literacy Documentary' },
  { value: 'SCIENCE', label: 'Climate, Health & Science Report' },
  { value: 'COMMUNITY', label: 'Community Welfare & Diaspora Report' },
];

export function mapPublishedDocToBroadcastItem(
  docItem: PublishedBroadcastDoc,
  indexOffset: number = 0
): BroadcastItem {
  const isHls = docItem.videoUrl.includes('.m3u8');
  const ytMatch = docItem.videoUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  const youtubeId = ytMatch ? ytMatch[1] : undefined;
  const isDoc =
    docItem.category === 'DOCUMENTARY' ||
    docItem.category === 'SCIENCE' ||
    docItem.category === 'EDUCATION';

  return {
    id: docItem.id,
    channelNumber: 800 + indexOffset,
    title: docItem.title,
    category: docItem.category,
    categoryLabel:
      docItem.distributionScope === 'COMMUNITY_ONLY'
        ? `${docItem.communityName} · Community Broadcast`
        : `${docItem.communityName} · Global Verified`,
    reporter: docItem.authorName,
    location: docItem.location,
    duration: 1800,
    videoUrl: docItem.videoUrl,
    hlsUrl: isHls ? docItem.videoUrl : undefined,
    youtubeId,
    streamType: youtubeId ? 'youtube' : isHls ? 'hls' : 'direct',
    sourceNetwork: docItem.communityName,
    thumbnailUrl: isDoc
      ? EDITORIAL_THUMBNAILS.humanitarianDoc
      : EDITORIAL_THUMBNAILS.bengaliNewsroom,
    logoUrl: BENGAL_TV_OFFICIAL_LOGO,
    regulatoryApproved: true,
    complianceScore: docItem.complianceScore,
    uploadedAt: 'AI-Verified Citizen Broadcast',
    views: 1,
    isLive: docItem.category === 'LIVE_NEWS',
    description: `${docItem.description} — Reported by ${docItem.authorName} (${docItem.location}).`,
    openSourceLicense: 'Bengal TV Verified Contributor Charter',
    ownerCommunityId: docItem.communityId,
    communityName: docItem.communityName,
    distributionScope: docItem.distributionScope,
    classificationTaxonomy: {
      country: docItem.location,
      region: 'Citizen & Documentary Desk',
      language: docItem.language,
      ageClass: 'ALL',
      editorialClass: isDoc ? 'VERIFIED_INVESTIGATIVE' : 'COMMUNITY_DISPATCH',
    },
  };
}

export default function CommunityBroadcastStudio({
  currentUser,
  contributorProfile,
  onProfileUpdated,
  publicBroadcasts,
  communityBroadcasts,
  onWatchBroadcast,
}: CommunityBroadcastStudioProps) {
  // Auth & Profile state
  const [authBusy, setAuthBusy] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>('');
  const [profileDeskId, setProfileDeskId] = useState<string>('dhaka-desk');
  const [profileRegion, setProfileRegion] = useState<string>('Dhaka, Bangladesh');
  const [profileBio, setProfileBio] = useState<string>('');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);

  // Upload & Compliance Form state
  const [sourceMode, setSourceMode] = useState<'file' | 'url'>('file');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ContentCategory>('DOCUMENTARY');
  const [location, setLocation] = useState<string>('Sundarbans, Bangladesh');
  const [language, setLanguage] = useState<string>('Bengali');
  const [distributionScope, setDistributionScope] = useState<'PUBLIC' | 'COMMUNITY_ONLY'>('PUBLIC');
  const [description, setDescription] = useState<string>('');
  const [transcriptNotes, setTranscriptNotes] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // AI Compliance Audit state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [complianceResult, setComplianceResult] = useState<ComplianceAnalysisResponse | null>(null);
  const [auditedSignature, setAuditedSignature] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishBanner, setPublishBanner] = useState<string | null>(null);

  // Feed Directory state
  const [feedScopeTab, setFeedScopeTab] = useState<'PUBLIC' | 'COMMUNITY_ONLY'>('PUBLIC');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (contributorProfile) {
      setProfileName(contributorProfile.displayName);
      setProfileDeskId(contributorProfile.communityId);
      setProfileRegion(contributorProfile.region);
      setProfileBio(contributorProfile.bio || '');
      setIsEditingProfile(false);
    } else if (currentUser) {
      setProfileName(currentUser.displayName || 'Bengal TV Correspondent');
      setProfileDeskId('dhaka-desk');
      setProfileRegion('Dhaka, Bangladesh');
      setProfileBio('Journalistic & humanitarian documentary contributor.');
      setIsEditingProfile(true);
    }
  }, [contributorProfile, currentUser]);

  const currentFormSignature = `${title.trim()}|${category}|${description.trim()}|${videoUrl.trim()}|${transcriptNotes.trim()}`;
  const isApprovalFresh =
    complianceResult?.complianceStatus === 'APPROVED' &&
    auditedSignature === currentFormSignature;

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to complete Google sign-in.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileSaving(true);
    setAuthError(null);
    try {
      const deskPreset = COMMUNITY_DESKS.find((d) => d.id === profileDeskId);
      const saved = await upsertContributorProfile({
        uid: currentUser.uid,
        email: currentUser.email || 'verified@bengaltv.com',
        displayName: profileName,
        communityId: profileDeskId,
        communityName: deskPreset ? deskPreset.name : profileDeskId,
        region: profileRegion,
        bio: profileBio,
        isExisting: Boolean(contributorProfile),
      });
      onProfileUpdated(saved);
      setIsEditingProfile(false);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to save contributor profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleVideoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setPublishBanner(null);

    if (file.size > 65 * 1024 * 1024) {
      setUploadError('Video file exceeds the 65 MB studio upload limit. Use a compressed MP4/WebM or direct HLS/HTTPS stream URL.');
      return;
    }

    setIsUploadingFile(true);
    try {
      const uploaded = await uploadVideoBinary(file);
      setVideoUrl(uploaded.videoUrl);
      setUploadedFileName(`${file.name} (${(uploaded.bytes / (1024 * 1024)).toFixed(1)} MB)`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Video upload failed.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const loadSampleSubmission = (type: 'humanitarian' | 'entertainment_test') => {
    setPublishBanner(null);
    setUploadError(null);
    setComplianceResult(null);
    setSourceMode('url');

    if (type === 'humanitarian') {
      setTitle('উপকূলীয় মানুষের জীবন ও সুপেয় পানির সংগ্রাম — সুন্দরবন মানবিক প্রামাণ্যচিত্র');
      setCategory('DOCUMENTARY');
      setLocation('Satkhira · Sundarbans Coast');
      setLanguage('Bengali');
      setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      setDescription(
        'উপকূলীয় অঞ্চলে জলবায়ু পরিবর্তনের প্রভাবে লবণাক্ততা বৃদ্ধি এবং স্থানীয় মানুষের সৌর-চালিত বৃষ্টির পানি সংরক্ষণ উদ্যোগের ওপর সরেজমিন মানবিক প্রামাণ্য প্রতিবেদন।'
      );
      setTranscriptNotes(
        'Field interviews with coastal families, public health workers, and hydrologists documenting community-led clean water resilience.'
      );
    } else {
      setTitle('ঈদ স্পেশাল রোমান্টিক কমেডি মেগা সিরিয়াল ও বলিউড ড্যান্স শো');
      setCategory('NEWS');
      setLocation('Studio Set');
      setLanguage('Bengali');
      setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      setDescription(
        'তারকাদের নিয়ে জমজমাট বিনোদনমূলক নাচ, গান, সেলিব্রিটি গসিপ ও পারিবারিক কমেডি ড্রামা সিরিয়াল।'
      );
      setTranscriptNotes('Celebrity entertainment variety show and fictional drama episode.');
    }
  };

  const handleRunComplianceCheck = async () => {
    setUploadError(null);
    setPublishBanner(null);
    if (title.trim().length < 5 || description.trim().length < 15) {
      setUploadError('Please provide a clear journalistic headline (min 5 chars) and factual report summary (min 15 chars).');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeContentStandards(
        title.trim(),
        description.trim(),
        videoUrl.trim() || 'pending-upload-verification',
        category,
        location.trim(),
        transcriptNotes.trim()
      );
      setComplianceResult(result);
      setAuditedSignature(currentFormSignature);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Compliance gateway check failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePublishBroadcast = async () => {
    if (!currentUser || !contributorProfile) {
      setUploadError('Please sign in and save your Contributor Desk profile before publishing.');
      return;
    }
    if (!videoUrl.trim()) {
      setUploadError('Please upload a video file (.mp4/.webm/.mov) or provide a valid stream URL before publishing.');
      return;
    }
    if (!isApprovalFresh || !complianceResult) {
      setUploadError('All uploads must pass the AI Censorship & Journalistic Compliance Audit prior to broadcast.');
      return;
    }

    setIsPublishing(true);
    setUploadError(null);
    try {
      const score =
        typeof complianceResult.complianceScore === 'number'
          ? complianceResult.complianceScore
          : Math.max(75, 100 - complianceResult.riskScore);

      await publishVerifiedBroadcast({
        authorId: currentUser.uid,
        authorName: contributorProfile.displayName,
        communityId: contributorProfile.communityId,
        communityName: contributorProfile.communityName,
        distributionScope,
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        language: language.trim(),
        videoUrl: videoUrl.trim(),
        complianceScore: score,
        complianceReasoning: complianceResult.reasoning,
      });

      setPublishBanner(
        distributionScope === 'PUBLIC'
          ? 'Broadcast vetted & published globally on Bengal TV. Viewers worldwide can now tune in.'
          : `Broadcast vetted & shared exclusively with ${contributorProfile.communityName}.`
      );
      setTitle('');
      setDescription('');
      setTranscriptNotes('');
      setUploadedFileName(null);
      setComplianceResult(null);
      setAuditedSignature('');
      setFeedScopeTab(distributionScope);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to publish broadcast.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyShareLink = (broadcastId: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?watch=${encodeURIComponent(broadcastId)}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedId(broadcastId);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const activeFeedList =
    feedScopeTab === 'PUBLIC' ? publicBroadcasts : communityBroadcasts;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 text-[#1D1D1F]">
      {/* Editorial Studio Header */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <img
            src={BENGAL_TV_OFFICIAL_LOGO}
            alt="Bengal TV Official Emblem"
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-2xl object-contain bg-white border border-[#E5E5EA] p-1 shrink-0"
          />
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[#6E6E73]">
              Global Citizen Journalism · Humanitarian Documentary Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Contributor Account & AI-Vetted Broadcast Studio
            </h1>
            <p className="text-sm text-[#6E6E73] max-w-3xl leading-relaxed">
              Register as a verified correspondent from anywhere in the world to upload field journalism and mankind-focused documentaries. Every submission passes through our automated Gemini censorship and editorial compliance gate before global or community broadcast.
            </p>
          </div>
        </div>

        <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3 text-xs text-[#6E6E73] shrink-0 space-y-1">
          <div className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[#1F7A3F]" />
            <span>Editorial Policy Mandate</span>
          </div>
          <div>Allowed: News · Investigative · Humanitarian · Science</div>
          <div className="text-[#D70015] font-medium">Excluded: General Entertainment · Fiction · Music Videos</div>
        </div>
      </div>

      {/* Main 2-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): User Registration & Contributor Desk Profile */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#1D1D1F]">
                  Contributor Registration
                </h2>
                <p className="text-xs text-[#6E6E73] mt-0.5">
                  Verified account & community affiliation
                </p>
              </div>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => signOutContributor()}
                  className="px-2.5 py-1.5 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>

            {!currentUser ? (
              <div className="space-y-4">
                <p className="text-xs text-[#6E6E73] leading-relaxed">
                  Sign in with your Google account to register as a Bengal TV contributor, select your regional community desk, and upload verified broadcasts.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authBusy}
                  className="w-full py-2.5 px-4 bg-[#1D1D1F] hover:bg-[#333336] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {authBusy ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={15} />
                      <span>Continue with Google Account</span>
                    </>
                  )}
                </button>
              </div>
            ) : isEditingProfile || !contributorProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Correspondent Byline Name
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
                    placeholder="Your full name or journalistic byline"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Assigned Community Desk
                  </label>
                  <select
                    value={profileDeskId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setProfileDeskId(nextId);
                      const found = COMMUNITY_DESKS.find((d) => d.id === nextId);
                      if (found) setProfileRegion(found.region);
                    }}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
                  >
                    {COMMUNITY_DESKS.map((desk) => (
                      <option key={desk.id} value={desk.id}>
                        {desk.name} ({desk.region})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Reporting City / Country
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={profileRegion}
                    onChange={(e) => setProfileRegion(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Journalistic Beat / Credentials
                  </label>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
                    placeholder="e.g. Climate resilience, civic affairs, humanitarian field reporting"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex-1 py-2.5 px-4 bg-[#0066CC] hover:bg-[#0055B3] text-white font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving Profile...' : 'Complete Registration'}
                  </button>
                  {contributorProfile && (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="py-2.5 px-3 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] font-medium rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#1D1D1F]">
                      {contributorProfile.displayName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="text-[#0066CC] hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="text-[#6E6E73]">
                    {contributorProfile.communityName} · {contributorProfile.region}
                  </div>
                  {contributorProfile.bio && (
                    <p className="text-[#1D1D1F] pt-1 leading-relaxed">{contributorProfile.bio}</p>
                  )}
                </div>
                <div className="text-[11px] text-[#1F7A3F] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={14} />
                  <span>Authorized for AI-vetted community & global broadcast</span>
                </div>
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-xl bg-[#FFF2F2] border border-[#FFD6D9] text-xs text-[#D70015]">
                {authError}
              </div>
            )}
          </div>

          {/* Compliance Pipeline Info Card */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-sm text-[#1D1D1F]">
              How AI Broadcast Vetting Works
            </h3>
            <ol className="space-y-2.5 text-[#6E6E73] leading-relaxed list-decimal pl-4">
              <li>
                <strong className="text-[#1D1D1F]">Upload or Link Stream:</strong> Attach an MP4/WebM report or an HLS `.m3u8` / HTTPS broadcast stream.
              </li>
              <li>
                <strong className="text-[#1D1D1F]">Automated Gemini Audit:</strong> Our server-side compliance engine screens against hate speech, graphic violence, propaganda, and strictly filters out general entertainment.
              </li>
              <li>
                <strong className="text-[#1D1D1F]">Community or Global Playout:</strong> Approved dispatches are cryptographically logged and immediately playable in the Bengal TV console.
              </li>
            </ol>
          </div>
        </div>

        {/* Right Column (8 cols): Upload & AI Compliance Gate */}
        <div className="lg:col-span-8 bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5EA] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#1D1D1F]">
                Submit Journalistic or Humanitarian Video
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Step 1: Upload & Metadata · Step 2: AI Compliance Filter · Step 3: Broadcast
              </p>
            </div>

            {/* Quick Verification Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => loadSampleSubmission('humanitarian')}
                className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-[11px] font-medium rounded-lg border border-[#E5E5EA] transition-colors cursor-pointer whitespace-nowrap"
              >
                Sample Humanitarian Doc
              </button>
              <button
                type="button"
                onClick={() => loadSampleSubmission('entertainment_test')}
                className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#6E6E73] text-[11px] font-medium rounded-lg border border-[#E5E5EA] transition-colors cursor-pointer whitespace-nowrap"
              >
                Test Entertainment Filter
              </button>
            </div>
          </div>

          {/* Video Source Segmented Control */}
          <div className="space-y-3">
            <div className="inline-flex bg-[#EFEFF4] p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSourceMode('file')}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  sourceMode === 'file'
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <FileVideo size={14} />
                <span>Upload Video File (.mp4 / .webm)</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('url')}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  sourceMode === 'url'
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <LinkIcon size={14} />
                <span>Direct HLS (.m3u8) or Video URL</span>
              </button>
            </div>

            {sourceMode === 'file' ? (
              <div className="border border-dashed border-[#D2D2D7] hover:border-[#0066CC] rounded-2xl p-6 bg-[#F5F5F7]/60 text-center transition-colors">
                <input
                  type="file"
                  id="studio-video-upload"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="studio-video-upload"
                  className="cursor-pointer flex flex-col items-center gap-1.5"
                >
                  <Upload size={26} className="text-[#0066CC]" />
                  <span className="text-xs font-semibold text-[#1D1D1F]">
                    {isUploadingFile
                      ? 'Uploading video binary to broadcast server...'
                      : uploadedFileName
                      ? `Uploaded: ${uploadedFileName}`
                      : 'Click to select MP4, WebM, or MOV video file (up to 65 MB)'}
                  </span>
                  <span className="text-[11px] text-[#6E6E73]">
                    Original camera footage or edited documentary package
                  </span>
                </label>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  HTTPS Broadcast Stream or Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.org/live/dispatch.m3u8 or https://.../report.mp4"
                  className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Editorial Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1D1D1F] mb-1">
                Broadcast Headline / Documentary Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                placeholder="Factual headline describing the news dispatch or humanitarian documentary"
                className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1D1D1F] mb-1">
                Editorial Classification
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ContentCategory)}
                className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
              >
                {ALLOWED_EDITORIAL_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1D1D1F] mb-1">
                Broadcast Audience Scope
              </label>
              <select
                value={distributionScope}
                onChange={(e) =>
                  setDistributionScope(e.target.value as 'PUBLIC' | 'COMMUNITY_ONLY')
                }
                className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
              >
                <option value="PUBLIC">Global Broadcast — Viewable Worldwide</option>
                <option value="COMMUNITY_ONLY">
                  Community Desk Only — {contributorProfile?.communityName || 'Assigned Community'}
                </option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1D1D1F] mb-1">
                Dateline / Field Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
                placeholder="e.g. Dhaka, Bangladesh · Jackson Heights, NY"
                className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1D1D1F] mb-1">
                Primary Spoken Language
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                maxLength={40}
                placeholder="Bengali / English"
                className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1D1D1F] mb-1">
                Editorial Summary & Verification Context
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1200}
                placeholder="Summarize the factual reporting, sources interviewed, and humanitarian or civic relevance..."
                className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1D1D1F] mb-1">
                Optional Transcript / Narration Notes (For AI Compliance Review)
              </label>
              <input
                type="text"
                value={transcriptNotes}
                onChange={(e) => setTranscriptNotes(e.target.value)}
                maxLength={500}
                placeholder="Key spoken quotes or narration summary..."
                className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
              />
            </div>
          </div>

          {uploadError && (
            <div className="p-3.5 rounded-xl bg-[#FFF2F2] border border-[#FFD6D9] text-xs text-[#D70015] flex items-center gap-2">
              <XCircle size={16} className="shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {publishBanner && (
            <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#1F7A3F] flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{publishBanner}</span>
            </div>
          )}

          {/* AI Censorship & Compliance Result Card */}
          {complianceResult && (
            <div
              className={`p-5 rounded-2xl border space-y-3 text-xs ${
                complianceResult.complianceStatus === 'APPROVED'
                  ? 'bg-[#F0FDF4]/70 border-[#BBF7D0]'
                  : 'bg-[#FFF2F2]/80 border-[#FFD6D9]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {complianceResult.complianceStatus === 'APPROVED' ? (
                    <CheckCircle2 size={18} className="text-[#1F7A3F]" />
                  ) : (
                    <XCircle size={18} className="text-[#D70015]" />
                  )}
                  <span
                    className={`font-bold text-sm ${
                      complianceResult.complianceStatus === 'APPROVED'
                        ? 'text-[#1F7A3F]'
                        : 'text-[#D70015]'
                    }`}
                  >
                    {complianceResult.complianceStatus === 'APPROVED'
                      ? 'Cleared by AI Journalistic & Humanitarian Filter'
                      : 'Blocked by Editorial & Censorship Policy'}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-[#6E6E73]">
                  Compliance Score:{' '}
                  <strong className="text-[#1D1D1F]">
                    {complianceResult.complianceScore ?? Math.max(0, 100 - complianceResult.riskScore)}/100
                  </strong>{' '}
                  · Risk: {complianceResult.riskScore}/100
                </span>
              </div>

              <p className="text-[#1D1D1F] leading-relaxed bg-white/90 border border-[#E5E5EA] rounded-xl p-3">
                {complianceResult.reasoning}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#6E6E73] pt-1">
                <span>
                  Hate Speech Free:{' '}
                  <strong className="text-[#1D1D1F]">
                    {complianceResult.policyChecks.noHateSpeech ? 'Pass' : 'Fail'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Non-Graphic:{' '}
                  <strong className="text-[#1D1D1F]">
                    {complianceResult.policyChecks.noGraphicViolence ? 'Pass' : 'Fail'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Anti-Propaganda:{' '}
                  <strong className="text-[#1D1D1F]">
                    {complianceResult.policyChecks.noPropaganda ? 'Pass' : 'Fail'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Detected Language:{' '}
                  <strong className="text-[#1D1D1F]">{complianceResult.detectedLanguage}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Action Bar: Step 1 Audit -> Step 2 Publish */}
          <div className="pt-2 border-t border-[#E5E5EA] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRunComplianceCheck}
              disabled={isAnalyzing}
              className="px-5 py-2.5 bg-[#F5F5F7] hover:bg-[#E5E5EA] border border-[#D2D2D7] text-[#1D1D1F] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-[#0066CC]" />
                  <span>Running AI Compliance Filter...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={15} className="text-[#0066CC]" />
                  <span>1. Run AI Censorship & Policy Audit</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePublishBroadcast}
              disabled={!currentUser || !contributorProfile || !isApprovalFresh || !videoUrl.trim() || isPublishing}
              className="px-6 py-2.5 bg-[#0066CC] hover:bg-[#0055B3] disabled:bg-[#E5E5EA] disabled:text-[#86868B] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {isPublishing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Publishing Broadcast...</span>
                </>
              ) : !currentUser ? (
                <>
                  <Lock size={14} />
                  <span>Sign In Required to Publish</span>
                </>
              ) : (
                <>
                  <Globe size={15} />
                  <span>
                    2. Publish Verified {distributionScope === 'PUBLIC' ? 'Global' : 'Community'} Broadcast
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Published Worldwide & Community Broadcasts Directory */}
      <section className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5EA] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1D1D1F]">
              AI-Approved Community & Global Broadcasts
            </h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Vetted journalistic dispatches and humanitarian documentaries published by registered contributors
            </p>
          </div>

          <div className="inline-flex bg-[#EFEFF4] p-1 rounded-xl text-xs font-semibold self-start">
            <button
              type="button"
              onClick={() => setFeedScopeTab('PUBLIC')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                feedScopeTab === 'PUBLIC'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Globe size={13} />
              <span>Global Public ({publicBroadcasts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedScopeTab('COMMUNITY_ONLY')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                feedScopeTab === 'COMMUNITY_ONLY'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Users size={13} />
              <span>
                My Community Desk ({communityBroadcasts.length})
              </span>
            </button>
          </div>
        </div>

        {feedScopeTab === 'COMMUNITY_ONLY' && !contributorProfile ? (
          <div className="py-10 text-center text-xs text-[#6E6E73]">
            Sign in and select your Community Desk above to view and share community-scoped broadcasts.
          </div>
        ) : activeFeedList.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#6E6E73]">
            No broadcasts published in this feed yet. Use the studio form above to audit and publish the first report.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeFeedList.map((docItem, idx) => {
              const isAuthor = currentUser?.uid === docItem.authorId;
              const mappedItem = mapPublishedDocToBroadcastItem(docItem, idx);
              return (
                <article
                  key={docItem.id}
                  className="p-5 rounded-2xl bg-[#F5F5F7]/70 border border-[#E5E5EA] hover:border-[#D2D2D7] transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="text-[11px] text-[#6E6E73] flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-[#1D1D1F]">{docItem.communityName}</span>
                      <span>·</span>
                      <span>{docItem.location}</span>
                      <span>·</span>
                      <span>{docItem.language}</span>
                      <span>·</span>
                      <span className="text-[#1F7A3F] font-mono tabular-nums">
                        AI Verified {docItem.complianceScore}%
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                      {docItem.title}
                    </h3>

                    <p className="text-xs text-[#6E6E73] line-clamp-2 leading-relaxed">
                      {docItem.description}
                    </p>

                    <div className="text-[11px] text-[#6E6E73]">
                      Correspondent: <span className="text-[#1D1D1F] font-medium">{docItem.authorName}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5E5EA] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onWatchBroadcast(mappedItem)}
                        className="px-3.5 py-1.5 bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Play size={12} className="fill-white" />
                        <span>Watch on Bengal TV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyShareLink(docItem.id)}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#EFEFF4] border border-[#D2D2D7] text-[#1D1D1F] text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                        title="Copy shareable broadcast link"
                      >
                        {copiedId === docItem.id ? (
                          <>
                            <Check size={12} className="text-[#1F7A3F]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 size={12} />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isAuthor && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateBroadcastDistributionScope(
                              docItem.id,
                              docItem.distributionScope === 'PUBLIC' ? 'COMMUNITY_ONLY' : 'PUBLIC'
                            )
                          }
                          className="px-2.5 py-1.5 bg-white hover:bg-[#EFEFF4] border border-[#D2D2D7] text-[11px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] rounded-lg cursor-pointer whitespace-nowrap"
                        >
                          Switch to {docItem.distributionScope === 'PUBLIC' ? 'Community' : 'Global'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePublishedBroadcast(docItem.id)}
                          className="p-1.5 text-[#6E6E73] hover:text-[#D70015] bg-white border border-[#D2D2D7] rounded-lg cursor-pointer"
                          title="Delete broadcast"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
