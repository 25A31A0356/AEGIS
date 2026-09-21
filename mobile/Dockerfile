# ----------------------------------------------------
# Stage 1: Build Stage
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy project source code
COPY . .

# Build the backend server with esbuild
RUN npm run build

# ----------------------------------------------------
# Stage 2: Production Runtime Stage
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled backend bundle and database migration files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Expose backend application port
EXPOSE 3000

# Run production server
CMD ["node", "dist/index.js"]
