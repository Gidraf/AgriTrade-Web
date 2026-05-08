# Use a lightweight Node image for production
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy the rest of the project
COPY . .

# Build the project (if using Next.js or similar)
RUN pnpm run build

# Expose production port
EXPOSE 3070

# Default command for production
CMD ["pnpm", "run", "start"]
