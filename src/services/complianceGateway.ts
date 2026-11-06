import { AiModerationResult, ContentCategory } from '../types/broadcast';

export interface ComplianceAnalysisResponse extends AiModerationResult {
  complianceScore?: number;
  isJournalisticOrHumanitarian?: boolean;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

/**
 * Calls the server-side Bengal TV Gemini AI Censorship & Broadcast Compliance Gateway (/api/compliance/analyze).
 * Strictly enforces journalistic news and humanitarian/mankind documentary standards.
 */
export async function analyzeContentStandards(
  title: string,
  description: string,
  sourceUrl: string,
  claimedCategory?: string,
  location?: string,
  transcriptNotes?: string
): Promise<ComplianceAnalysisResponse> {
  const targetUrl = `${API_BASE}/api/compliance/analyze`;
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description,
      sourceUrl,
      claimedCategory: claimedCategory || 'NEWS',
      location: location || '',
      transcriptNotes: transcriptNotes || '',
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'Compliance API route not found (HTTP 404). If hosting frontend on Cloudflare Pages, set VITE_API_BASE_URL to your deployed Cloud Run backend URL.'
      );
    }
    throw new Error(data?.error || `Compliance server returned HTTP ${response.status}`);
  }

  return data as ComplianceAnalysisResponse;
}

export async function uploadVideoBinary(
  file: File
): Promise<{ videoUrl: string; fileName: string; bytes: number }> {
  const targetUrl = `${API_BASE}/api/uploads`;
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'Upload API route not found (HTTP 404). If hosting frontend on Cloudflare Pages, configure VITE_API_BASE_URL or use persistent cloud object storage (R2 / Firebase Storage).'
      );
    }
    throw new Error(data?.error || `Upload failed with HTTP ${response.status}`);
  }

  // If relative path returned and API_BASE is set, ensure absolute URL
  const videoUrl = data?.videoUrl && API_BASE && data.videoUrl.startsWith('/')
    ? `${API_BASE}${data.videoUrl}`
    : data.videoUrl;

  return {
    videoUrl,
    fileName: data.fileName,
    bytes: data.bytes,
  };
}
