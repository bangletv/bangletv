import { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { Tv, Layers, Upload, Scale, UserCheck, Cloud } from 'lucide-react';

import { BroadcastItem } from './types/broadcast';
import {
  PRELOADED_IPTV_CHANNELS,
  BENGAL_TV_OFFICIAL_LOGO,
} from './data/iptvChannels';
import {
  subscribeAuthState,
  getContributorProfile,
  subscribePublicBroadcasts,
  subscribeCommunityBroadcasts,
  type ContributorProfile,
  type PublishedBroadcastDoc,
} from './firebase';
import TvViewerConsole from './components/TvViewerConsole';
import EpgGrid from './components/EpgGrid';
import M3uXmltvManager from './components/M3uXmltvManager';
import ConstitutionViewer from './components/ConstitutionViewer';
import TurbiflyDomainHub from './components/TurbiflyDomainHub';
import CommunityBroadcastStudio, {
  mapPublishedDocToBroadcastItem,
} from './components/CommunityBroadcastStudio';

type NavigationTab = 'tv' | 'studio' | 'charter';

const STORAGE_KEY_CHANNELS = 'bengaltv_editorial_channels_v5';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('tv');

  // Core + user-imported M3U channels (clean storage key free of legacy entertainment/foreign overrides)
  const [baseChannels, setBaseChannels] = useState<BroadcastItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHANNELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(
            (c: any) =>
              c &&
              typeof c === 'object' &&
              typeof c.id === 'string' &&
              typeof c.videoUrl === 'string'
          );
          if (valid.length > 0) {
            // Ensure flagship Bengal TV logo stays synced with current production asset
            return valid.map((ch: BroadcastItem) =>
              ch.id === 'ch-bengal-tv-flagship'
                ? { ...ch, logoUrl: BENGAL_TV_OFFICIAL_LOGO }
                : ch
            );
          }
        }
      }
    } catch {}
    return PRELOADED_IPTV_CHANNELS;
  });

  // Firebase Auth & Contributor Profile state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contributorProfile, setContributorProfile] = useState<ContributorProfile | null>(null);
  const [publicBroadcasts, setPublicBroadcasts] = useState<PublishedBroadcastDoc[]>([]);
  const [communityBroadcasts, setCommunityBroadcasts] = useState<PublishedBroadcastDoc[]>([]);

  useEffect(() => {
    const unsubAuth = subscribeAuthState(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getContributorProfile(user.uid);
          setContributorProfile(profile);
        } catch {
          setContributorProfile(null);
        }
      } else {
        setContributorProfile(null);
        setCommunityBroadcasts([]);
      }
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to AI-vetted Global Public Broadcasts
  useEffect(() => {
    const unsubPublic = subscribePublicBroadcasts((items) => {
      setPublicBroadcasts(items);
    });
    return () => unsubPublic();
  }, []);

  // Subscribe to AI-vetted Community-Scoped Broadcasts for signed-in contributor's desk
  useEffect(() => {
    if (!currentUser || !contributorProfile?.communityId) {
      setCommunityBroadcasts([]);
      return;
    }
    const unsubComm = subscribeCommunityBroadcasts(
      contributorProfile.communityId,
      (items) => {
        setCommunityBroadcasts(items);
      }
    );
    return () => unsubComm();
  }, [currentUser, contributorProfile?.communityId]);

  // Merge AI-approved global & community uploads seamlessly into playable channel lineup
  const channels = useMemo<BroadcastItem[]>(() => {
    const uploadedDocsMap = new Map<string, PublishedBroadcastDoc>();
    publicBroadcasts.forEach((doc) => uploadedDocsMap.set(doc.id, doc));
    communityBroadcasts.forEach((doc) => uploadedDocsMap.set(doc.id, doc));

    const uploadedItems = Array.from(uploadedDocsMap.values()).map((doc, idx) =>
      mapPublishedDocToBroadcastItem(doc, idx + 1)
    );

    if (uploadedItems.length === 0) return baseChannels;
    return [baseChannels[0], ...uploadedItems, ...baseChannels.slice(1)];
  }, [baseChannels, publicBroadcasts, communityBroadcasts]);

  const [activeChannel, setActiveChannel] = useState<BroadcastItem>(
    () => PRELOADED_IPTV_CHANNELS[0]
  );

  // Support deep-link sharing (?watch=<broadcastId>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const watchId = params.get('watch');
    if (!watchId) return;
    const target = channels.find((c) => c.id === watchId);
    if (target && activeChannel.id !== target.id) {
      setActiveChannel(target);
      setActiveTab('tv');
    }
  }, [channels, activeChannel.id]);

  // Keep active channel stream metadata synchronized
  useEffect(() => {
    const fresh = channels.find((c) => c && c.id === activeChannel.id);
    if (
      fresh &&
      (fresh.youtubeId !== activeChannel.youtubeId ||
        fresh.youtubeChannelId !== activeChannel.youtubeChannelId ||
        fresh.videoUrl !== activeChannel.videoUrl ||
        fresh.hlsUrl !== activeChannel.hlsUrl)
    ) {
      setActiveChannel(fresh);
    }
  }, [channels, activeChannel]);

  const [isEpgModalOpen, setIsEpgModalOpen] = useState<boolean>(false);
  const [isM3uModalOpen, setIsM3uModalOpen] = useState<boolean>(false);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState<boolean>(false);

  const handleImportNewChannels = (
    newChannels: BroadcastItem[],
    replace: boolean = false
  ) => {
    if (replace) {
      setBaseChannels(newChannels);
      if (newChannels.length > 0) {
        setActiveChannel(newChannels[0]);
      }
      try {
        localStorage.setItem(
          STORAGE_KEY_CHANNELS,
          JSON.stringify(newChannels.slice(0, 600))
        );
      } catch {}
      return;
    }

    setBaseChannels((prev) => {
      const existingUrls = new Set(prev.map((c) => c?.videoUrl).filter(Boolean));
      const freshUnique = newChannels.filter(
        (c) => c && c.videoUrl && !existingUrls.has(c.videoUrl)
      );
      const updated = [...prev, ...freshUnique];
      try {
        localStorage.setItem(
          STORAGE_KEY_CHANNELS,
          JSON.stringify(updated.slice(0, 600))
        );
      } catch {}
      return updated;
    });
    if (newChannels.length > 0) {
      setActiveChannel(newChannels[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans text-[#1D1D1F] overflow-x-hidden selection:bg-[#0066CC]/15 selection:text-[#0066CC]">
      {/* ============================================================== */}
      {/* 1. STRICT 3-ZONE APPLE EDITORIAL TOP BAR                       */}
      {/* ============================================================== */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#E5E5EA] sticky top-0 z-40 px-4 sm:px-8 h-[60px] flex items-center justify-between gap-6">
        {/* Zone 1: Official Bengal TV Brand Lockup */}
        <button
          type="button"
          onClick={() => setActiveTab('tv')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 whitespace-nowrap text-left"
        >
          <img
            src={BENGAL_TV_OFFICIAL_LOGO}
            alt="Bengal TV Official Logo"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-xl object-contain bg-white border border-[#E5E5EA] p-0.5 shrink-0"
          />
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#1D1D1F] whitespace-nowrap">
            Bengal TV
          </span>
          <span className="hidden sm:inline text-[#D2D2D7]">·</span>
          <span className="hidden sm:inline text-xs font-semibold text-[#6E6E73] whitespace-nowrap">
            বেঙ্গল টিভি
          </span>
        </button>

        {/* Zone 2: Concise Single-Line Desktop Navigation (5 items) */}
        <nav
          aria-label="Primary Broadcast Navigation"
          className="hidden lg:flex items-center gap-7 text-xs font-semibold whitespace-nowrap"
        >
          <button
            type="button"
            onClick={() => setActiveTab('tv')}
            className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'tv'
                ? 'text-[#0066CC] font-bold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Live Broadcast
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'studio'
                ? 'text-[#0066CC] font-bold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Upload & Studio
          </button>

          <button
            type="button"
            onClick={() => setIsEpgModalOpen(true)}
            className="py-1 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Program Guide
          </button>

          <button
            type="button"
            onClick={() => setIsM3uModalOpen(true)}
            className="py-1 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            M3U Directory
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('charter')}
            className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'charter'
                ? 'text-[#0066CC] font-bold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Charter & Standards
          </button>
        </nav>

        {/* Zone 3: Account & Cloudflare Broadcast Hub Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCloudflareModalOpen(true)}
            className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E5EA] border border-[#E5E5EA] text-[#1D1D1F] font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            title="Cloudflare Broadcast Logo & Domain Status"
          >
            <Cloud size={14} className="text-[#0066CC]" />
            <span className="hidden md:inline">Cloudflare Ready</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className="px-3.5 py-1.5 bg-[#1D1D1F] hover:bg-[#333336] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <UserCheck size={14} />
            <span>
              {currentUser
                ? contributorProfile?.displayName?.split(' ')[0] || 'Studio'
                : 'Sign In / Upload'}
            </span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN WORKSPACE                                              */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'tv' && (
          <TvViewerConsole
            channels={channels}
            activeChannel={activeChannel}
            onSelectChannel={(ch) => setActiveChannel(ch)}
            onOpenEpgModal={() => setIsEpgModalOpen(true)}
            onOpenM3uModal={() => setIsM3uModalOpen(true)}
            onOpenUploadStudio={() => setActiveTab('studio')}
            onOpenGovernanceModal={() => setActiveTab('charter')}
          />
        )}

        {activeTab === 'studio' && (
          <CommunityBroadcastStudio
            currentUser={currentUser}
            contributorProfile={contributorProfile}
            onProfileUpdated={(p) => setContributorProfile(p)}
            publicBroadcasts={publicBroadcasts}
            communityBroadcasts={communityBroadcasts}
            onWatchBroadcast={(item) => {
              setActiveChannel(item);
              setActiveTab('tv');
            }}
          />
        )}

        {activeTab === 'charter' && <ConstitutionViewer />}
      </main>

      {/* ============================================================== */}
      {/* 3. CLEAN MOBILE BOTTOM BAR                                     */}
      {/* ============================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA] px-3 py-2 flex items-center justify-around sticky bottom-0 z-40"
      >
        <button
          type="button"
          onClick={() => setActiveTab('tv')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold cursor-pointer whitespace-nowrap ${
            activeTab === 'tv' ? 'text-[#0066CC]' : 'text-[#6E6E73]'
          }`}
        >
          <Tv size={18} />
          <span>Live TV</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold cursor-pointer whitespace-nowrap ${
            activeTab === 'studio' ? 'text-[#0066CC]' : 'text-[#6E6E73]'
          }`}
        >
          <Upload size={18} />
          <span>Upload</span>
        </button>

        <button
          type="button"
          onClick={() => setIsEpgModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold text-[#6E6E73] cursor-pointer whitespace-nowrap"
        >
          <Layers size={18} />
          <span>Guide</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('charter')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold cursor-pointer whitespace-nowrap ${
            activeTab === 'charter' ? 'text-[#0066CC]' : 'text-[#6E6E73]'
          }`}
        >
          <Scale size={18} />
          <span>Charter</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* 4. MODALS                                                      */}
      {/* ============================================================== */}
      {isEpgModalOpen && (
        <EpgGrid
          channels={channels}
          activeChannel={activeChannel}
          onSelectChannel={(ch) => setActiveChannel(ch)}
          onClose={() => setIsEpgModalOpen(false)}
        />
      )}

      {isM3uModalOpen && (
        <M3uXmltvManager
          onImportChannels={handleImportNewChannels}
          onClose={() => setIsM3uModalOpen(false)}
        />
      )}

      {isCloudflareModalOpen && (
        <TurbiflyDomainHub onClose={() => setIsCloudflareModalOpen(false)} />
      )}
    </div>
  );
}
