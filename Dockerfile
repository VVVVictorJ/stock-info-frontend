# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app

# Enable corepack (pnpm)
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.11.1 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist/ ./

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


