FROM node:20-alpine

WORKDIR /app

# Pin pnpm to v9 — last version compatible with Node 20
RUN npm install -g pnpm@9

# Copy lockfiles first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install ALL deps (devDeps needed for the build step)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start"]