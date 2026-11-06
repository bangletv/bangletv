# Bengal TV & Open IPTV Federation

> Sovereign broadcast journalism and humanitarian documentary network with live international M3U streams, Apple-inspired minimalist UI, automated Gemini AI compliance filter, and community video broadcasting.

[![Node.js CI](https://github.com/Dainikjahan/bangletv/actions/workflows/ci.yml/badge.svg)](https://github.com/Dainikjahan/bangletv/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Google Cloud Run](https://img.shields.io/badge/Platform-Google%20Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)

---

## 1. Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Runtime & Server** | Node.js (20+ / 22+), Express 4 | HTTP server with graceful shutdown (`SIGTERM`/`SIGINT`), health probes (`/api/health`), SSRF-protected M3U proxy (`/api/m3u-proxy`), and binary video upload handler (`/api/uploads`). |
| **Frontend UI** | React 19, TypeScript 5.8, Vite 6 | Apple-style off-white minimalist theme (`bg-[#F9F9FB]`), responsive channel guide, live breaking news ticker, DVR playback, and community submission portal. |
| **Styling & Motion** | Tailwind CSS v4, Lucide Icons, Motion | Clean typographic hierarchy, zero visual clutter, fluid transitions. |
| **AI Compliance Gate** | Google GenAI SDK (`@google/genai`) | Automated editorial censorship and compliance auditor powered by Gemini 3.8 Flash, enforcing strict journalistic and humanitarian broadcast mandates. |
| **Database & Auth** | Firebase 13 (Firestore & Auth) | Role-based access control (RBAC), owner-isolated PII subcollections, email verification gating, and verified broadcast feeds. |

---

## 2. Environment Variables & Secrets

API keys and secrets must **never** be hardcoded or committed into source code. All sensitive values are injected at runtime via environment variables.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Yes (in Cloud Run) | `3000` (local) / `8080` (Cloud Run) | The HTTP port the Express server listens on. In Cloud Run, this is automatically set to `8080`. |
| `NODE_ENV` | Recommended | `development` (local) / `production` | Set to `production` in container builds to serve static assets from `dist/`. |
| `GEMINI_API_KEY` | Required for AI Audit | *(None)* | Google Gemini API key used by backend `/api/compliance/analyze`. Never exposed to client bundles. |
| `VITE_API_BASE_URL` | Optional (for Pages) | `""` (relative `/api`) | Set to your Cloud Run URL (e.g. `https://bangletv-xxxxx.a.run.app`) if hosting frontend on Cloudflare Pages. |
| `APP_URL` | Optional | `http://localhost:3000` | Canonical public URL of deployed application. |

> **Security Discipline:**
> - `GEMINI_API_KEY` is strictly used server-side in `server.ts`. It is **never** embedded into frontend bundles or Vite client defines.
> - Store `GEMINI_API_KEY` in **Google Cloud Secret Manager** and inject it at runtime via `--set-secrets`.

---

## 3. Local Development

### Prerequisites
- Node.js 20.x or 22.x
- npm 9+ (or Bun)

### Setup & Run
```bash
# 1. Clone repository
git clone https://github.com/Dainikjahan/bangletv.git
cd bangletv

# 2. Install dependencies
npm install

# 3. Configure local environment
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY

# 4. Start development server (runs Express + Vite HMR on http://localhost:3000)
npm run dev

# 5. Run typecheck and lint
npm run lint

# 6. Test production build locally
npm run build
npm start
```

---

## 4. Google Cloud Run Deployment

Google Cloud Run is a fully managed serverless compute platform. Bengal TV is packaged as a containerized Node.js application that listens on `0.0.0.0:${PORT}` and handles both API endpoints and client-side SPA routing.

### Method A: Deploy from Source (Recommended)

Google Cloud Run can build and deploy the container directly from your source directory:

```bash
# Set your GCP Project ID
gcloud config set project YOUR_GCP_PROJECT_ID

# Deploy directly to Cloud Run
gcloud run deploy bangletv \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "GEMINI_API_KEY=bengal-tv-gemini-key:latest"
```

### Method B: Deploy using Docker & Google Artifact Registry

1. **Build and Tag the Docker image:**
   ```bash
   gcloud artifacts repositories create bangletv-repo \
     --repository-format=docker \
     --location=asia-southeast1 \
     --description="Bengal TV Docker repository"

   docker build -t asia-southeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/bangletv-repo/bangletv:v1 .
   ```

2. **Push image to Artifact Registry:**
   ```bash
   gcloud auth configure-docker asia-southeast1-docker.pkg.dev
   docker push asia-southeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/bangletv-repo/bangletv:v1
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy bangletv \
     --image asia-southeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/bangletv-repo/bangletv:v1 \
     --region asia-southeast1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8080 \
     --set-env-vars "NODE_ENV=production" \
     --set-secrets "GEMINI_API_KEY=bengal-tv-gemini-key:latest"
   ```

### Storing `GEMINI_API_KEY` in Google Secret Manager

```bash
# Create the secret in Google Cloud Secret Manager
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets create bengal-tv-gemini-key \
  --data-file=- \
  --replication-policy="automatic"

# Grant the Cloud Run default service account permission to access the secret
gcloud secrets add-iam-policy-binding bengal-tv-gemini-key \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Storage & Uploads on Cloud Run (Important Notice)

Cloud Run uses an **in-memory, ephemeral container filesystem**:
- Video dispatches uploaded through `/api/uploads` are temporarily buffered into the container's local `/app/uploads` folder.
- **Ephemeral Lifecycle:** Files in this directory **do not persist** across container restarts, instance scaling, or new deployments. When Cloud Run scales down to zero instances or spins up new instances across regions, local uploads will not be shared or retained.
- **Production Recommendation for Durable Uploads:**
  For permanent video hosting, connect the upload workflow to **Google Cloud Storage (GCS)** or **Firebase Storage** (`bamboo-castle-9vr20.firebasestorage.app`):
  1. Generate a signed upload URL via `@google-cloud/storage`.
  2. Have the client upload directly to the Cloud Storage bucket.
  3. Store the persistent public/CDN URL in Firestore after passing the AI compliance gate.

---

## 6. Firebase & Authentication Configuration

Bengal TV integrates Firebase Firestore and Firebase Authentication. The active configuration is located in `firebase-applet-config.json`:

```json
{
  "projectId": "bamboo-castle-9vr20",
  "appId": "1:570040300098:web:98c1b75329dab471fb33db",
  "authDomain": "bamboo-castle-9vr20.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-bengaltvproposal-f8e1428c-a0f5-409b-bc2e-ba9eace3db6b",
  "storageBucket": "bamboo-castle-9vr20.firebasestorage.app"
}
```

### Required Firebase Console Steps for Cloud Run:
1. **Authorized Domains:**
   After deploying to Cloud Run, copy your assigned Cloud Run URL (e.g. `https://bangletv-xxxxx-as.a.run.app`) and add it to:
   - **Firebase Console** &rarr; **Authentication** &rarr; **Settings** &rarr; **Authorized domains** &rarr; **Add domain**.
   - If using a custom domain (e.g. `tv.dainikjahan.com`), add the custom domain as well.
2. **Security Rules:**
   The `firestore.rules` file enforces rigorous constraints:
   - Contributor profiles can only be written by the authenticated user (`request.auth.uid == userId`).
   - Email addresses and PII are strictly isolated under `/users/{userId}/private/info`.
   - Broadcast submissions must be approved (`complianceStatus == 'APPROVED'`) with a minimum score of 70 before publication.
   - Deploy rules using the Firebase CLI:
     ```bash
     firebase deploy --only firestore:rules
     ```

---

## 7. Continuous Integration (GitHub Actions)

A CI workflow is configured at `.github/workflows/ci.yml`. It triggers on every pull request and push to `main` or `master`, testing across Node.js versions 20.x and 22.x:
1. Installs clean dependencies deterministically via lockfile (`npm ci`).
2. Runs TypeScript type checking (`npm run lint`).
3. Executes the full production Vite bundle build (`npm run build`).

---

## 8. Deployment Architectures: Full-Stack Cloud Run vs Static Cloudflare Pages

### Option 1: Full-Stack Google Cloud Run (Recommended & Fully Configured)
- Single unified service running Node.js + Express.
- Serves the compiled Vite frontend from `dist/` and hosts all API routes (`/api/compliance/analyze`, `/api/uploads`, `/api/m3u-proxy`, `/api/health`).
- Zero cross-origin or proxy configuration required.

### Option 2: Decoupled (Cloudflare Pages Frontend + Cloud Run API Backend)
If hosting the static frontend on Cloudflare Pages (e.g. `tv.dainikjahan.com` or `Dainikjahan/bangle-TV`):
1. **API Base URL:** In Cloudflare Pages environment variables, set `VITE_API_BASE_URL=https://bangletv-xxxxx.a.run.app`. The frontend client will route all compliance checks, video uploads, and M3U proxy calls to your Cloud Run backend.
2. **SPA Routing:** Ensure `public/_redirects` (`/* /index.html 200`) is in the build output.
3. **No Direct Browser Secrets:** Never inject `GEMINI_API_KEY` into Cloudflare Pages build variables or client code. All AI operations are proxied through the backend.

---

## 9. Synchronizing with Target Repository (`Dainikjahan/bangle-TV`)

If merging changes from `Dainikjahan/bangletv` to `Dainikjahan/bangle-TV`:
1. **Dependencies:** Ensure `firebase` (`^13.2.0`), `@google/genai` (`^2.32.0`), `hls.js` (`^1.7.3`), `motion` (`^12.23.24`), and `lucide-react` are installed in the target `package.json`.
2. **Assets:** Copy `src/assets/images/*` (`bengal_tv_logo_*.jpg`, `bengali_newsroom_thumb_*.jpg`, etc.) and `public/bengal-tv-logo.jpg`.
3. **Components & Services:** Copy `src/components/CommunityBroadcastStudio.tsx`, `src/components/TurbiflyDomainHub.tsx`, `src/components/BreakingNewsTicker.tsx`, `src/services/complianceGateway.ts`, and `src/utils/timeshiftBuffer.ts`.
4. **Types Contract:** Use the unified `BroadcastItem` type from `src/types/broadcast.ts`.
5. **Firebase Config:** Include `firebase-applet-config.json` and deploy `firestore.rules` via `firebase deploy --only firestore:rules`.

---

## 10. License

This project is licensed under the MIT License.
