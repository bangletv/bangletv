import { useState, ChangeEvent } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Tv,
  X,
  Globe,
  Search,
  RefreshCw,
  Plus,
  Replace,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { BroadcastItem } from '../types/broadcast';
import { parseM3uContent, validateSafeUrl } from '../utils/m3uParser';
import { PRELOADED_IPTV_CHANNELS } from '../data/iptvChannels';

interface M3uXmltvManagerProps {
  onImportChannels: (newChannels: BroadcastItem[], replace?: boolean) => void;
  onClose: () => void;
}

interface CuratedPack {
  id: string;
  title: string;
  regionTag: string;
  desc: string;
  remoteUrl: string;
  sourceHint: string;
  recommendedLimit: number;
}

const CURATED_PACKS: CuratedPack[] = [
  {
    id: 'pack-iptv-org-ben',
    title: 'Bengali Language Channels (languages/ben.m3u)',
    regionTag: 'Bengali · Global Diaspora',
    desc: 'Official iptv-org Bengali-language news, civic, and regional public broadcasts across Bangladesh, West Bengal, UK, and North America.',
    remoteUrl: 'https://iptv-org.github.io/iptv/languages/ben.m3u',
    sourceHint: 'ben',
    recommendedLimit: 500,
  },
  {
    id: 'pack-iptv-org-bd',
    title: 'Bangladesh National Feeds (countries/bd.m3u)',
    regionTag: 'Dhaka · Bangladesh',
    desc: 'Verified Bangladesh live television feeds mapped strictly to Bangladeshi broadcasters.',
    remoteUrl: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    sourceHint: 'bd',
    recommendedLimit: 500,
  },
  {
    id: 'pack-iptv-org-us',
    title: 'American News & Public Broadcasts (countries/us.m3u)',
    regionTag: 'United States',
    desc: 'American national & local newsrooms, public affairs, science, and documentary channels.',
    remoteUrl: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    sourceHint: 'us',
    recommendedLimit: 1200,
  },
  {
    id: 'pack-iptv-org-gb',
    title: 'UK & British Public Broadcasts (countries/gb.m3u)',
    regionTag: 'United Kingdom · Europe',
    desc: 'British news networks, parliamentary coverage, and international documentary feeds.',
    remoteUrl: 'https://iptv-org.github.io/iptv/countries/gb.m3u',
    sourceHint: 'eu',
    recommendedLimit: 800,
  },
  {
    id: 'pack-iptv-org-eu-de-fr',
    title: 'European Continental News (countries/de.m3u)',
    regionTag: 'European Union',
    desc: 'European public-service newsrooms, science reports, and cultural/humanitarian documentaries.',
    remoteUrl: 'https://iptv-org.github.io/iptv/countries/de.m3u',
    sourceHint: 'eu',
    recommendedLimit: 800,
  },
  {
    id: 'pack-iptv-org-news',
    title: 'Global Live Journalism Index (categories/news.m3u)',
    regionTag: 'Worldwide News Wire',
    desc: 'Over 900 international 24/7 live journalism and breaking news channels from iptv-org.',
    remoteUrl: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    sourceHint: 'news',
    recommendedLimit: 1500,
  },
  {
    id: 'pack-iptv-org-doc',
    title: 'Humanitarian, Science & Mankind Docs (categories/documentary.m3u)',
    regionTag: 'Global Documentaries',
    desc: 'Dedicated documentary streams covering human resilience, earth science, history, and global society.',
    remoteUrl: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    sourceHint: 'doc',
    recommendedLimit: 1000,
  },
  {
    id: 'pack-iptv-org-edu',
    title: 'Education & Public Knowledge (categories/education.m3u)',
    regionTag: 'Academic & Civic',
    desc: 'University lectures, literacy broadcasts, and scientific research television streams.',
    remoteUrl: 'https://iptv-org.github.io/iptv/categories/education.m3u',
    sourceHint: 'edu',
    recommendedLimit: 800,
  },
  {
    id: 'pack-free-tv-master',
    title: 'Free-TV International Master Playlist (playlist.m3u8)',
    regionTag: 'Americas · Europe · Asia',
    desc: 'Curated Free-TV open-source playlist automatically filtered to news and documentary mandates.',
    remoteUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    sourceHint: 'global',
    recommendedLimit: 1500,
  },
];

export default function M3uXmltvManager({
  onImportChannels,
  onClose,
}: M3uXmltvManagerProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'url' | 'upload' | 'raw'>('presets');
  const [rawText, setRawText] = useState<string>('');
  const [playlistUrl, setPlaylistUrl] = useState<string>(
    'https://iptv-org.github.io/iptv/languages/ben.m3u'
  );
  const [channelLimit, setChannelLimit] = useState<number>(1500);
  const [strictJournalisticOnly, setStrictJournalisticOnly] = useState<boolean>(true);
  const [parsedChannels, setParsedChannels] = useState<BroadcastItem[]>([]);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);

  const fetchPlaylistContentWithFallback = async (url: string): Promise<string> => {
    try {
      const directRes = await fetch(url);
      if (directRes.ok) {
        return await directRes.text();
      }
    } catch {
      // Fall back to server-side M3U proxy if remote server lacks browser CORS headers
    }

    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    const proxyRes = await fetch(`${apiBase}/api/m3u-proxy?url=${encodeURIComponent(url)}`);
    if (!proxyRes.ok) {
      throw new Error(`HTTP ${proxyRes.status}: Unable to retrieve M3U playlist`);
    }
    return await proxyRes.text();
  };

  const fetchUrlInternal = async (
    url: string,
    packLabel: string,
    limit: number,
    sourceHint?: string
  ) => {
    const validation = validateSafeUrl(url);
    if (!validation.valid) {
      setErrors([`Invalid playlist URL: ${validation.reason}`]);
      return;
    }

    setIsLoading(true);
    setErrors([]);
    setDownloadProgress(`Fetching ${packLabel}...`);
    setStatusMessage(null);

    try {
      const content = await fetchPlaylistContentWithFallback(url);
      setDownloadProgress('Parsing streams & enforcing channel mapping...');
      const res = parseM3uContent(
        content,
        'comm-iptv-org',
        limit,
        strictJournalisticOnly,
        sourceHint
      );

      setParsedChannels(res.channels);
      setFilteredCount(res.filteredOutCount);
      setErrors(res.errors);
      setStatusMessage(
        `Prepared ${res.channels.length} verified channels from ${packLabel}${
          res.filteredOutCount > 0
            ? ` (${res.filteredOutCount} general-entertainment streams excluded by editorial filter)`
            : ''
        }.`
      );
    } catch (err: any) {
      setErrors([err?.message || 'Network error while fetching M3U playlist.']);
    } finally {
      setIsLoading(false);
      setDownloadProgress(null);
    }
  };

  const handleLoadPack = async (pack: CuratedPack) => {
    await fetchUrlInternal(
      pack.remoteUrl,
      pack.title,
      Math.min(channelLimit, pack.recommendedLimit || channelLimit),
      pack.sourceHint
    );
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrors([]);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseM3uContent(
        content,
        'comm-local-upload',
        channelLimit,
        strictJournalisticOnly
      );
      setParsedChannels(res.channels);
      setFilteredCount(res.filteredOutCount);
      setErrors(res.errors);
      setIsLoading(false);
      setStatusMessage(`Loaded ${res.channels.length} channels from ${file.name}.`);
    };
    reader.onerror = () => {
      setErrors(['Unable to read local M3U file.']);
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleFetchUrl = async () => {
    if (!playlistUrl.trim()) return;
    await fetchUrlInternal(playlistUrl.trim(), 'Custom M3U Stream Index', channelLimit);
  };

  const handleParseRaw = () => {
    if (!rawText.trim()) return;
    setIsLoading(true);
    const res = parseM3uContent(
      rawText,
      'comm-raw-paste',
      channelLimit,
      strictJournalisticOnly
    );
    setParsedChannels(res.channels);
    setFilteredCount(res.filteredOutCount);
    setErrors(res.errors);
    setIsLoading(false);
    setStatusMessage(`Parsed ${res.channels.length} channels from raw M3U text.`);
  };

  const previewChannels = parsedChannels.filter((c) => {
    if (!previewSearch.trim()) return true;
    const q = previewSearch.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ingest-title"
      className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md flex flex-col p-3 sm:p-6"
    >
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-2xl text-[#1D1D1F]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5E5EA] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center text-[#0066CC] shrink-0">
              <Globe size={20} />
            </div>
            <div>
              <h2 id="ingest-title" className="text-base sm:text-lg font-bold text-[#1D1D1F]">
                M3U Playlist & Regional IPTV Directory
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Integrate live Bengali, American, European, and Global Documentary playlists with strict channel-to-stream accuracy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onImportChannels(PRELOADED_IPTV_CHANNELS, true);
                onClose();
              }}
              className="hidden sm:flex px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E5EA] border border-[#E5E5EA] rounded-xl text-xs font-semibold text-[#1D1D1F] items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Restore default verified Bengal TV, US, EU & Documentary lineup"
            >
              <RotateCcw size={13} />
              <span>Restore Core Lineup</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Segmented Navigation & Editorial Filter Controls */}
        <div className="px-4 sm:px-6 py-3 bg-[#F5F5F7] border-b border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="inline-flex bg-[#EFEFF4] p-1 rounded-xl flex-wrap">
            {(
              [
                { id: 'presets', label: 'Regional IPTV Packs' },
                { id: 'url', label: 'M3U URL' },
                { id: 'upload', label: 'Upload .m3u' },
                { id: 'raw', label: 'Paste M3U' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-white text-[#1D1D1F] shadow-2xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="inline-flex items-center gap-1.5 text-xs text-[#1D1D1F] font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={strictJournalisticOnly}
                onChange={(e) => setStrictJournalisticOnly(e.target.checked)}
                className="rounded accent-[#0066CC]"
              />
              <ShieldCheck size={14} className="text-[#1F7A3F]" />
              <span>News & Documentary Only</span>
            </label>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#6E6E73]">Max:</span>
              <select
                value={channelLimit}
                onChange={(e) => setChannelLimit(Number(e.target.value))}
                className="bg-white border border-[#D2D2D7] rounded-lg px-2 py-1 text-xs text-[#1D1D1F] font-mono tabular-nums focus:outline-none focus:border-[#0066CC]"
              >
                <option value={500}>500</option>
                <option value={1500}>1,500</option>
                <option value={3000}>3,000</option>
              </select>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="p-4 sm:p-6 border-b border-[#E5E5EA] bg-white">
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
              {CURATED_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="p-3.5 bg-[#F5F5F7]/70 border border-[#E5E5EA] hover:border-[#0066CC] rounded-2xl flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="text-[11px] font-medium text-[#0066CC] mb-1">
                      {pack.regionTag}
                    </div>
                    <h4 className="text-xs font-bold text-[#1D1D1F] mb-1 line-clamp-1">
                      {pack.title}
                    </h4>
                    <p className="text-[11px] text-[#6E6E73] leading-relaxed mb-3 line-clamp-2">
                      {pack.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadPack(pack)}
                    disabled={isLoading}
                    className="w-full py-2 bg-white hover:bg-[#0066CC] hover:text-white border border-[#D2D2D7] hover:border-[#0066CC] text-[#1D1D1F] font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Fetching...</span>
                      </>
                    ) : (
                      <span>Fetch Playlist →</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://iptv-org.github.io/iptv/languages/ben.m3u"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="flex-1 bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={isLoading || !playlistUrl.trim()}
                  className="px-5 py-2 bg-[#0066CC] hover:bg-[#0055B3] text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                  <span>Fetch M3U</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#6E6E73]">
                <span>Quick links:</span>
                {[
                  { label: 'Bengali (ben.m3u)', url: 'https://iptv-org.github.io/iptv/languages/ben.m3u' },
                  { label: 'USA (us.m3u)', url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
                  { label: 'UK (gb.m3u)', url: 'https://iptv-org.github.io/iptv/countries/gb.m3u' },
                  { label: 'News (news.m3u)', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
                  { label: 'Documentary (documentary.m3u)', url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPlaylistUrl(item.url)}
                    className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="border border-dashed border-[#D2D2D7] hover:border-[#0066CC] rounded-2xl p-8 text-center bg-[#F5F5F7]/60">
              <input
                type="file"
                accept=".m3u,.m3u8,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="m3u-file-input"
              />
              <label
                htmlFor="m3u-file-input"
                className="cursor-pointer flex flex-col items-center"
              >
                <FileText size={32} className="text-[#0066CC] mb-2" />
                <span className="text-sm font-semibold text-[#1D1D1F]">
                  Select an .m3u or .m3u8 playlist file
                </span>
                <span className="text-xs text-[#6E6E73] mt-1">
                  Standard #EXTM3U / #EXTINF streams parsed locally
                </span>
              </label>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3">
              <textarea
                rows={4}
                placeholder={`#EXTM3U\n#EXTINF:-1 tvg-country="BD" group-title="News",Bengal Dispatch HD\nhttps://example.org/live/stream.m3u8`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl p-3 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
              />
              <button
                type="button"
                onClick={handleParseRaw}
                disabled={isLoading || !rawText.trim()}
                className="px-4 py-2 bg-[#0066CC] hover:bg-[#0055B3] text-white font-semibold rounded-xl text-xs cursor-pointer disabled:opacity-50"
              >
                Parse M3U Text
              </button>
            </div>
          )}

          {downloadProgress && (
            <div className="mt-3 p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-xs text-[#0066CC] flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin shrink-0" />
              <span>{downloadProgress}</span>
            </div>
          )}

          {statusMessage && !downloadProgress && (
            <div className="mt-3 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#1F7A3F] flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-[#FFF2F2] border border-[#FFD6D9] text-xs text-[#D70015] space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Notice:</span>
              </div>
              {errors.slice(0, 3).map((err, i) => (
                <p key={i} className="text-[11px] font-mono pl-5">
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Preview & Import Commit Section */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#F5F5F7]/70">
          <div className="px-4 sm:px-6 py-2.5 border-b border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="text-xs font-semibold text-[#1D1D1F]">
              Parsed Channels Ready:{' '}
              <span className="font-mono tabular-nums text-[#0066CC]">
                {parsedChannels.length}
              </span>
              {filteredCount > 0 && (
                <span className="text-[#6E6E73] font-normal">
                  {' '}
                  · {filteredCount} off-mandate entertainment streams filtered
                </span>
              )}
            </div>

            {parsedChannels.length > 0 && (
              <div className="relative w-56">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86868B]"
                />
                <input
                  type="text"
                  placeholder="Filter preview..."
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg pl-8 pr-2.5 py-1 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC]"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {parsedChannels.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-[#86868B] text-xs gap-2">
                <Tv size={28} className="opacity-50" />
                <span>Select a regional IPTV pack above or enter an M3U playlist URL</span>
              </div>
            ) : (
              previewChannels.slice(0, 100).map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="p-2.5 px-3.5 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="font-mono tabular-nums text-[11px] text-[#86868B] w-7 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold text-[#1D1D1F] truncate">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-[#6E6E73]">
                        {c.location} · {c.categoryLabel}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono uppercase text-[#6E6E73] shrink-0">
                    {c.streamType}
                  </span>
                </div>
              ))
            )}
          </div>

          {parsedChannels.length > 0 && (
            <div className="p-4 sm:px-6 border-t border-[#E5E5EA] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#6E6E73]">
                <strong className="text-[#1D1D1F]">{parsedChannels.length}</strong> verified streams ready to add to Bengal TV.
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    onImportChannels(parsedChannels, true);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] border border-[#D2D2D7] text-[#1D1D1F] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Replace size={14} />
                  <span>Replace Lineup</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onImportChannels(parsedChannels, false);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-5 py-2 bg-[#0066CC] hover:bg-[#0055B3] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus size={15} />
                  <span>Append to Channels</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
