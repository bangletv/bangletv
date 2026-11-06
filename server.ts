import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_Categories = [
  'NEWS',
  'LIVE_NEWS',
  'DOCUMENTARY',
  'EDUCATION',
  'SCIENCE',
  'PUBLIC_SERVICE',
  'COMMUNITY',
];

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isSafeExternalM3uUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    const blocked = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^metadata\.google\.internal$/i,
    ];
    return !blocked.some((re) => re.test(host));
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Health probe for Google Cloud Run container liveness/readiness
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'bengal-tv', uptime: process.uptime() });
  });

  // Serve uploaded community/journalist videos
  app.use('/uploads', express.static(UPLOADS_DIR));

  // 1. Binary Video Upload Endpoint (/api/uploads)
  app.post(
    '/api/uploads',
    express.raw({
      type: ['video/mp4', 'video/webm', 'video/quicktime', 'application/octet-stream'],
      limit: '65mb',
    }),
    (req: Request, res: Response) => {
      try {
        const body = req.body as Buffer;
        if (!Buffer.isBuffer(body) || body.length < 64) {
          res.status(400).json({ error: 'Empty or invalid video file payload.' });
          return;
        }

        const rawName = String(req.headers['x-file-name'] || 'dispatch.mp4');
        const extMatch = rawName.toLowerCase().match(/\.(mp4|webm|mov)$/);
        const ext = extMatch ? extMatch[1] : 'mp4';
        const safeFileName = `bengaltv-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const fullPath = path.join(UPLOADS_DIR, safeFileName);

        fs.writeFileSync(fullPath, body);

        res.status(201).json({
          videoUrl: `/uploads/${safeFileName}`,
          fileName: safeFileName,
          bytes: body.length,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to store uploaded video.';
        res.status(500).json({ error: message });
      }
    }
  );

  // Standard JSON parser for API endpoints
  app.use(express.json({ limit: '2mb' }));

  // 2. AI Journalistic & Humanitarian Compliance Censorship Filter (/api/compliance/analyze)
  app.post('/api/compliance/analyze', async (req: Request, res: Response) => {
    try {
      const {
        title = '',
        description = '',
        sourceUrl = '',
        claimedCategory = 'NEWS',
        location = '',
        transcriptNotes = '',
      } = req.body || {};

      const cleanTitle = String(title).trim();
      const cleanDesc = String(description).trim();

      if (cleanTitle.length < 5 || cleanDesc.length < 10) {
        res.status(400).json({
          error: 'Please provide a factual headline (min 5 characters) and journalistic summary (min 10 characters).',
        });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({
          error: 'Gemini API key is not configured on the server. Please check Settings > Secrets.',
        });
        return;
      }

      const ai = getGenAIClient();

      const systemInstruction = `You are the Chief Editorial Censorship & Broadcast Compliance Auditor for Bengal TV (Open IPTV Federation).
Bengal TV's exclusive editorial mandate is STRICTLY limited to:
1. Authentic Journalistic News (local, national, diaspora, investigative, economic, civic, or global current affairs).
2. Humanitarian & Mankind-Oriented Documentaries (human rights, climate resilience, public health, education, science for humanity, cultural heritage preservation, social welfare).

MANDATORY EXCLUSION & CENSORSHIP RULES:
- STRICTLY REJECT ("REJECTED") any general entertainment content: fictional TV dramas, soap operas, comedy skits, music videos, celebrity gossip, movies, cartoons, gaming streams, commercial promotions, or lifestyle entertainment.
- STRICTLY REJECT ("REJECTED") hate speech, communal incitement, defamation, graphic violence, terrorism, disinformation/propaganda, privacy violations, or copyright piracy.
- ONLY APPROVE ("APPROVED") submissions that clearly demonstrate journalistic news value or humanitarian/mankind documentary merit and adhere to ethical broadcast standards.
- When APPROVED, suggestedCategory MUST be one of: NEWS, LIVE_NEWS, DOCUMENTARY, EDUCATION, SCIENCE, PUBLIC_SERVICE, COMMUNITY.
- Keep reasoning concise (2-3 sentences), objective, and suitable for display to the contributor.`;

      const prompt = `Audit the following viewer-submitted broadcast for Bengal TV publication:
Headline: "${cleanTitle}"
Summary & Context: "${cleanDesc}"
Dateline / Location: "${String(location).trim() || 'Unspecified'}"
Claimed Category: "${String(claimedCategory)}"
Field Notes / Transcript Excerpt: "${String(transcriptNotes).trim() || 'None provided'}"
Video Source: "${String(sourceUrl).trim()}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedLanguage: {
                type: Type.STRING,
                description: 'Detected language of the submission (e.g., Bengali, English, Bilingual).',
              },
              suggestedCategory: {
                type: Type.STRING,
                description: 'One of NEWS, LIVE_NEWS, DOCUMENTARY, EDUCATION, SCIENCE, PUBLIC_SERVICE, COMMUNITY, or ENTERTAINMENT if rejected for entertainment.',
              },
              suggestedAgeRating: {
                type: Type.STRING,
                description: 'One of ALL, 12+, 16+, 18+.',
              },
              complianceStatus: {
                type: Type.STRING,
                description: 'APPROVED or REJECTED.',
              },
              riskScore: {
                type: Type.NUMBER,
                description: 'Policy and editorial risk score from 0 (fully compliant) to 100 (severe violation or off-mandate entertainment).',
              },
              isJournalisticOrHumanitarian: {
                type: Type.BOOLEAN,
                description: 'True ONLY if content is genuine journalistic news or humanitarian/mankind documentary; False if general entertainment.',
              },
              noHateSpeech: { type: Type.BOOLEAN },
              noGraphicViolence: { type: Type.BOOLEAN },
              licensingAwareness: { type: Type.BOOLEAN },
              privacyRespect: { type: Type.BOOLEAN },
              noPropaganda: { type: Type.BOOLEAN },
              reasoning: {
                type: Type.STRING,
                description: 'Clear 2-3 sentence editorial compliance explanation.',
              },
            },
            required: [
              'detectedLanguage',
              'suggestedCategory',
              'suggestedAgeRating',
              'complianceStatus',
              'riskScore',
              'isJournalisticOrHumanitarian',
              'noHateSpeech',
              'noGraphicViolence',
              'licensingAwareness',
              'privacyRespect',
              'noPropaganda',
              'reasoning',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);

      const riskScore = Math.min(100, Math.max(0, Number(parsed.riskScore ?? 50)));
      const policyPassed =
        Boolean(parsed.isJournalisticOrHumanitarian) &&
        Boolean(parsed.noHateSpeech) &&
        Boolean(parsed.noGraphicViolence) &&
        Boolean(parsed.licensingAwareness) &&
        Boolean(parsed.privacyRespect) &&
        Boolean(parsed.noPropaganda);

      const isApproved =
        parsed.complianceStatus === 'APPROVED' &&
        policyPassed &&
        riskScore <= 30 &&
        ALLOWED_Categories.includes(String(parsed.suggestedCategory));

      const safeCategory = ALLOWED_Categories.includes(String(parsed.suggestedCategory))
        ? String(parsed.suggestedCategory)
        : 'NEWS';

      const complianceScore = isApproved
        ? Math.max(75, Math.min(100, Math.round(100 - riskScore)))
        : Math.max(0, Math.min(69, Math.round(100 - riskScore)));

      res.json({
        id: `audit-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}`,
        title: cleanTitle,
        detectedLanguage: String(parsed.detectedLanguage || 'Bengali / English'),
        suggestedCategory: isApproved ? safeCategory : String(parsed.suggestedCategory || 'OTHER'),
        suggestedAgeRating: ['ALL', '12+', '16+', '18+'].includes(String(parsed.suggestedAgeRating))
          ? String(parsed.suggestedAgeRating)
          : 'ALL',
        complianceStatus: isApproved ? 'APPROVED' : 'REJECTED',
        riskScore,
        complianceScore,
        isJournalisticOrHumanitarian: Boolean(parsed.isJournalisticOrHumanitarian),
        policyChecks: {
          noHateSpeech: Boolean(parsed.noHateSpeech),
          noGraphicViolence: Boolean(parsed.noGraphicViolence),
          licensingAwareness: Boolean(parsed.licensingAwareness),
          privacyRespect: Boolean(parsed.privacyRespect),
          noPropaganda: Boolean(parsed.noPropaganda),
        },
        reasoning: String(
          parsed.reasoning ||
            (isApproved
              ? 'Approved under Bengal TV Journalistic & Humanitarian Broadcast Standards.'
              : 'Submission does not meet Bengal TV journalistic news and humanitarian documentary requirements.')
        ),
        reviewedByHuman: false,
        reviewerNotes: 'Bengal TV Gemini AI Editorial & Censorship Gate',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Compliance analysis failed.';
      console.error('Gemini compliance error:', message);
      res.status(500).json({ error: message });
    }
  });

  // 3. Safe Public M3U Playlist Proxy (/api/m3u-proxy?url=...)
  app.get('/api/m3u-proxy', async (req: Request, res: Response) => {
    const targetUrl = String(req.query.url || '').trim();
    if (!isSafeExternalM3uUrl(targetUrl)) {
      res.status(400).json({ error: 'Invalid or disallowed playlist URL.' });
      return;
    }
    try {
      const upstream = await fetch(targetUrl, {
        headers: { 'User-Agent': 'BengalTV-M3U-Ingest/2.0' },
      });
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: `Upstream HTTP ${upstream.status}` });
        return;
      }
      const text = await upstream.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(text);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch remote M3U.';
      res.status(502).json({ error: message });
    }
  });

  // 4. Frontend Serving (Vite Dev Middleware vs Production Static Bundle)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const serverInstance = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Bengal TV Broadcast Server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Gracefully closing HTTP server...`);
    serverInstance.close(() => {
      console.log('HTTP server closed successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
