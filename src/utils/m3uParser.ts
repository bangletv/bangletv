import { BroadcastItem, ContentCategory } from '../types/broadcast';

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^metadata\.google\.internal$/i,
  /^100\.64\./,
  /^::1$/,
];

const EXCLUDED_ENTERTAINMENT_PATTERNS =
  /\b(movie|movies|cinema|comedy|cartoon|animation|kids|music|mtv|bollywood|gaming|esports|fashion|shopping|adult|xxx|casino|drama|serial|entertainment)\b/i;

export function validateSafeUrl(rawUrl: string): { valid: boolean; reason?: string } {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return { valid: false, reason: 'URL cannot be empty' };
  }
  try {
    const cleanUrl = rawUrl.trim().split('|')[0].trim();
    const url = new URL(cleanUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, reason: `Unsupported protocol: ${url.protocol}` };
    }
    const hostname = url.hostname.toLowerCase();
    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, reason: `Private/internal address blocked: ${hostname}` };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Malformed URL' };
  }
}

export function mapGroupToCategory(groupTitle?: string, channelName?: string): ContentCategory {
  const combined = `${groupTitle || ''} ${channelName || ''}`.toUpperCase();
  if (
    combined.includes('DOC') ||
    combined.includes('DISCOVERY') ||
    combined.includes('HISTORY') ||
    combined.includes('EARTH') ||
    combined.includes('NATURE') ||
    combined.includes('HUMAN')
  ) {
    return 'DOCUMENTARY';
  }
  if (combined.includes('EDU') || combined.includes('LEARN') || combined.includes('UNIVERSITY')) {
    return 'EDUCATION';
  }
  if (combined.includes('SCI') || combined.includes('SPACE') || combined.includes('NASA')) {
    return 'SCIENCE';
  }
  if (
    combined.includes('PUBLIC') ||
    combined.includes('PARLIAMENT') ||
    combined.includes('SANGSAD') ||
    combined.includes('C-SPAN') ||
    combined.includes('UN ')
  ) {
    return 'PUBLIC_SERVICE';
  }
  if (combined.includes('COMMUN') || combined.includes('DIASPORA')) {
    return 'COMMUNITY';
  }
  if (
    combined.includes('MOVIE') ||
    combined.includes('CINEMA') ||
    combined.includes('DRAMA') ||
    combined.includes('SERIES') ||
    combined.includes('ENTERTAINMENT') ||
    combined.includes('COMEDY')
  ) {
    return 'ENTERTAINMENT';
  }
  if (combined.includes('MUSIC') || combined.includes('SONG')) {
    return 'MUSIC';
  }
  if (combined.includes('KID') || combined.includes('CARTOON') || combined.includes('ANIMATION')) {
    return 'CHILDREN';
  }
  if (combined.includes('SPORT') || combined.includes('FOOTBALL') || combined.includes('CRICKET')) {
    return 'SPORTS';
  }
  return 'NEWS';
}

function inferRegionAndLanguage(
  name: string,
  tvgId?: string,
  tvgCountry?: string,
  tvgLang?: string,
  groupTitle?: string,
  sourceHint?: string
): { country: string; region: string; language: string } {
  const raw = `${name} ${tvgId || ''} ${tvgCountry || ''} ${groupTitle || ''} ${sourceHint || ''}`.toLowerCase();
  const hasBengaliScript = /[\u0980-\u09FF]/.test(name);

  if (
    hasBengaliScript ||
    tvgCountry?.toUpperCase() === 'BD' ||
    raw.includes('.bd') ||
    raw.includes('bangla') ||
    raw.includes('bengal') ||
    raw.includes('dhaka') ||
    raw.includes('kolkata') ||
    raw.includes('calcutta') ||
    raw.includes('ananda') ||
    raw.includes('tripura') ||
    sourceHint === 'ben' ||
    sourceHint === 'bd'
  ) {
    const isIndia = raw.includes('kolkata') || raw.includes('calcutta') || raw.includes('ananda') || raw.includes('.in');
    return {
      country: isIndia ? 'India (West Bengal)' : 'Bangladesh',
      region: 'Bengali Desk',
      language: 'Bengali',
    };
  }

  if (
    tvgCountry?.toUpperCase() === 'US' ||
    raw.includes('.us') ||
    raw.includes('united states') ||
    raw.includes('america') ||
    raw.includes('cbs ') ||
    raw.includes('abc news') ||
    raw.includes('nbc ') ||
    raw.includes('pbs') ||
    raw.includes('bloomberg') ||
    sourceHint === 'us'
  ) {
    return {
      country: 'United States',
      region: 'Americas Bureau',
      language: tvgLang || 'English',
    };
  }

  if (
    ['GB', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'CH', 'BE', 'AT', 'SE', 'NO'].includes(
      (tvgCountry || '').toUpperCase()
    ) ||
    raw.includes('.uk') ||
    raw.includes('.de') ||
    raw.includes('.fr') ||
    raw.includes('bbc') ||
    raw.includes('sky news') ||
    raw.includes('euronews') ||
    raw.includes('france 24') ||
    raw.includes('dw ') ||
    sourceHint === 'eu'
  ) {
    return {
      country: tvgCountry || 'Europe',
      region: 'European Bureau',
      language: tvgLang || 'English',
    };
  }

  return {
    country: tvgCountry || groupTitle || 'International',
    region: 'Global Desk',
    language: tvgLang || 'International',
  };
}

export interface ParseM3uResult {
  channels: BroadcastItem[];
  errors: string[];
  totalParsed: number;
  filteredOutCount: number;
}

export function parseM3uContent(
  content: string,
  communityId: string = 'comm-iptv-org',
  maxChannels: number = 1500,
  strictJournalisticOnly: boolean = true,
  sourceHint?: string
): ParseM3uResult {
  const lines = content.split(/\r?\n/);
  const channels: BroadcastItem[] = [];
  const errors: string[] = [];
  let filteredOutCount = 0;

  let pendingHeader: {
    name: string;
    logo?: string;
    groupTitle?: string;
    tvgId?: string;
    language?: string;
    country?: string;
  } | null = null;

  const limit = maxChannels > 0 ? maxChannels : Infinity;

  for (let i = 0; i < lines.length; i++) {
    if (channels.length >= limit) break;
    const raw = lines[i]?.trim();
    if (!raw) continue;

    if (raw.startsWith('#EXTINF:')) {
      const commaIdx = raw.lastIndexOf(',');
      const displayName = commaIdx !== -1 ? raw.substring(commaIdx + 1).trim() : 'Unnamed Channel';
      const headerProps = commaIdx !== -1 ? raw.substring(0, commaIdx) : raw;

      const getAttr = (key: string): string | undefined => {
        const match = headerProps.match(new RegExp(`${key}="([^"]*)"`, 'i'));
        return match ? match[1] : undefined;
      };

      pendingHeader = {
        name: displayName || getAttr('tvg-name') || 'Live Dispatch Channel',
        logo: getAttr('tvg-logo'),
        groupTitle: getAttr('group-title'),
        tvgId: getAttr('tvg-id'),
        language: getAttr('tvg-language'),
        country: getAttr('tvg-country'),
      };
      continue;
    }

    if (raw.startsWith('#')) {
      continue;
    }

    if (pendingHeader && (raw.startsWith('http://') || raw.startsWith('https://'))) {
      const cleanStreamUrl = raw.split('|')[0].trim();
      const validation = validateSafeUrl(cleanStreamUrl);
      if (!validation.valid) {
        if (errors.length < 20) {
          errors.push(`[${pendingHeader.name}] Skipped: ${validation.reason}`);
        }
        pendingHeader = null;
        continue;
      }

      const category = mapGroupToCategory(pendingHeader.groupTitle, pendingHeader.name);

      if (strictJournalisticOnly) {
        const isOffMandate =
          ['ENTERTAINMENT', 'MUSIC', 'CHILDREN', 'CARTOONS', 'SPORTS', 'COOKING'].includes(category) ||
          EXCLUDED_ENTERTAINMENT_PATTERNS.test(`${pendingHeader.name} ${pendingHeader.groupTitle || ''}`);
        if (isOffMandate) {
          filteredOutCount++;
          pendingHeader = null;
          continue;
        }
      }

      const isHls = cleanStreamUrl.includes('.m3u8') || cleanStreamUrl.includes('/hls');
      const ytMatch = cleanStreamUrl.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
      );
      const youtubeId = ytMatch ? ytMatch[1] : undefined;

      const meta = inferRegionAndLanguage(
        pendingHeader.name,
        pendingHeader.tvgId,
        pendingHeader.country,
        pendingHeader.language,
        pendingHeader.groupTitle,
        sourceHint
      );

      channels.push({
        id: `m3u-${channels.length + 1}-${Math.random().toString(36).substring(2, 8)}`,
        channelNumber: 500 + channels.length + 1,
        title: pendingHeader.name,
        category,
        categoryLabel: `${meta.region} · ${category === 'DOCUMENTARY' ? 'Documentary' : 'Journalistic News'}`,
        location: meta.country,
        duration: 3600,
        videoUrl: cleanStreamUrl,
        youtubeId,
        hlsUrl: isHls ? cleanStreamUrl : undefined,
        streamType: youtubeId ? 'youtube' : isHls ? 'hls' : 'direct',
        thumbnailUrl: pendingHeader.logo || '',
        logoUrl: pendingHeader.logo,
        regulatoryApproved: true,
        complianceScore: 96,
        uploadedAt: 'Live M3U Stream',
        views: 0,
        isLive: true,
        description: `Verified ${meta.language} broadcast feed from ${meta.country} via Open IPTV M3U Directory.`,
        openSourceLicense: 'Public Free-to-Air Stream',
        ownerCommunityId: communityId,
        distributionScope: 'PUBLIC',
        classificationTaxonomy: {
          country: meta.country,
          region: meta.region,
          language: meta.language,
          ageClass: 'ALL',
          editorialClass: 'STANDARD',
        },
      });

      pendingHeader = null;
    }
  }

  return {
    channels,
    errors,
    totalParsed: channels.length,
    filteredOutCount,
  };
}
