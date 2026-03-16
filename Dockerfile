# FollowUp Trading Frontend — Dev server with API proxy
#
# Runs Vite dev server with hot-reload and proxies /api/* to the backend.
# For production, use a multi-stage build with nginx instead.

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Vite dev server listens on all interfaces
ENV HOST=0.0.0.0
EXPOSE 5173

# Override the proxy target to point to the backend container
# Vite reads this at startup via vite.config.ts
ENV VITE_API_PROXY_TARGET=http://backend:9870

CMD ["npx", "vite", "--host", "0.0.0.0"]
