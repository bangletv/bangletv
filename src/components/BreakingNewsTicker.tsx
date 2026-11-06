import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Pause,
  Play,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Globe,
} from 'lucide-react';

export interface NewsHeadline {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: string;
  lang: 'bn' | 'en';
  isLiveApi?: boolean;
}

const STATIC_BREAKING_HEADLINES: NewsHeadline[] = [
  {
    id: 'static-bn-1',
    title: 'বৈশ্বিক নবায়নযোগ্য জ্বালানি ও জলবায়ু অভিযোজন তহবিলে নতুন আন্তর্জাতিক অঙ্গীকার',
    summary:
      'উপকূলীয় ও জলবায়ু-ঝুঁকিপূর্ণ জনপদের মানবিক সুরক্ষায় পরিচ্ছন্ন জ্বালানি ও সুপেয় পানি প্রকল্পে বৈশ্বিক বিনিয়োগ নতুন উচ্চতায় পৌঁছেছে।',
    source: 'Bengal TV Desk',
    category: 'জলবায়ু ও মানবিক',
    publishedAt: 'সদ্যপ্রাপ্ত',
    lang: 'bn',
  },
  {
    id: 'static-en-1',
    title: 'UN Humanitarian Agencies Expand Clean Water & Medical Corridors Across South Asia and East Africa',
    summary:
      'Field coordination teams report mobile solar desalination units and community health clinics reaching over 1.4 million displaced residents.',
    source: 'Humanitarian Wire',
    category: 'Global Relief',
    publishedAt: '8m ago',
    lang: 'en',
  },
  {
    id: 'static-bn-2',
    title: 'প্রবাসী বাংলা সংবাদ ডেস্ক ও আন্তর্জাতিক ফ্রি-টু-এয়ার চ্যানেলের সমন্বিত সম্প্রচার শুরু',
    summary:
      'ঢাকা, কলকাতা, লন্ডন ও নিউ ইয়র্কের বাংলা সংবাদ চ্যানেল এবং মানবিক প্রামাণ্যচিত্র এখন বেঙ্গল টিভির সমন্বিত নেটওয়ার্কে সরাসরি সম্প্রচারিত হচ্ছে।',
    source: 'Bengal TV Network',
    category: 'আন্তর্জাতিক সংবাদ',
    publishedAt: '১৪ মি. আগে',
    lang: 'bn',
  },
  {
    id: 'static-en-2',
    title: 'Next-Generation Cyclone & Monsoon Satellites Improve Early Warning Lead Times Across Bay of Bengal',
    summary:
      'High-resolution atmospheric telemetry now delivers 10-minute interval storm tracking to coastal emergency broadcasters and civic shelters.',
    source: 'Science & Climate Desk',
    category: 'Public Safety',
    publishedAt: '22m ago',
    lang: 'en',
  },
  {
    id: 'static-bn-3',
    title: 'গ্রামীণ ডিজিটাল শিক্ষা ও জনস্বাস্থ্য সচেতনতায় নতুন উন্মুক্ত প্রামাণ্যচিত্র সিরিজ প্রকাশ',
    summary:
      'প্রত্যন্ত অঞ্চলের শিক্ষার্থী ও স্বাস্থ্যকর্মীদের জন্য বিজ্ঞানভিত্তিক ও মানবিক প্রামাণ্যচিত্র সম্প্রচার জোরদার করা হয়েছে।',
    source: 'শিক্ষা ও মানবিক ডেস্ক',
    category: 'শিক্ষা ও সমাজ',
    publishedAt: '৩১ মি. আগে',
    lang: 'bn',
  },
];

const RSS_ENDPOINTS: Array<{
  url: string;
  source: string;
  category: string;
  lang: 'bn' | 'en';
}> = [
  {
    url: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/bengali/rss.xml',
    source: 'BBC বাংলা',
    category: 'বাংলাদেশ ও বিশ্ব',
    lang: 'bn',
  },
  {
    url: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/world/rss.xml',
    source: 'BBC World',
    category: 'World Dispatch',
    lang: 'en',
  },
];

function stripHtml(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function formatPubTime(pubDate?: string, lang: 'bn' | 'en' = 'bn'): string {
  if (!pubDate) return lang === 'bn' ? 'সদ্যপ্রাপ্ত' : 'Just now';
  try {
    const parsed = new Date(pubDate.replace(' ', 'T') + (pubDate.includes('Z') ? '' : 'Z'));
    if (Number.isNaN(parsed.getTime())) return pubDate.slice(0, 16);
    const diffMin = Math.max(1, Math.floor((Date.now() - parsed.getTime()) / 60000));
    if (diffMin < 60) {
      return lang === 'bn' ? `${diffMin} মি. আগে` : `${diffMin}m ago`;
    }
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) {
      return lang === 'bn' ? `${diffHr} ঘণ্টা আগে` : `${diffHr}h ago`;
    }
    return parsed.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return lang === 'bn' ? 'লাইভ আপডেট' : 'Live Update';
  }
}

export default function BreakingNewsTicker() {
  const [headlines, setHeadlines] = useState<NewsHeadline[]>(STATIC_BREAKING_HEADLINES);
  const [feedFilter, setFeedFilter] = useState<'all' | 'bn' | 'en'>('all');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [usingLiveFeed, setUsingLiveFeed] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<NewsHeadline | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [clockText, setClockText] = useState<string>(() => new Date().toTimeString().slice(0, 8));

  useEffect(() => {
    const interval = setInterval(() => {
      setClockText(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchBreakingNews = useCallback(async () => {
    setIsFetching(true);
    try {
      const responses = await Promise.allSettled(
        RSS_ENDPOINTS.map(async (endpoint) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6500);
          try {
            const res = await fetch(endpoint.url, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data?.status !== 'ok' || !Array.isArray(data.items)) {
              throw new Error('Invalid feed payload');
            }
            return data.items.slice(0, 8).map((item: any, idx: number): NewsHeadline => ({
              id: `live-${endpoint.lang}-${idx}-${(item.guid || item.title || idx)
                .toString()
                .slice(-10)}`,
              title: stripHtml(item.title || ''),
              summary:
                stripHtml(item.description || item.content || '') ||
                (endpoint.lang === 'bn'
                  ? 'বিস্তারিত সংবাদ সরাসরি আন্তর্জাতিক সংবাদ ডেস্ক থেকে সংগৃহীত।'
                  : 'Live wire dispatch fetched from international broadcast newsroom.'),
              source: endpoint.source,
              category: endpoint.category,
              publishedAt: formatPubTime(item.pubDate, endpoint.lang),
              lang: endpoint.lang,
              isLiveApi: true,
            }));
          } finally {
            clearTimeout(timer);
          }
        })
      );

      const liveItems: NewsHeadline[] = [];
      responses.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          liveItems.push(...result.value.filter((i) => i.title.length > 4));
        }
      });

      if (liveItems.length > 0) {
        const bnList = liveItems.filter((i) => i.lang === 'bn');
        const enList = liveItems.filter((i) => i.lang === 'en');
        const merged: NewsHeadline[] = [];
        const maxLen = Math.max(bnList.length, enList.length);
        for (let i = 0; i < maxLen; i++) {
          if (bnList[i]) merged.push(bnList[i]);
          if (enList[i]) merged.push(enList[i]);
        }
        setHeadlines(merged.length > 0 ? merged : liveItems);
        setUsingLiveFeed(true);
      } else {
        setHeadlines(STATIC_BREAKING_HEADLINES);
        setUsingLiveFeed(false);
      }
    } catch {
      setHeadlines(STATIC_BREAKING_HEADLINES);
      setUsingLiveFeed(false);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchBreakingNews();
    const refreshTimer = setInterval(fetchBreakingNews, 5 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, [fetchBreakingNews]);

  const visibleHeadlines = useMemo(() => {
    const filtered =
      feedFilter === 'all' ? headlines : headlines.filter((h) => h.lang === feedFilter);
    return filtered.length > 0 ? filtered : STATIC_BREAKING_HEADLINES;
  }, [headlines, feedFilter]);

  const handleStepHeadline = (delta: number) => {
    setIsPaused(true);
    setFocusedIndex((prev) => {
      const next = (prev + delta + visibleHeadlines.length) % visibleHeadlines.length;
      setSelectedItem(visibleHeadlines[next]);
      return next;
    });
  };

  return (
    <section
      aria-label="Breaking News Ticker"
      className="w-full bg-white border-y border-[#E5E5EA] text-[#1D1D1F] select-none"
    >
      <div className="flex items-stretch min-h-[40px] text-xs overflow-hidden">
        {/* Left Live Breaking Label */}
        <div className="bg-[#D70015] text-white px-3.5 sm:px-4 flex items-center gap-2 shrink-0 font-semibold tracking-tight">
          <span
            className="w-2 h-2 rounded-full bg-white animate-live-pulse shrink-0"
            aria-hidden="true"
          />
          <span className="whitespace-nowrap text-[11px] sm:text-xs font-bold">
            BREAKING
          </span>
          <span className="hidden md:inline text-white/75">·</span>
          <span className="hidden md:inline text-[10px] font-mono text-white/95 whitespace-nowrap">
            {usingLiveFeed ? 'LIVE WIRE' : 'NEWS DESK'}
          </span>
        </div>

        {/* Center Scrolling Track */}
        <div className="relative flex-1 overflow-hidden flex items-center bg-[#FAFAFC]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#FAFAFC] to-transparent z-10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#FAFAFC] to-transparent z-10"
          />

          <div
            className={`animate-ticker-seamless items-center py-1.5 ${
              isPaused || selectedItem ? 'is-paused' : ''
            }`}
          >
            {[0, 1].map((copyIdx) => (
              <div
                key={copyIdx}
                aria-hidden={copyIdx === 1 ? 'true' : undefined}
                className="flex items-center shrink-0"
              >
                {visibleHeadlines.map((item, idx) => (
                  <button
                    key={`${copyIdx}-${item.id}`}
                    type="button"
                    onClick={() => {
                      setFocusedIndex(idx);
                      setSelectedItem((curr) => (curr?.id === item.id ? null : item));
                    }}
                    className="group inline-flex items-center gap-2 px-5 py-1 text-left hover:text-[#0066CC] focus-visible:outline-none focus-visible:text-[#0066CC] transition-colors cursor-pointer whitespace-nowrap"
                    title="Click to read dispatch summary"
                  >
                    <span className="text-[11px] text-[#0066CC] font-semibold">
                      {item.source}
                    </span>
                    <span className="text-[#86868B]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs sm:text-[13px] font-medium text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[#86868B]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-[#6E6E73]">
                      {item.publishedAt}
                    </span>
                    <span className="ml-4 text-[#D2D2D7]" aria-hidden="true">
                      •
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Controls & Studio Clock */}
        <div className="bg-white border-l border-[#E5E5EA] px-2.5 sm:px-3 flex items-center gap-1.5 shrink-0">
          <div
            role="group"
            aria-label="News language filter"
            className="hidden sm:flex items-center bg-[#EFEFF4] rounded-lg p-0.5 text-[10px]"
          >
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'bn', label: 'বাংলা' },
                { id: 'en', label: 'EN' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFeedFilter(tab.id);
                  setSelectedItem(null);
                }}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  feedFilter === tab.id
                    ? 'bg-white text-[#1D1D1F] shadow-2xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleStepHeadline(-1)}
            className="p-1.5 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-md transition-colors cursor-pointer"
            aria-label="Previous headline"
          >
            <ChevronLeft size={14} />
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="p-1.5 text-[#6E6E73] hover:text-[#0066CC] hover:bg-[#F5F5F7] rounded-md transition-colors cursor-pointer"
            aria-label={isPaused ? 'Resume ticker' : 'Pause ticker'}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>

          <button
            type="button"
            onClick={() => handleStepHeadline(1)}
            className="p-1.5 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-md transition-colors cursor-pointer"
            aria-label="Next headline"
          >
            <ChevronRight size={14} />
          </button>

          <button
            type="button"
            onClick={fetchBreakingNews}
            disabled={isFetching}
            className="p-1.5 text-[#6E6E73] hover:text-[#0066CC] hover:bg-[#F5F5F7] rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Refresh breaking news"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin text-[#0066CC]' : ''} />
          </button>

          <div className="hidden lg:flex items-center gap-1.5 pl-2 ml-1 border-l border-[#E5E5EA] text-[11px] font-mono tabular-nums text-[#6E6E73] whitespace-nowrap">
            <Clock size={12} className="text-[#86868B] shrink-0" />
            <span>{clockText}</span>
          </div>
        </div>
      </div>

      {/* Expandable Inline Headline Summary */}
      {selectedItem && (
        <div className="bg-[#F5F5F7] border-t border-[#E5E5EA] px-4 sm:px-6 py-3.5 flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-[#6E6E73] flex-wrap">
              <span className="inline-flex items-center gap-1 text-[#0066CC] font-semibold">
                <Globe size={12} />
                <span>{selectedItem.source}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{selectedItem.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{selectedItem.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[#86868B]">
                {focusedIndex + 1}/{visibleHeadlines.length}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#1D1D1F] leading-snug">
              {selectedItem.title}
            </h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed max-w-4xl">
              {selectedItem.summary}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className="p-1.5 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#E5E5EA] rounded-lg transition-colors shrink-0 cursor-pointer"
            aria-label="Close headline summary"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </section>
  );
}
