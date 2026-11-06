import { useState } from 'react';
import { 
  FileText, ShieldCheck, Lock, Eye, HeartHandshake, 
  Globe, CheckCircle2, Award, Terminal, Code2, ExternalLink
} from 'lucide-react';

export default function PublicGovernanceCenter() {
  const [activeDoc, setActiveDoc] = useState<'operate' | 'privacy' | 'terms' | 'federation' | 'security' | 'acknowledgements'>('operate');

  const docs = [
    { id: 'operate', titleBn: 'How We Operate (আমাদের পরিচালনা নীতি)', titleEn: 'How We Operate', icon: FileText },
    { id: 'privacy', titleBn: 'Privacy Statement (গোপনীয়তা সনদ)', titleEn: 'Privacy Statement', icon: Eye },
    { id: 'terms', titleBn: 'Terms & Distribution (কন্টেন্ট ও বিতরণ স্বত্ব)', titleEn: 'Terms & Distribution', icon: ShieldCheck },
    { id: 'federation', titleBn: 'Federation Policy (ফেডারেশন নীতিমালা)', titleEn: 'Federation Policy', icon: Globe },
    { id: 'security', titleBn: 'Security & Zero Trust (নিরাপত্তা ফ্রেমওয়ার্ক)', titleEn: 'Security & Zero Trust', icon: Lock },
    { id: 'acknowledgements', titleBn: 'Acknowledgements (স্বীকৃতি ও কৃতজ্ঞতা)', titleEn: 'Acknowledgements', icon: HeartHandshake },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#050b18] border border-[#1a2f5e] rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex items-center gap-2 text-[#fbbf24] text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <ShieldCheck size={16} />
          <span>Public Transparency Documents • §28, §61 & §76</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          উন্মুক্ত সুশাসন ও পাবলিক ডকুমেন্টেশন সেন্টার (Public Governance)
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          ওপেন আইপিটিভি ফেডারেশনের প্রতিটি নীতি সাধারণ ব্যবহারকারী, কন্টেন্ট ক্রিয়েটর এবং অংশগ্রহণকারী নোডসমূহের জন্য উন্মুক্ত, স্থায়ী ও দৃশ্যমান।
        </p>

        {/* Tab Switcher */}
        <div className="mt-6 pt-5 border-t border-[#1a2f5e] flex flex-wrap gap-2 text-xs font-semibold">
          {docs.map(doc => {
            const Icon = doc.icon;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc.id as any)}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                  activeDoc === doc.id
                    ? 'bg-[#d4af37] text-[#02040a] font-extrabold shadow-md'
                    : 'bg-[#081021] text-slate-400 border border-[#1a2f5e] hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{doc.titleBn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-[#081021] border border-[#1a2f5e] rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        {activeDoc === 'operate' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 border-b border-[#1a2f5e] pb-4">
              <FileText className="text-[#fbbf24]" size={20} />
              <span>How We Operate — আমাদের মৌলিক পরিচালন দর্শন (§২৭ ও §৭৬.১)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-300">
              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl space-y-2">
                <div className="font-bold text-[#fbbf24] uppercase font-mono">১. সফটওয়্যার বনাম কন্টেন্ট স্বত্ব</div>
                <p>
                  আমরা সফটওয়্যার, প্রোটোকল ও প্রযুক্তিগত কাঠামোকে ওপেন-সোর্স রাখি, কিন্তু কোনো কমিউনিটির কন্টেন্ট, দর্শক বা সম্পাদকীয় কর্তৃত্ব কখনোই অন্যের উন্মুক্ত সম্পত্তি নয়।
                </p>
              </div>

              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl space-y-2">
                <div className="font-bold text-[#fbbf24] uppercase font-mono">২. স্বেচ্ছাভিত্তিক ফেডারেশন</div>
                <p>
                  ফেডারেশন একটি সুযোগ ও অনুমোদনের বিষয়, কোনো বাধ্যবাধকতা নয়। প্রতিটি কমিউনিটি নোড নিজের ইচ্ছায় অন্য নোডের সাথে যুক্ত হতে বা যেকোনো মুহূর্তে সংযোগ বিচ্ছিন্ন করতে পারে।
                </p>
              </div>

              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl space-y-2">
                <div className="font-bold text-[#fbbf24] uppercase font-mono">৩. কোনো জোরপূর্বক মিশ্রণ নেই</div>
                <p>
                  কোনো দর্শককে জোর করে কোনো নির্দিষ্ট কমিউনিটির কন্টেন্ট দেখতে বাধ্য করা হবে না। প্রতিটি কন্টেন্টের মূল উৎস ও কমিউনিটি অ্যাট্রিবিউশন সর্বদা সুস্পষ্ট থাকবে।
                </p>
              </div>

              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl space-y-2">
                <div className="font-bold text-[#fbbf24] uppercase font-mono">৪. প্রাইভেসি ও নিরাপত্তা বাই-ডিজাইন</div>
                <p>
                  সিস্টেমের প্রতিটি স্তরে জিরো-ট্রাস্ট সিকিউরিটি ও প্রাইভেসি বাই-ডিজাইন আর্কিটেকচার সক্রিয় থাকে। কোনো গোপন নজরদারি বা ব্যক্তিগত তথ্য বিক্রয় সম্পূর্ণরূপে নিষিদ্ধ।
                </p>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 border-b border-[#1a2f5e] pb-4">
              <Eye className="text-emerald-400" size={20} />
              <span>Privacy Statement — ব্যবহারকারীর তথ্যের গোপনীয়তা সনদ (§১৮, §১৯ ও §২৫)</span>
            </h2>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300">
                <span className="font-bold">মৌলিক প্রতিশ্রুতি: </span>
                আমরা কেবল সেবা প্রদান এবং নিরাপত্তার জন্য অপরিহার্য ন্যূনতম তথ্য সংগ্রহ করি। কোনো বাণিজ্যিক বিজ্ঞাপনদাতার কাছে তথ্য বিক্রয় বা ক্রস-কমিউনিটি ট্র্যাকিং করা হয় না।
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#050b18] border border-[#1a2f5e] p-3.5 rounded-xl">
                  <div className="font-bold text-white font-mono">সংগৃহীত তথ্য</div>
                  <p className="mt-1 text-slate-400">একাউন্ট ক্রেডেনশিয়াল (Argon2id হ্যাশড), স্বেচ্ছায় নির্ধারিত প্রেফারেন্স এবং সিকিউরিটি অডিট লগ।</p>
                </div>
                <div className="bg-[#050b18] border border-[#1a2f5e] p-3.5 rounded-xl">
                  <div className="font-bold text-white font-mono">সংরক্ষণের মেয়াদ</div>
                  <p className="mt-1 text-slate-400">অপারেশনাল প্রয়োজনীয়তা শেষ হলে বা ব্যবহারকারী একাউন্ট মুছে ফেললে সকল ব্যক্তিগত রেকর্ড স্থায়ীভাবে ডিলিট হয়।</p>
                </div>
                <div className="bg-[#050b18] border border-[#1a2f5e] p-3.5 rounded-xl">
                  <div className="font-bold text-white font-mono">ব্যবহারকারীর অধিকার</div>
                  <p className="mt-1 text-slate-400">UK GDPR ও বৈশ্বিক আইন মেনে তথ্যের অ্যাক্সেস, সংশোধন, এক্সপোর্ট এবং চিরতরে মুছে ফেলার অধিকার সংরক্ষিত।</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#050b18] border border-[#1a2f5e]">
                <div className="font-bold text-white font-mono text-[11px] uppercase text-[#fbbf24]">YouTube API Integration Disclosure (§১৭ ও §২৫)</div>
                <p className="mt-1 text-slate-400">
                  যেসব কন্টেন্ট ইউটিউব এপিআই কানেক্টরের মাধ্যমে প্রদর্শিত হয়, সেগুলোর ক্ষেত্রে Google Privacy Policy এবং YouTube Terms of Service কার্যকর থাকে। আমাদের সিস্টেমে কোনো অননুমোদিত অডিওভিজ্যুয়াল ক্যাশিং বা ইউটিউব ক্রেডেনশিয়াল স্টোরেজ করা হয় না।
                </p>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'terms' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 border-b border-[#1a2f5e] pb-4">
              <ShieldCheck className="text-[#fbbf24]" size={20} />
              <span>Terms, Ownership & Distribution Policy — স্বত্ব ও বিতরণ নীতি (§৫ ও §৮)</span>
            </h2>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl">
                <div className="font-bold text-white uppercase font-mono text-emerald-400 mb-1">
                  §67 THE CORE SYSTEM INVARIANT
                </div>
                <p className="text-sm italic text-slate-200">
                  "No content shall cross a community boundary unless the content owner or applicable distribution policy explicitly permits that crossing."
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-center">
                <div className="p-3 rounded-lg bg-[#050b18] border border-[#1a2f5e]">
                  <div className="font-mono font-bold text-rose-400">PRIVATE</div>
                  <div className="text-[10px] text-slate-400 mt-1">শুধুমাত্র অনুমোদিত মালিক/ইউজার (Default State)</div>
                </div>
                <div className="p-3 rounded-lg bg-[#050b18] border border-[#1a2f5e]">
                  <div className="font-mono font-bold text-amber-400">COMMUNITY_ONLY</div>
                  <div className="text-[10px] text-slate-400 mt-1">নিজস্ব নোডের অভ্যন্তরীণ দর্শক</div>
                </div>
                <div className="p-3 rounded-lg bg-[#050b18] border border-[#1a2f5e]">
                  <div className="font-mono font-bold text-blue-400">FOLLOWERS_ONLY</div>
                  <div className="text-[10px] text-slate-400 mt-1">অনুমোদিত সাবস্ক্রাইবার বা ফলোয়ার</div>
                </div>
                <div className="p-3 rounded-lg bg-[#050b18] border border-[#1a2f5e]">
                  <div className="font-mono font-bold text-indigo-400">FEDERATION_ALLOWED</div>
                  <div className="text-[10px] text-slate-400 mt-1">অনুমোদিত ফেডারেশন নোডে ডিসকভারি</div>
                </div>
                <div className="p-3 rounded-lg bg-[#050b18] border border-[#1a2f5e]">
                  <div className="font-mono font-bold text-emerald-400">PUBLIC</div>
                  <div className="text-[10px] text-slate-400 mt-1">উন্মুক্ত ইন্টারনেটে অবাধ প্রচার</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'federation' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 border-b border-[#1a2f5e] pb-4">
              <Globe className="text-blue-400" size={20} />
              <span>Federation Policy — নোড সংযোগ ও ডিসকভারি নীতিমালা (§৯, §১০ ও §২৩)</span>
            </h2>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl space-y-2">
                  <div className="font-bold text-white font-mono text-[#fbbf24]">অনুমতি ভিত্তিক ডিসকভারি</div>
                  <p>
                    একটি কমিউনিটি অন্য কমিউনিটিকে ফলো করতে পারে বা নির্দিষ্ট ক্যাটাগরি অনুমোদন করতে পারে (যেমন: এডুকেশন ও নিউজ এলাউ, পলিটিক্যাল ডিনাই)।
                  </p>
                </div>
                <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl space-y-2">
                  <div className="font-bold text-white font-mono text-rose-400">তাৎক্ষণিক প্রত্যাহার অধিকার (§২৩)</div>
                  <p>
                    কমিউনিটি যেকোনো মুহূর্তে পূর্বে দেওয়া ফেডারেশন অনুমতি বাতিল করতে পারবে। বাতিল করার সাথে সাথে সব ধরনের নতুন ডিস্ট্রিবিউশন ও মেটাডাটা সিঙ্ক রহিত হবে।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'security' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 border-b border-[#1a2f5e] pb-4">
              <Lock className="text-amber-400" size={20} />
              <span>Security, Secrets & Zero Trust — কারিগরি নিরাপত্তা স্থাপত্য (§১৪, §২০, §২২ ও §৫৭)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl">
                <div className="font-mono text-emerald-400 font-bold">Argon2id Hashing</div>
                <p className="mt-1 text-slate-400">পাসওয়ার্ড সংরক্ষণে রিভার্সিবল এনক্রিপশন নিষিদ্ধ; আধুনিক ও সর্বোচ্চ নিরাপদ হ্যাশিং বাধ্যতামূলক।</p>
              </div>
              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl">
                <div className="font-mono text-blue-400 font-bold">Secrets Isolation</div>
                <p className="mt-1 text-slate-400">এপিআই কি, প্রাইভেট কি এবং ক্রেডেনশিয়াল কখনো সোর্স কোড বা ফ্রন্টএন্ড বান্ডেলে রাখা যাবে না।</p>
              </div>
              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl">
                <div className="font-mono text-[#fbbf24] font-bold">Signed Activity</div>
                <p className="mt-1 text-slate-400">ফেডারেশন নোডগুলোর মধ্যে প্রেরিত প্রতিটি বার্তা ক্রিপ্টোগ্রাফিক কি দিয়ে সাইন করা হয়।</p>
              </div>
              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl">
                <div className="font-mono text-purple-400 font-bold">Zero Trust ABAC</div>
                <p className="mt-1 text-slate-400">ইন্টারনাল নেটওয়ার্কের প্রতিটি রিকোয়েস্টে পরিচয় ও অনুমোদন যাচাই ব্যতীত ডিফল্ট অবস্থা DENY।</p>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'acknowledgements' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 border-b border-[#1a2f5e] pb-4">
              <HeartHandshake className="text-rose-400" size={20} />
              <span>Acknowledgements — ওপেন-সোর্স ও প্রযুক্তি সম্প্রদায়ের প্রতি কৃতজ্ঞতা (§২৬ ও §৩১)</span>
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              Open IPTV Federation সেই সকল বৈশ্বিক ওপেন-সোর্স ডেভেলপার, গবেষক এবং নেটওয়ার্কিং প্রটোকল কারিগরদের প্রতি গভীর শ্রদ্ধা জ্ঞাপন করে, যাদের কাজ মুক্ত গণমাধ্যম অবকাঠামো নির্মাণে অসামান্য অনুপ্রেরণা জুগিয়েছে:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl space-y-2">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>PeerTube & ActivityPub Federation Protocol</span>
                  <span className="text-[10px] font-mono text-emerald-400">AGPL-3.0</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  ডিসেন্ট্রালাইজড ভিডিও পাবলিশিং, অ্যাডমিনিস্ট্রেটিভ ফেডারেশন কন্ট্রোল ও ক্রিপ্টোগ্রাফিক মেসেজ সাইনিং ধারণার পথপ্রদর্শক।
                </p>
              </div>

              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl space-y-2">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Owncast Independent Live Streaming</span>
                  <span className="text-[10px] font-mono text-emerald-400">MIT License</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  স্বতন্ত্র লাইভ ভিডিও ট্রান্সকোডিং, আরটিএমপি ইনজেস্ট এবং এজ-ডেলিভারি আর্কিটেকচারের অসাধারণ অনুপ্রেরণা।
                </p>
              </div>

              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl space-y-2">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>FFmpeg, HLS & WebRTC Ecosystem</span>
                  <span className="text-[10px] font-mono text-emerald-400">LGPL / Open Standards</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  সার্বজনীন ভিডিও এনকোডিং ও আল্ট্রা-লো ল্যাটেন্সি গ্লোবাল স্ট্রিমিং ফাউন্ডেশন।
                </p>
              </div>

              <div className="bg-[#050b18] border border-[#1a2f5e] p-4 rounded-xl space-y-2">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Free Speech Journalists & Diaspora Media</span>
                  <span className="text-[10px] font-mono text-[#fbbf24]">Community Rights</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  বাংলাদেশ, আমেরিকা, যুক্তরাজ্য ও প্রবাসে কর্মরত স্বাধীন সাংবাদিক ও সিটিজেন রিপোর্টারদের নিষ্ঠাবান ভূমিকা।
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
