import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Server,
  CheckCircle2,
  Tv,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { BroadcastItem } from '../types/broadcast';
import { BENGAL_TV_OFFICIAL_LOGO } from '../data/iptvChannels';

interface UniversalVideoPlayerProps {
  channel: BroadcastItem;
  isMuted: boolean;
  isPlaying: boolean;
  timeshiftOffset: number;
  maxBufferSeconds: number;
  isTimeshiftAllowed: boolean;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onRewind: (seconds: number) => void;
  onForward: (seconds: number) => void;
  onJumpToLive: () => void;
  onSwitchChannel: (delta: number) => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
}

export type StreamCandidateType = 'youtube' | 'youtube-live' | 'hls' | 'direct' | 'canvas';

export interface StreamCandidate {
  label: string;
  url: string;
  type: StreamCandidateType;
  isLiveFeed?: boolean;
}

export default function UniversalVideoPlayer({
  channel,
  isMuted,
  isPlaying,
  timeshiftOffset: _timeshiftOffset,
  isTimeshiftAllowed: _isTimeshiftAllowed,
  onTogglePlayPause: _onTogglePlayPause,
  onToggleMute,
  onRewind,
  onForward,
  onJumpToLive,
  onSwitchChannel,
  onFullscreenToggle,
  isFullscreen,
}: UniversalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; time: number } | null>(null);
  const osdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sourceIndex, setSourceIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOsd, setShowOsd] = useState<boolean>(false);
  const [showSourceMenu, setShowSourceMenu] = useState<boolean>(false);
  const [bugPosition, setBugPosition] = useState<'bottom-right' | 'top-right'>('bottom-right');
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<'left' | 'right' | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Preload official Bengal TV broadcast logo for canvas fallback rendering
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = BENGAL_TV_OFFICIAL_LOGO;
    img.onload = () => {
      logoImageRef.current = img;
    };
  }, []);

  const getYouTubeId = useCallback((urlOrId?: string): string | null => {
    if (!urlOrId) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
    const match = urlOrId.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? match[1] : null;
  }, []);

  // Build accurate, channel-authentic stream candidates respecting streamType
  const streamCandidates = React.useMemo(() => {
    const list: StreamCandidate[] = [];
    const addUnique = (cand: StreamCandidate) => {
      if (!cand.url) return;
      if (!list.some((existing) => existing.url === cand.url && existing.type === cand.type)) {
        list.push(cand);
      }
    };

    const isDirectVideoFile =
      channel.videoUrl?.startsWith('/uploads/') ||
      /\.(mp4|webm|mov)(\?|$)/i.test(channel.videoUrl || '');

    // 1. Direct uploaded or MP4/WebM video (AI-approved user uploads)
    if (isDirectVideoFile || channel.streamType === 'direct' || channel.streamType === 'mp4') {
      if (channel.videoUrl && !channel.videoUrl.includes('.m3u8') && !getYouTubeId(channel.videoUrl)) {
        addUnique({
          label: 'Primary Feed · Verified Video',
          url: channel.videoUrl,
          type: 'direct',
          isLiveFeed: Boolean(channel.isLive),
        });
      }
    }

    // 2. If channel is configured primarily as HLS, prioritize its genuine HLS stream first
    if (channel.streamType === 'hls') {
      if (channel.hlsUrl && channel.hlsUrl.startsWith('http')) {
        addUnique({
          label: `Feed ${list.length + 1} · Official HLS Live`,
          url: channel.hlsUrl,
          type: 'hls',
          isLiveFeed: true,
        });
      }
      if (channel.videoUrl && channel.videoUrl.includes('.m3u8')) {
        addUnique({
          label: `Feed ${list.length + 1} · Primary HLS`,
          url: channel.videoUrl,
          type: 'hls',
          isLiveFeed: true,
        });
      }
      if (channel.backupStreams && channel.backupStreams.length > 0) {
        channel.backupStreams.forEach((bUrl, idx) => {
          if (bUrl.startsWith('http')) {
            addUnique({
              label: `Feed ${list.length + 1} · Backup HLS ${idx + 1}`,
              url: bUrl,
              type: bUrl.includes('.m3u8') ? 'hls' : 'direct',
              isLiveFeed: true,
            });
          }
        });
      }
    }

    // 3. Official YouTube Live Channel Stream & Verified YouTube Video IDs for this specific channel
    const primaryYt = getYouTubeId(channel.youtubeId) || getYouTubeId(channel.videoUrl);
    if (
      channel.youtubeChannelId &&
      channel.youtubeChannelId.startsWith('UC') &&
      (channel.category === 'LIVE_NEWS' || channel.category === 'NEWS') &&
      channel.streamType === 'youtube'
    ) {
      addUnique({
        label: `Feed ${list.length + 1} · Official 24/7 Live Desk`,
        url: channel.youtubeChannelId,
        type: 'youtube-live',
        isLiveFeed: true,
      });
    }

    if (primaryYt) {
      addUnique({
        label: `Feed ${list.length + 1} · Verified Broadcast`,
        url: primaryYt,
        type: 'youtube',
        isLiveFeed: channel.isLive ?? false,
      });
    }

    if (
      channel.youtubeChannelId &&
      channel.youtubeChannelId.startsWith('UC') &&
      !list.some((c) => c.type === 'youtube-live')
    ) {
      addUnique({
        label: `Feed ${list.length + 1} · Network Live Channel`,
        url: channel.youtubeChannelId,
        type: 'youtube-live',
        isLiveFeed: true,
      });
    }

    if (channel.backupYoutubeIds && channel.backupYoutubeIds.length > 0) {
      channel.backupYoutubeIds.forEach((id, idx) => {
        const cleanId = getYouTubeId(id);
        if (cleanId) {
          addUnique({
            label: `Feed ${list.length + 1} · Alternate Dispatch ${idx + 1}`,
            url: cleanId,
            type: 'youtube',
          });
        }
      });
    }

    // 4. Secondary HLS / Backup streams if not already added
    if (channel.hlsUrl && channel.hlsUrl.startsWith('http')) {
      addUnique({
        label: `Feed ${list.length + 1} · HLS Stream`,
        url: channel.hlsUrl,
        type: 'hls',
        isLiveFeed: true,
      });
    }
    if (channel.videoUrl && channel.videoUrl.startsWith('http') && channel.videoUrl.includes('.m3u8')) {
      addUnique({
        label: `Feed ${list.length + 1} · Direct M3U8`,
        url: channel.videoUrl,
        type: 'hls',
        isLiveFeed: true,
      });
    }
    if (channel.backupStreams && channel.backupStreams.length > 0) {
      channel.backupStreams.forEach((bUrl, idx) => {
        if (bUrl.startsWith('http')) {
          addUnique({
            label: `Feed ${list.length + 1} · Mirror Stream ${idx + 1}`,
            url: bUrl,
            type: bUrl.includes('.m3u8') ? 'hls' : 'direct',
          });
        }
      });
    }

    // 5. Studio Standby Canvas if all external networks are unreachable
    if (list.length === 0) {
      list.push({
        label: 'Bengal TV Studio Standby Carrier',
        url: 'canvas-simulator',
        type: 'canvas',
      });
    }

    return list;
  }, [channel, getYouTubeId]);

  const currentCandidate: StreamCandidate = streamCandidates[sourceIndex] || streamCandidates[0];

  useEffect(() => {
    setSourceIndex(0);
    setIsLoading(true);
    setShowSourceMenu(false);
  }, [channel.id, channel.videoUrl]);

  const handleNextCandidate = useCallback(() => {
    if (streamCandidates.length <= 1) {
      setIsLoading(false);
      return;
    }
    setSourceIndex((prev) => (prev + 1) % streamCandidates.length);
    setIsLoading(true);
  }, [streamCandidates.length]);

  const triggerOsd = useCallback(() => {
    setShowOsd(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setShowOsd(false);
    }, 2800);
  }, []);

  useEffect(() => {
    triggerOsd();
    return () => {
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    };
  }, [channel.id, triggerOsd]);

  const handleRealtimeRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
    setSyncFeedback('Live broadcast stream synchronized');
    setTimeout(() => setSyncFeedback(null), 2000);
    onJumpToLive();
  };

  // Automatic YouTube error failover
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (
          data &&
          (data.event === 'onError' ||
            (typeof data.info === 'number' && [2, 5, 100, 101, 150].includes(data.info)))
        ) {
          handleNextCandidate();
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleNextCandidate]);

  // Watchdog spinner timeout
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [isLoading, sourceIndex, refreshKey]);

  // Sync Mute/Volume to YouTube iframe
  useEffect(() => {
    const isYt = currentCandidate.type === 'youtube' || currentCandidate.type === 'youtube-live';
    if (isYt && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: isMuted ? 'mute' : 'unMute',
            args: [],
          }),
          '*'
        );
        if (!isMuted) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'setVolume',
              args: [100],
            }),
            '*'
          );
        }
      } catch {}
    }
  }, [isMuted, currentCandidate, refreshKey]);

  // Sync Play/Pause to YouTube & HTML5 video
  useEffect(() => {
    const isYt = currentCandidate.type === 'youtube' || currentCandidate.type === 'youtube-live';
    if (isYt && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: isPlaying ? 'playVideo' : 'pauseVideo',
            args: [],
          }),
          '*'
        );
      } catch {}
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentCandidate]);

  // HLS.js & Native HTML5 Video Engine
  useEffect(() => {
    const video = videoRef.current;
    if (!video || (currentCandidate.type !== 'hls' && currentCandidate.type !== 'direct')) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);

    if (currentCandidate.type === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(currentCandidate.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (isPlaying) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          handleNextCandidate();
        }
      });
    } else {
      video.src = currentCandidate.url;
      video.onloadeddata = () => {
        setIsLoading(false);
        if (isPlaying) {
          video.play().catch(() => {});
        }
      };
      video.onerror = () => {
        handleNextCandidate();
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentCandidate, handleNextCandidate, refreshKey]);

  // Studio Standby Canvas Fallback (Draws official Bengal TV emblem)
  useEffect(() => {
    if (currentCandidate.type !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#F5F5F7');
      bg.addColorStop(1, '#E5E5EA');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2 - 36);
      for (let i = 0; i < 3; i++) {
        const radius = (frame * 1.1 + i * 65) % 200;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 102, 204, ${Math.max(0, 0.25 - radius / 200)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      if (logoImageRef.current) {
        ctx.drawImage(logoImageRef.current, w / 2 - 64, h / 2 - 110, 128, 128);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(40, h - 104, w - 80, 68);
      ctx.strokeStyle = '#D2D2D7';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, h - 104, w - 80, 68);

      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#1D1D1F';
      ctx.fillText(channel.title, 60, h - 68);

      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#6E6E73';
      ctx.fillText(`BENGAL TV BROADCAST DESK · ${channel.categoryLabel || 'LIVE'}`, 60, h - 46);

      animId = requestAnimationFrame(render);
    };

    render();
    setIsLoading(false);
    return () => cancelAnimationFrame(animId);
  }, [currentCandidate.type, channel]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }
    triggerOsd();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 50 && deltaTime < 400) {
      onSwitchChannel(deltaX > 0 ? -1 : 1);
      touchStartRef.current = null;
      return;
    }

    const now = Date.now();
    const tapX = touch.clientX;
    const screenWidth = window.innerWidth;

    if (
      lastTapRef.current &&
      now - lastTapRef.current.time < 320 &&
      Math.abs(tapX - lastTapRef.current.x) < 50
    ) {
      if (tapX < screenWidth / 2) {
        onRewind(10);
        setDoubleTapFeedback('left');
        setTimeout(() => setDoubleTapFeedback(null), 800);
      } else {
        onForward(10);
        setDoubleTapFeedback('right');
        setTimeout(() => setDoubleTapFeedback(null), 800);
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { x: tapX, time: now };
    }

    touchStartRef.current = null;
  };

  const getExternalLink = () => {
    if (currentCandidate.type === 'youtube-live') {
      return `https://www.youtube.com/channel/${currentCandidate.url}/live`;
    }
    if (currentCandidate.type === 'youtube') {
      return `https://www.youtube.com/watch?v=${currentCandidate.url}`;
    }
    return currentCandidate.url;
  };

  const handlePlayerContainerClick = () => {
    triggerOsd();
    if (isMuted) {
      onToggleMute();
    }
  };

  return (
    <div
      className="relative w-full h-full bg-[#0A0A0C] flex items-center justify-center overflow-hidden select-none cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={triggerOsd}
      onClick={handlePlayerContainerClick}
    >
      {/* 1. YouTube Live 24/7 Engine */}
      {currentCandidate.type === 'youtube-live' && (
        <iframe
          ref={iframeRef}
          key={`ytlive-${channel.id}-${currentCandidate.url}-${refreshKey}`}
          src={`https://www.youtube.com/embed/live_stream?channel=${currentCandidate.url}&autoplay=1&mute=${isMuted ? 1 : 0}&enablejsapi=1&playsinline=1&rel=0&modestbranding=1`}
          title={channel.title}
          className="w-full h-full border-0 pointer-events-auto"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      )}

      {/* 2. YouTube Video Engine */}
      {currentCandidate.type === 'youtube' && (
        <iframe
          ref={iframeRef}
          key={`yt-${channel.id}-${currentCandidate.url}-${refreshKey}`}
          src={`https://www.youtube.com/embed/${currentCandidate.url}?autoplay=1&mute=${isMuted ? 1 : 0}&enablejsapi=1&playsinline=1&rel=0&loop=1&playlist=${currentCandidate.url}&modestbranding=1`}
          title={channel.title}
          className="w-full h-full border-0 pointer-events-auto"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      )}

      {/* 3. HTML5 Video Player Engine (HLS / Direct Uploaded Video) */}
      {(currentCandidate.type === 'hls' || currentCandidate.type === 'direct') && (
        <video
          ref={videoRef}
          key={`video-${channel.id}-${currentCandidate.url}-${refreshKey}`}
          playsInline
          autoPlay
          muted={isMuted}
          controls={currentCandidate.type === 'direct'}
          loop
          className="w-full h-full object-contain"
        />
      )}

      {/* 4. Studio Canvas Engine */}
      {currentCandidate.type === 'canvas' && (
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain"
        />
      )}

      {/* 5. PERMANENT ON-AIR OFFICIAL BENGAL TV STATION BUG (Published on Cloudflare Broadcast) */}
      <div
        aria-label="Bengal TV Official Broadcast Watermark"
        className={`pointer-events-none absolute z-20 flex items-center gap-2 bg-white/92 backdrop-blur-md border border-black/10 rounded-xl px-2.5 py-1.5 shadow-md transition-all duration-300 ${
          bugPosition === 'bottom-right' ? 'bottom-3.5 right-3.5' : 'top-14 right-3.5'
        }`}
      >
        <img
          src={BENGAL_TV_OFFICIAL_LOGO}
          alt="বেঙ্গল টিভি"
          referrerPolicy="no-referrer"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-contain bg-white shrink-0"
        />
        <div className="leading-tight pr-0.5">
          <div className="text-[11px] font-extrabold tracking-tight text-[#1D1D1F] whitespace-nowrap">
            বেঙ্গল টিভি
          </div>
          <div className="text-[9px] font-semibold tracking-wider uppercase text-[#6E6E73] whitespace-nowrap">
            BENGAL TV
          </div>
        </div>
      </div>

      {/* 6. Sync Toast */}
      {syncFeedback && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-white/95 border border-[#E5E5EA] text-[#1D1D1F] px-4 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 pointer-events-none">
          <CheckCircle2 size={14} className="text-[#1F7A3F]" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* 7. Double Tap Feedback */}
      {doubleTapFeedback === 'left' && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-40 bg-white/90 text-[#1D1D1F] px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-md pointer-events-none">
          <RotateCcw size={18} />
          <span className="font-bold font-mono text-xs tabular-nums">-10s</span>
        </div>
      )}
      {doubleTapFeedback === 'right' && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-40 bg-white/90 text-[#1D1D1F] px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-md pointer-events-none">
          <RotateCw size={18} />
          <span className="font-bold font-mono text-xs tabular-nums">+10s</span>
        </div>
      )}

      {/* 8. Minimal Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/45 backdrop-blur-xs pointer-events-none">
          <div className="w-9 h-9 border-2 border-white/80 border-t-transparent rounded-full animate-spin mb-2.5" />
          <span className="text-xs font-medium text-white/95 px-4 text-center">
            Connecting {channel.title}...
          </span>
        </div>
      )}

      {/* 9. Top Studio OSD Controls */}
      <div
        className={`absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-auto transition-opacity duration-300 ${
          showOsd ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/92 backdrop-blur-md border border-black/10 rounded-lg shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#D70015] animate-live-pulse" />
            <span className="text-[11px] font-bold tracking-wide text-[#1D1D1F]">
              {channel.isLive === false ? 'VERIFIED' : 'LIVE'}
            </span>
            <span className="text-[#86868B]">·</span>
            <span className="text-[11px] text-[#6E6E73] font-mono tabular-nums font-semibold">
              CH {channel.channelNumber || '100'}
            </span>
          </div>

          {streamCandidates.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="px-2.5 py-1 bg-white/92 hover:bg-white backdrop-blur-md border border-black/10 rounded-lg text-[11px] font-medium text-[#1D1D1F] flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
              >
                <Server size={12} className="text-[#0066CC] shrink-0" />
                <span className="truncate max-w-[160px]">{currentCandidate.label}</span>
              </button>

              {showSourceMenu && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white/98 border border-[#E5E5EA] rounded-xl shadow-xl p-1.5 z-50 text-xs backdrop-blur-xl">
                  {streamCandidates.map((src, idx) => (
                    <button
                      key={`cand-${idx}`}
                      type="button"
                      onClick={() => {
                        setSourceIndex(idx);
                        setShowSourceMenu(false);
                        setIsLoading(true);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        sourceIndex === idx
                          ? 'bg-[#0066CC]/10 text-[#0066CC] font-semibold'
                          : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Tv
                          size={12}
                          className={sourceIndex === idx ? 'text-[#0066CC]' : 'text-[#6E6E73]'}
                        />
                        <span className="truncate">{src.label}</span>
                      </div>
                      {sourceIndex === idx && (
                        <CheckCircle2 size={13} className="text-[#0066CC] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleRealtimeRefresh}
            className="px-2.5 py-1 bg-white/92 hover:bg-white text-[#1D1D1F] rounded-lg border border-black/10 text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-sm whitespace-nowrap"
            title="Sync Live Edge"
          >
            <RefreshCw
              size={11}
              className={isLoading ? 'animate-spin text-[#0066CC]' : 'text-[#1F7A3F]'}
            />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setBugPosition((prev) => (prev === 'bottom-right' ? 'top-right' : 'bottom-right'))
            }
            className="hidden md:flex px-2.5 py-1 bg-white/92 hover:bg-white text-[#6E6E73] hover:text-[#1D1D1F] rounded-lg border border-black/10 text-[11px] font-medium items-center gap-1 cursor-pointer shadow-sm whitespace-nowrap"
            title="Move Station Logo Position"
          >
            <span>Logo Pos</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {currentCandidate.url.startsWith('http') || currentCandidate.type.startsWith('youtube') ? (
            <a
              href={getExternalLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-white/92 hover:bg-white text-[#1D1D1F] rounded-lg border border-black/10 cursor-pointer shadow-sm hidden sm:flex items-center"
              title="Open Source Stream"
            >
              <ExternalLink size={13} />
            </a>
          ) : null}

          <button
            type="button"
            onClick={onToggleMute}
            className="p-1.5 bg-white/92 hover:bg-white text-[#1D1D1F] rounded-lg border border-black/10 cursor-pointer shadow-sm"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <VolumeX size={15} className="text-[#D70015]" />
            ) : (
              <Volume2 size={15} className="text-[#1F7A3F]" />
            )}
          </button>

          <button
            type="button"
            onClick={onFullscreenToggle}
            className="p-1.5 bg-white/92 hover:bg-white text-[#1D1D1F] rounded-lg border border-black/10 cursor-pointer shadow-sm"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
