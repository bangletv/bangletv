import { useState } from 'react';
import {
  Shield,
  BookOpen,
  Scale,
  Award,
  Users,
  CheckCircle2,
  Search,
} from 'lucide-react';
import FederationMatrix from './FederationMatrix';
import BroadcastStandardsMonitor from './BroadcastStandardsMonitor';

export default function ConstitutionViewer() {
  const [viewMode, setViewMode] = useState<'charter' | 'standards' | 'federation'>('charter');
  const [lang, setLang] = useState<'bn' | 'en'>('en');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const coreInvariants = [
    {
      id: 'inv-1',
      titleEn: 'Community Sovereignty',
      titleBn: 'কমিউনিটির সার্বভৌমত্ব',
      descEn:
        'Each community desk is independently governed with full autonomy over local editorial priorities.',
      descBn:
        'প্রতিটি কমিউনিটি স্বাধীন ও স্বশাসিত। কোনো একক কেন্দ্রীয় সত্ত্বা কমিউনিটির কন্টেন্ট বা দর্শকের মালিকানা দাবি করবে না।',
      sectionRef: '§1 & §67',
    },
    {
      id: 'inv-2',
      titleEn: 'Journalistic & Humanitarian Mandate',
      titleBn: 'সাংবাদিকতা ও মানবিক প্রামাণ্যচিত্র নীতি',
      descEn:
        'Broadcasts focus strictly on factual news journalism, civic accountability, science, and mankind-oriented documentaries.',
      descBn:
        'সম্প্রচার শুধুমাত্র বস্তুনিষ্ঠ সংবাদ, জনস্বার্থমূলক প্রতিবেদন ও মানবিক প্রামাণ্যচিত্রের জন্য নিবেদিত।',
      sectionRef: '§5 & §11',
    },
    {
      id: 'inv-3',
      titleEn: 'Explicit Distribution Permission',
      titleBn: 'স্পষ্ট বিতরণ অনুমতি',
      descEn:
        'Contributors explicitly choose whether an AI-approved report is shared within their community desk or globally.',
      descBn:
        'নির্মাতার স্পষ্ট অনুমতি অনুসারে অনুমোদিত প্রতিবেদন কমিউনিটি বা বৈশ্বিক পরিসরে সম্প্রচারিত হয়।',
      sectionRef: '§8 & §69',
    },
    {
      id: 'inv-4',
      titleEn: 'Authentic Stream Attribution',
      titleBn: 'সঠিক চ্যানেল ও সোর্স নিষ্ঠা',
      descEn:
        'Every Bengali, American, and European channel maps strictly to its verified broadcaster with transparent source attribution.',
      descBn:
        'প্রতিটি বাংলা ও আন্তর্জাতিক চ্যানেল তার নিজস্ব প্রকৃত সম্প্রচার ফিডের সাথে যুক্ত থাকে।',
      sectionRef: '§10 & §70',
    },
    {
      id: 'inv-5',
      titleEn: 'Reversible Federation',
      titleBn: 'প্রত্যাহারযোগ্য ফেডারেশন',
      descEn:
        'Any community node can update or withdraw federation permissions at any moment with immediate effect.',
      descBn:
        'যেকোনো কমিউনিটি যেকোনো মুহূর্তে ফেডারেশন পরিবর্তন বা প্রত্যাহার করতে পারবে।',
      sectionRef: '§23 & §71',
    },
    {
      id: 'inv-6',
      titleEn: 'Auditable AI Compliance Gate',
      titleBn: 'স্বচ্ছ এআই কমপ্লায়েন্স অডিট',
      descEn:
        'All user-submitted broadcasts pass through automated censorship and journalistic compliance screening prior to publication.',
      descBn:
        'সকল আপলোডকৃত ভিডিও সম্প্রচারের পূর্বে স্বয়ংক্রিয় এআই নীতিমালা যাচাই প্রক্রিয়ায় উত্তীর্ণ হতে হয়।',
      sectionRef: '§14 & §72',
    },
  ];

  const filteredInvariants = coreInvariants.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.titleBn.toLowerCase().includes(q) ||
      item.titleEn.toLowerCase().includes(q) ||
      item.descBn.toLowerCase().includes(q) ||
      item.descEn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Bar for Governance, AI Standards & Federation */}
      <div className="bg-white border-b border-[#E5E5EA] px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex bg-[#EFEFF4] p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('charter')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'charter'
                  ? 'bg-white text-[#1D1D1F] shadow-2xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Broadcast Charter
            </button>
            <button
              type="button"
              onClick={() => setViewMode('standards')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'standards'
                  ? 'bg-white text-[#1D1D1F] shadow-2xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              AI Compliance Monitor
            </button>
            <button
              type="button"
              onClick={() => setViewMode('federation')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'federation'
                  ? 'bg-white text-[#1D1D1F] shadow-2xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Federation Nodes
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'standards' && <BroadcastStandardsMonitor />}
      {viewMode === 'federation' && <FederationMatrix />}

      {viewMode === 'charter' && (
        <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-8 pb-10 text-[#1D1D1F]">
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-[#0066CC] text-xs font-semibold mb-1.5">
                  <Scale size={15} />
                  <span>Constitutional Architecture · §§1–79</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
                  {lang === 'bn'
                    ? 'বেঙ্গল টিভি ও ওপেন আইপিটিভি ফেডারেশন সনদ'
                    : 'Bengal TV & Open IPTV Federation Charter'}
                </h1>
                <p className="text-xs sm:text-sm text-[#6E6E73] mt-2 max-w-3xl leading-relaxed">
                  {lang === 'bn'
                    ? 'বস্তুনিষ্ঠ সংবাদ, মানবিক প্রামাণ্যচিত্র এবং স্বাধীন কমিউনিটি সম্প্রচারের সাংবিধানিক কাঠামো।'
                    : 'Governance charter safeguarding journalistic integrity, humanitarian documentary standards, and decentralized community broadcast sovereignty.'}
                </p>
              </div>

              <div className="inline-flex bg-[#EFEFF4] p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-white text-[#1D1D1F] shadow-2xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    lang === 'bn'
                      ? 'bg-white text-[#1D1D1F] shadow-2xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Leadership & Governance Separation */}
            <div className="mt-6 pt-6 border-t border-[#E5E5EA] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F5F5F7]/70 border border-[#E5E5EA] p-5 rounded-2xl flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#0066CC] shrink-0">
                  <Award size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-[#6E6E73]">
                    §3 Patron & Principal Strategic Authority
                  </div>
                  <div className="text-base font-bold text-[#1D1D1F] mt-0.5">
                    Anwar Tariq Khan
                  </div>
                  <p className="text-xs text-[#6E6E73] mt-1 leading-relaxed">
                    Principal strategic stewardship, institutional charter integrity, and long-term public-interest direction.
                  </p>
                </div>
              </div>

              <div className="bg-[#F5F5F7]/70 border border-[#E5E5EA] p-5 rounded-2xl flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#0066CC] shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-[#6E6E73]">
                    §3 Operational Lead & Implementation Authority
                  </div>
                  <div className="text-base font-bold text-[#1D1D1F] mt-0.5">
                    Sheikh Mehedi Hasan Nadim
                  </div>
                  <p className="text-xs text-[#6E6E73] mt-1 leading-relaxed">
                    Executive broadcast engineering, editorial desk coordination, and day-to-day technical operations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Invariants */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Shield className="text-[#0066CC]" size={18} />
                <h2 className="text-lg font-bold text-[#1D1D1F]">
                  {lang === 'bn'
                    ? 'মৌলিক সাংবিধানিক স্তম্ভসমূহ'
                    : 'Constitutional Pillars & Editorial Invariants'}
                </h2>
              </div>

              <div className="relative w-full sm:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search charter principles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#E5E5EA] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0066CC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvariants.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white border border-[#E5E5EA] rounded-2xl p-5 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#0066CC] font-semibold">
                      {inv.sectionRef}
                    </span>
                    <CheckCircle2 size={15} className="text-[#1F7A3F]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1D1D1F]">
                    {lang === 'bn' ? inv.titleBn : inv.titleEn}
                  </h3>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    {lang === 'bn' ? inv.descBn : inv.descEn}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 5-Layer Architecture Summary */}
          <section className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen size={17} className="text-[#0066CC]" />
              <h2 className="text-base font-bold text-[#1D1D1F]">
                Five-Layer Broadcast Architecture (§2)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
              {[
                { step: '01', name: 'Identity', desc: 'Verified Contributors' },
                { step: '02', name: 'Community', desc: 'Regional News Desks' },
                { step: '03', name: 'Compliance', desc: 'Gemini Editorial Filter' },
                { step: '04', name: 'Federation', desc: 'Consent-Based Sharing' },
                { step: '05', name: 'Broadcast', desc: 'Resilient HLS & DVR' },
              ].map((l) => (
                <div
                  key={l.step}
                  className="bg-[#F5F5F7] border border-[#E5E5EA] p-4 rounded-xl space-y-1"
                >
                  <div className="text-[10px] font-mono text-[#0066CC] font-bold">
                    LAYER {l.step}
                  </div>
                  <div className="text-xs font-bold text-[#1D1D1F]">{l.name}</div>
                  <div className="text-[11px] text-[#6E6E73]">{l.desc}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
