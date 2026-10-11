# ---- FluxPay Backend — production image ------------------------------------
# Build:  docker build -t fluxpay-backend .
# Run:    docker run -d -p 3001:3001 \
#           -v fluxpay-data:/app/data \
#           -e NODE_ENV=production \
#           -e JWT_SECRET=<strong-random-string> \
#           -e DATABASE_PATH=/app/data/fluxpay.db \
#           --env-file .env \
#           fluxpay-backend

# ---- Build stage: install all deps (incl. dev) and compile TS ----
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# Drop dev dependencies from node_modules for the runtime image
RUN npm prune --omit=dev

# ---- Runtime stage ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Persistent SQLite storage (survives container restarts):
#   run with -v fluxpay-data:/app/data and DATABASE_PATH=/app/data/fluxpay.db
VOLUME ["/app/data"]
EXPOSE 3001
CMD ["node", "dist/index.js"]