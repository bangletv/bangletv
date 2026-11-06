# Open IPTV Federation — Dedicated TV Viewer Console & 1-Year 100% Free Tier Architecture

A production-grade, community-sovereign IPTV streaming platform and federation console built on an absolute 100% Free Tier operating model (0 USD monthly recurring infrastructure costs for 1+ years). Integrates standard global and Bangladeshi live channels, the Banglar Darpan LIVE reference community node, an automated HLS/DASH/Embed broadcast player with EPG schedule, a hybrid Gemini AI content classification and editorial approval gateway, M3U/XMLTV ingestion, and the constitutional governance memorandum of UK School of Artificial Intelligence Ltd (Company No: 17041560).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices from Clarification & Planning**:
> - **Initial Channel Catalog**: Preloaded with curated Bangladeshi news and cultural broadcasts (Banglar Darpan LIVE, Independent TV, Somoy, Jamuna, DBC, Channel 24, BTV, Sangsad) plus top global public interest networks (Al Jazeera, BBC News, DW, TRT World, NHK World, France 24, Bloomberg Free).
> - **AI Gateway & Moderation**: Hybrid workflow pairing Gemini AI (`gemini-3.8-flash` on the free tier) for automated title taxonomy, age classification, and hate/violence/defamation policy checks with an auditable Human Editorial Approval Queue before any feed crosses community federation boundaries.
> - **Primary Interface**: Dedicated TV Viewer Console optimized for immersive fullscreen video playback with 10-foot TV experience, keyboard shortcuts, electronic program guide (EPG) overlay, channel zapping bar, and accessible drawer for community federation governance.
> - **Zero-Cost 1-Year Constraint**: Zero paid VPS or expensive commercial transcoding servers. Playout operates via direct client-side stream passthrough, Cloudflare free tier edge caching, client IndexedDB/localStorage persistence with encrypted configuration export, and Gemini API Free Tier quota.

---

## 1. Overview & Core Concept

### What It Does
Open IPTV Federation delivers a sovereign, federated IPTV web broadcast experience. Each community operates its own autonomous node without handing over content ownership or audience data to a centralized tech monopoly. The application functions simultaneously as:
1. **A Cinematic TV Viewer Console**: An immersive, full-viewport television player supporting standard HLS/m3u8 live feeds, adaptive stream switching, electronic program guide (EPG), breaking news ticker, dual studio clocks (Dhaka BST & London GMT / New York EST), and TV remote keyboard navigation (`[Space]`, `[M]`, `[F]`, `[↑/↓]` channel surfing).
2. **Standard IPTV Taxonomy Catalog**: Covers all 15 constitutional IPTV categories: `NEWS`, `LIVE_NEWS`, `SPORTS`, `EDUCATION`, `SCIENCE`, `TECHNOLOGY`, `CULTURE`, `DOCUMENTARY`, `ENTERTAINMENT`, `MUSIC`, `RELIGION`, `COMMUNITY`, `PUBLIC_SERVICE`, `CHILDREN`, and `OTHER`.
3. **M3U & XMLTV Ingestion Engine**: Client-side SSRF-safe parser allowing node operators to drag-and-drop or import any standard IPTV playlist (`.m3u`/`.m3u8`) and EPG schedule (`.xml`/`.xmltv`) without sending private streams to third-party databases.
4. **Hybrid AI & Human Editorial Gateway**: Uses Gemini AI to auto-tag categories, check language, verify regulatory licenses, and flag policy risks, routing flagged content to an editorial review desk before public or federated publication.
5. **Constitutional Governance Memorandum**: Fully implements the UK School of Artificial Intelligence Ltd (Company No: 17041560) corporate and non-profit charter, with principal strategic patron Anwar Tariq Khan and operational lead Sheikh Mehedi Hasan Nadim.

### Target Audience & Persona
- **Global & Diaspora Communities**: Non-resident Bangladeshis across the UK, USA, Canada, Europe, and the Middle East seeking reliable homeland and world news without commercial paywalls.
- **Independent Community Broadcasters**: Universities, educational institutes, local investigative journalism teams, and cultural groups looking to broadcast 24/7 without multi-thousand-dollar monthly server bills.

---

## 2. User Experience & Visual Design

Following the `frontend-design` constitution and the SaaS/Broadcast Console reference, the application replaces generic website widgets with an authentic television studio control room and cinematic cinema environment:

### Visual Identity & Theme
- **Dominant Neutral Canvas (60%)**: Deep obsidian and studio midnight (`#02040a`, `#070b14`, `#0b1120`). High-contrast, glare-free aesthetic built for dark living rooms and late-night viewing.
- **Structural Surfaces (30%)**: Frosted studio bezel panels, hairline borders (`rgba(255, 255, 255, 0.08)`), subtle glass scrims, and clean tabular rows. Zero nested card-in-card clutter.
- **Accent Budget (10%)**: Studio signal gold (`#d4af37`, `#fbbf24`) for active channels and royal prestige, broadcast crimson (`#dc2626`) strictly for live on-air indicators, and emerald (`#16a34a`) for verified cryptographic integrity.
- **Typography**: Display headlines in `Plus Jakarta Sans` with balanced line wraps (`text-wrap: balance`). Channel callsigns, bitrate stats, timecodes, and studio clocks set in monospace tabular figures (`font-mono tabular-nums`).
- **Zero-Pill Discipline**: All category names, geographic markers, and licenses rendered as unboxed editorial text separated by subtle typographic dots (`Banglar Darpan · Dhaka · 1080p · Creative Commons`).

### Key User Flows
1. **Instant TV Playback (1-Click Zapping)**: Launches immediately into the dedicated fullscreen TV console with on-air broadcast playing. Bottom zapping bar allows horizontal channel switching across categories with left/right keys.
2. **EPG Grid & Program Guide**: Clicking the "Guide" trigger or pressing `G` expands a multi-channel chronological timeline showing current and upcoming shows with progress bars and descriptions.
3. **M3U / XMLTV Playlist Ingest**: Node administrators can upload custom playlists; the engine validates URLs against private IP / SSRF ranges, deduplicates channels, and previews them before storing in local node storage.
4. **AI Policy Gateway & Review**: Content submitters test their stream or program; Gemini AI evaluates the title, description, and metadata against the Federation Constitution, outputting structured classification and human approval flags.
5. **Federation Matrix & Sovereign Nodes**: Explore allied nodes (Banglar Darpan, UKSAI Media Lab, London Diaspora, North America Bangla), manage bilateral federation permissions (`ALLOW`, `DENY`, `BLOCK`), and view tamper-resistant audit logs.

---

## 3. Key Product Decisions & Trade-Offs

### 1-Year 100% Free Tier Architecture (0 USD Cost Breakdown)
| Component | Conventional Commercial Cost | Open IPTV Federation 1-Year Free Tier Solution | Cost to User |
| :--- | :--- | :--- | :--- |
| **Hosting & Web CDN** | $20 - $50/mo | Vercel / Cloudflare Pages / GitHub Pages Free Tier (unlimited bandwidth on static assets, 100GB edge) | **$0.00** |
| **Transcoding & Playout Server** | $300 - $600/mo (AWS/Hetzner) | Direct client-to-stream HLS/DASH passthrough + YouTube Live embed engine for pre-recorded loops | **$0.00** |
| **Relational Database** | $25 - $70/mo (RDS/Supabase) | Client-side IndexedDB & localStorage with cryptographic export/import + zero-cost serverless state | **$0.00** |
| **AI Moderation & Classification** | $100+/mo (Cloud Video API) | `@google/genai` with `gemini-3.8-flash` on the free tier (15 RPM / 1M TPM free quota) | **$0.00** |
| **SSL, DNS & DDoS Defense** | $20+/mo | Cloudflare Free Plan (Universal SSL, Web Application Firewall, free DNS) | **$0.00** |
| **Live Ingest (RTMP/SRT)** | $150+/mo | Free OBS Studio / vMix stream pushing directly to free YouTube Live or free WebRTC relay | **$0.00** |
| **Total 1st Year Cost** | **$4,800 - $12,000 / year** | **Constitutional Open-Source Free Model** | **$0.00 / year** |

### Decision: Client-Side Node Sovereignty vs. Centralized Server DB
- **Chosen Approach**: Store channels, preferences, watch history, and federation matrices in browser-persistent IndexedDB and localStorage, backed by an encrypted backup/restore JSON format.
- **Why**: Fully satisfies Section 4 of the Constitution ("A community shall not be the owner of another community's database"). Allows any user or community to fork and deploy anywhere on the free tier in under 60 seconds with zero server provisioning or credential costs.

### Decision: Direct Native HLS + Smart Embed Hybrid Player
- **Chosen Approach**: Provide an advanced HTML5 video engine supporting native HLS (`.m3u8`), MP4 direct feeds, and responsive YouTube Embed fallback for news clips and investigative documentaries.
- **Why**: Maximizes playback reliability across Chrome, Safari, Android TV, Fire TV, and mobile browsers without requiring expensive server-side media transcoders.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OPEN IPTV FEDERATION                            │
│                     DEDICATED TV VIEWER CONSOLE                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│     TV VIEWER CONSOLE        │              │  COMMUNITY NODE GOVERNANCE   │
│  - Fullscreen Cinema Engine  │              │  - Banglar Darpan LIVE Node  │
│  - HLS / MP4 / Embed Player  │              │  - 15 Standard Categories    │
│  - EPG Electronic Schedule   │              │  - M3U & XMLTV Ingest Engine │
│  - Dual World Studio Clocks  │              │  - Voluntary Federation Mesh │
│  - Channel Zapping Drawer    │              │  - Emergency Kill Switch     │
└──────────────┬───────────────┘              └──────────────┬───────────────┘
               │                                             │
               └──────────────────────┬──────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │         HYBRID AI MODERATION GATEWAY         │
               │  - Gemini API (gemini-3.8-flash Free Tier)   │
               │  - Structured Taxonomy Auto-Classification   │
               │  - Hate Speech & Defamation Policy Checks    │
               │  - Human Editorial Approval Queue            │
               │  - Tamper-Evident SHA-256 Audit Records      │
               └──────────────────────────────────────────────┘
```

### Component Structure
1. `src/components/TvViewerConsole.tsx`: Immersive 10-foot television experience with cinema aspect ratio, on-screen controls, dual studio clocks (Dhaka BST & London GMT / New York EST), audio boost, and zapping drawer.
2. `src/components/EpgGrid.tsx`: Interactive Electronic Program Guide showcasing multi-channel hourly broadcast schedules.
3. `src/components/M3uXmltvManager.tsx`: Drag-and-drop M3U playlist parser and XMLTV program guide importer with SSRF-safe URL validation and channel categorization.
4. `src/components/AiModerationGateway.tsx`: Hybrid AI engine leveraging Gemini to analyze content taxonomy, age rating, and constitutional compliance, connected to an editorial review desk.
5. `src/components/FederationManager.tsx`: Node relationship management (`ALLOW`, `DENY`, `BLOCK`), bilateral federation trust scores, and emergency kill switch controls.
6. `src/components/CharterViewer.tsx`: Bilingual (English & Bengali) constitutional memorandum and statutory UK Companies House governance filing for UK School of Artificial Intelligence Ltd.

---

## 5. Verification & Testing Plan

1. **Compilation & Type Safety**: Run `compile_applet` and `lint_applet` to verify zero TypeScript errors, clean imports, and Tailwind CSS compliance.
2. **TV Player Controls**: Verify keyboard shortcuts (`Space` for pause/play, `M` for mute, `F` for fullscreen, `Arrow Up/Down` for channel switching, `G` for EPG).
3. **Channel Ingest & Filtering**: Test M3U parsing with sample IPTV playlists, ensuring category detection, logo mapping, and SSRF address protection.
4. **AI Gateway**: Verify classification and policy evaluation using `@google/genai` with `gemini-3.8-flash` on the free tier.
5. **Responsive Viewport Presence**: Ensure seamless rendering across full-width desktop (1440px), living room TV screens, and mobile touch devices.
