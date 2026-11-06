import { useState } from 'react';
import { Layers, Search, Tv, X, Play } from 'lucide-react';
import { BroadcastItem } from '../types/broadcast';

interface EpgGridProps {
  channels: BroadcastItem[];
  activeChannel: BroadcastItem;
  onSelectChannel: (channel: BroadcastItem) => void;
  onClose: () => void;
}

const EPG_FILTER_TABS = [
  { id: 'ALL', label: 'All Broadcasts' },
  { id: 'LIVE_NEWS', label: 'Live News Desks' },
  { id: 'DOCUMENTARY', label: 'Humanitarian & Mankind Docs' },
  { id: 'SCIENCE', label: 'Science, Climate & Space' },
  { id: 'PUBLIC_SERVICE', label: 'Public Service & Civic' },
  { id: 'COMMUNITY', label: 'Diaspora & Community' },
];

export default function EpgGrid({
  channels,
  activeChannel,
  onSelectChannel,
  onClose,
}: EpgGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChannels = channels.filter((c) => {
    let matchesCategory = false;
    if (selectedCategory === 'ALL') {
      matchesCategory = true;
    } else if (selectedCategory === 'LIVE_NEWS') {
      matchesCategory = c.category === 'NEWS' || c.category === 'LIVE_NEWS';
    } else if (selectedCategory === 'DOCUMENTARY') {
      matchesCategory = c.category === 'DOCUMENTARY' || c.category === 'EDUCATION';
    } else {
      matchesCategory = c.category === selectedCategory;
    }
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      (c.location && c.location.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="epg-title"
      className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md flex flex-col p-3 sm:p-8"
    >
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-2xl text-[#1D1D1F]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5E5EA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center text-[#0066CC]">
              <Layers size={20} />
            </div>
            <div>
              <h2 id="epg-title" className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                Electronic Program Guide (EPG)
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                24-Hour Verified Broadcast Schedule · Journalistic News & Humanitarian Documentaries
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#E5E5EA] bg-[#F5F5F7] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-[#EFEFF4] p-1 rounded-xl text-xs">
            {EPG_FILTER_TABS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-white text-[#1D1D1F] shadow-2xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-64 shrink-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
            />
            <input
              type="text"
              placeholder="Search channel or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E5E5EA] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0066CC]"
            />
          </div>
        </div>

        {/* Schedule List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F5F5F7]/60">
          {filteredChannels.length === 0 ? (
            <div className="p-12 text-center text-[#6E6E73] text-xs">
              No channels match your selected program filter.
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isActive = channel.id === activeChannel.id;
              const schedule = channel.epgSchedule || [];

              return (
                <div
                  key={channel.id}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all ${
                    isActive
                      ? 'border-[#0066CC] ring-2 ring-[#0066CC]/15'
                      : 'border-[#E5E5EA] hover:border-[#D2D2D7]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E5EA] mb-3.5 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center shrink-0 overflow-hidden">
                        {channel.logoUrl ? (
                          <img
                            src={channel.logoUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain p-0.5"
                          />
                        ) : (
                          <Tv size={16} className="text-[#6E6E73]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#1D1D1F] truncate">
                            {channel.title}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-[#86868B]">
                            · CH {channel.channelNumber || '100'}
                          </span>
                          {isActive && (
                            <span className="text-[11px] font-semibold text-[#D70015]">
                              · On Screen
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6E6E73] truncate">
                          {channel.location} · {channel.categoryLabel}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectChannel(channel);
                        onClose();
                      }}
                      className="px-3.5 py-2 bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Play size={12} className="fill-white" />
                      <span>Tune In</span>
                    </button>
                  </div>

                  {schedule.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {schedule.map((prog, idx) => (
                        <div
                          key={prog.id || idx}
                          className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
                            prog.isCurrent
                              ? 'bg-[#0066CC]/[0.05] border-[#0066CC]/30'
                              : 'bg-[#F5F5F7]/70 border-[#E5E5EA]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums mb-1">
                              <span
                                className={
                                  prog.isCurrent
                                    ? 'text-[#0066CC] font-bold'
                                    : 'text-[#6E6E73]'
                                }
                              >
                                {prog.startTime} – {prog.endTime}
                              </span>
                              {prog.isCurrent && (
                                <span className="text-[#D70015] font-bold text-[10px]">
                                  ON AIR
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-xs text-[#1D1D1F] leading-snug line-clamp-2">
                              {prog.title}
                            </h4>
                            <p className="text-[11px] text-[#6E6E73] line-clamp-2 mt-1">
                              {prog.description}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-[#E5E5EA] flex items-center justify-between text-[10px] text-[#86868B] font-mono tabular-nums">
                            <span>{prog.durationMinutes} min</span>
                            <span>Rated {prog.rating || 'ALL'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-[#6E6E73]">
                      Continuous 24/7 live dispatch stream · {channel.description}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
