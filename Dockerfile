# ------------------------------------------------------------
# Bengal TV & Open IPTV Federation - Production Dockerfile
# Optimized for Google Cloud Run (Node.js 22 + Vite + Express)
# ------------------------------------------------------------

# --- Stage 1: Build Frontend Assets ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions and lockfile
COPY package.json package-lock.json ./

# Deterministically install all dependencies using lockfile
RUN npm ci

# Copy source code and build config
COPY tsconfig.json vite.config.ts index.html ./
COPY public/ ./public/
COPY src/ ./src/

# Compile and bundle static assets to dist/
RUN npm run build

# --- Stage 2: Production Container ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only using lockfile
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server entrypoint and configuration files
COPY server.ts ./
COPY firebase-applet-config.json ./

# Create uploads directory for runtime video buffering
RUN mkdir -p /app/uploads

# Expose standard Cloud Run HTTP port
EXPOSE 8080

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Start the Node.js Express server
CMD ["npm", "start"]
