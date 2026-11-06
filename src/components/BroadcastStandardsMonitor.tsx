import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Activity,
  Radio,
  Layers,
} from 'lucide-react';
import { AiModerationResult } from '../types/broadcast';
import { analyzeContentStandards, ComplianceAnalysisResponse } from '../services/complianceGateway';

interface BroadcastStandardsMonitorProps {
  onApprovedItem?: (item: any) => void;
  onClose?: () => void;
}

export default function BroadcastStandardsMonitor({
  onClose: _onClose,
}: BroadcastStandardsMonitorProps) {
  const [testTitle, setTestTitle] = useState<string>(
    'উপকূলীয় মানুষের জীবন ও সুপেয় পানির সংগ্রাম — মানবিক প্রামাণ্য প্রতিবেদন'
  );
  const [testDescription, setTestDescription] = useState<string>(
    'সুন্দরবন উপকূলে জলবায়ু পরিবর্তনের ফলে লবণাক্ততা বৃদ্ধি এবং স্থানীয় জনগোষ্ঠীর বৃষ্টির পানি সংরক্ষণ উদ্যোগ নিয়ে সরেজমিন সাংবাদিকতা ও মানবিক প্রামাণ্যচিত্র।'
  );
  const [testUrl, setTestUrl] = useState<string>(
    'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  );
  const [testCategory, setTestCategory] = useState<string>('DOCUMENTARY');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [latestAnalysis, setLatestAnalysis] = useState<ComplianceAnalysisResponse | null>(null);

  const [autoStreamLog, setAutoStreamLog] = useState<AiModerationResult[]>([
    {
      id: 'stream-audit-01',
      title: 'Somoy TV 24/7 Live: National & International News Bulletin',
      detectedLanguage: 'Bengali (বাংলা)',
      suggestedCategory: 'LIVE_NEWS',
      suggestedAgeRating: 'ALL',
      complianceStatus: 'APPROVED',
      riskScore: 2,
      policyChecks: {
        noHateSpeech: true,
        noGraphicViolence: true,
        licensingAwareness: true,
        privacyRespect: true,
        noPropaganda: true,
      },
      reasoning:
        'Verified journalistic news broadcast adhering to public-interest reporting standards and non-entertainment editorial charter.',
      reviewedByHuman: false,
      reviewerNotes: 'Automated Gemini Broadcast Audit',
      timestamp: 'Verified Live',
    },
    {
      id: 'stream-audit-02',
      title: 'DW Documentary: Clean Water & Climate Resilience in South Asia',
      detectedLanguage: 'English',
      suggestedCategory: 'DOCUMENTARY',
      suggestedAgeRating: 'ALL',
      complianceStatus: 'APPROVED',
      riskScore: 1,
      policyChecks: {
        noHateSpeech: true,
        noGraphicViolence: true,
        licensingAwareness: true,
        privacyRespect: true,
        noPropaganda: true,
      },
      reasoning:
        'Humanitarian and mankind-focused documentary cleared for global public playout.',
      reviewedByHuman: false,
      reviewerNotes: 'Automated Gemini Broadcast Audit',
      timestamp: 'Verified Live',
    },
    {
      id: 'stream-audit-03',
      title: 'Rejected Sample: Celebrity Gossip & Fictional Drama Serial',
      detectedLanguage: 'Bengali (বাংলা)',
      suggestedCategory: 'ENTERTAINMENT',
      suggestedAgeRating: 'ALL',
      complianceStatus: 'REJECTED',
      riskScore: 88,
      policyChecks: {
        noHateSpeech: true,
        noGraphicViolence: true,
        licensingAwareness: true,
        privacyRespect: true,
        noPropaganda: true,
      },
      reasoning:
        'Excluded under Bengal TV editorial mandate: general entertainment, fictional serials, and variety shows are not permitted on this journalistic and humanitarian network.',
      reviewedByHuman: false,
      reviewerNotes: 'Editorial Mandate Filter',
      timestamp: 'Blocked',
    },
  ]);

  const handleRunEvaluation = async () => {
    if (!testTitle.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeContentStandards(
        testTitle,
        testDescription,
        testUrl,
        testCategory
      );
      setLatestAnalysis(res);
      setAutoStreamLog((prev) => [res, ...prev]);
    } catch (err) {
      console.error('Audit analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6 text-[#1D1D1F]">
      {/* Header Card */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-[#1F7A3F] flex items-center gap-1.5">
            <ShieldCheck size={15} />
            <span>AI Censorship & Editorial Compliance Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] flex items-center gap-2.5">
            <Radio className="text-[#0066CC]" size={24} />
            <span>Broadcast Standards & Policy Monitor</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E73] max-w-2xl leading-relaxed">
            Every community upload and syndicated feed is screened against hate speech, graphic violence, disinformation, and non-journalistic general entertainment before broadcast.
          </p>
        </div>

        <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3 text-xs space-y-1 shrink-0">
          <div className="font-semibold text-[#1D1D1F]">Active Policy Profile</div>
          <div className="text-[#6E6E73]">Allowed: News · Humanitarian Docs · Science</div>
          <div className="text-[#D70015] font-medium">Blocked: General Entertainment · Hate Speech</div>
        </div>
      </div>

      {/* Live Policy Simulator */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-[#0066CC]" />
            <h2 className="font-bold text-base text-[#1D1D1F]">
              Test AI Censorship & Journalistic Filter
            </h2>
          </div>
          <span className="text-xs text-[#6E6E73]">Server-Side Gemini Verification</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#1D1D1F] mb-1">
              Broadcast Headline / Program Title
            </label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1D1D1F] mb-1">
              Submitted Category
            </label>
            <select
              value={testCategory}
              onChange={(e) => setTestCategory(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
            >
              <option value="DOCUMENTARY">Humanitarian & Mankind Documentary</option>
              <option value="LIVE_NEWS">Live Journalistic News</option>
              <option value="NEWS">Investigative & Civic Report</option>
              <option value="SCIENCE">Climate, Health & Science</option>
              <option value="EDUCATION">Educational Broadcast</option>
              <option value="ENTERTAINMENT">General Entertainment (Test Rejection)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-[#1D1D1F] mb-1">
              Stream or Video URL
            </label>
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-[#1D1D1F] mb-1">
              Editorial Summary
            </label>
            <textarea
              rows={2}
              value={testDescription}
              onChange={(e) => setTestDescription(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC] focus:bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={isAnalyzing}
            className="px-5 py-2.5 bg-[#0066CC] hover:bg-[#0055B3] text-white font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Auditing Content...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={15} />
                <span>Run Compliance Audit</span>
              </>
            )}
          </button>
        </div>

        {latestAnalysis && (
          <div
            className={`mt-4 p-4 rounded-2xl border space-y-2.5 text-xs ${
              latestAnalysis.complianceStatus === 'APPROVED'
                ? 'border-[#BBF7D0] bg-[#F0FDF4]'
                : 'border-[#FFD6D9] bg-[#FFF2F2]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {latestAnalysis.complianceStatus === 'APPROVED' ? (
                  <CheckCircle2 size={17} className="text-[#1F7A3F]" />
                ) : (
                  <XCircle size={17} className="text-[#D70015]" />
                )}
                <span
                  className={`font-bold text-sm ${
                    latestAnalysis.complianceStatus === 'APPROVED'
                      ? 'text-[#1F7A3F]'
                      : 'text-[#D70015]'
                  }`}
                >
                  {latestAnalysis.complianceStatus === 'APPROVED'
                    ? 'APPROVED FOR BROADCAST'
                    : 'REJECTED BY EDITORIAL GATE'}
                </span>
              </div>
              <span className="font-mono tabular-nums text-[#6E6E73]">
                Risk Score: {latestAnalysis.riskScore}/100
              </span>
            </div>

            <p className="text-[#1D1D1F] leading-relaxed bg-white p-3 rounded-xl border border-[#E5E5EA]">
              {latestAnalysis.reasoning}
            </p>
          </div>
        )}
      </div>

      {/* Audit Trail */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={17} className="text-[#1F7A3F]" />
            <h2 className="font-bold text-base text-[#1D1D1F]">
              Recent Compliance Decisions ({autoStreamLog.length})
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {autoStreamLog.map((item) => {
            const approved = item.complianceStatus === 'APPROVED';
            return (
              <div
                key={item.id}
                className="p-4 bg-[#F5F5F7]/70 border border-[#E5E5EA] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#1D1D1F]">{item.title}</span>
                    <span className="text-xs text-[#86868B]">·</span>
                    <span
                      className={`text-xs font-semibold ${
                        approved ? 'text-[#1F7A3F]' : 'text-[#D70015]'
                      }`}
                    >
                      {item.complianceStatus}
                    </span>
                    <span className="text-xs text-[#86868B]">·</span>
                    <span className="text-xs text-[#6E6E73]">{item.suggestedCategory}</span>
                  </div>
                  <p className="text-xs text-[#6E6E73]">{item.reasoning}</p>
                  <div className="text-[11px] text-[#86868B]">
                    {item.detectedLanguage} · Age {item.suggestedAgeRating} · {item.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
