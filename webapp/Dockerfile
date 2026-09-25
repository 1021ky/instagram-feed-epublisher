# syntax=docker/dockerfile:1

# 1. Base stage
FROM node:24-bookworm-slim AS base
WORKDIR /app
RUN npm install -g pnpm@10.26.0

# 2. Dependencies stage
FROM base AS deps
WORKDIR /app

# pnpm-workspace と lockfile、patch、package.json をコピー
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY patches/ ./patches/
COPY webapp/package.json ./webapp/

# 依存パッケージのインストール（キャッシュ活用）
RUN pnpm install --frozen-lockfile

# 3. Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/webapp/node_modules ./webapp/node_modules
COPY . .

# ビルド実行
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter instagram-feed-epublisher-webapp build

# 4. Runner stage
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Playwright のブラウザとシステム依存ライブラリ、および日本語フォントをインストール
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN apt-get update && \
    apt-get install -y --no-install-recommends fonts-noto-cjk && \
    npx -y playwright@1.63.0 install --with-deps chromium && \
    rm -rf /var/lib/apt/lists/* && \
    chmod -R 777 /ms-playwright

# セキュリティ向上のため非 root ユーザーを作成
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs nextjs

# 静的アセットと standalone 成果物をコピー
COPY --from=builder --chown=nextjs:nodejs /app/webapp/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/webapp/.next/static ./webapp/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/webapp/public* ./webapp/public/

# EPUB 生成に必要なレイアウトテンプレートと html-to-epub テンプレートを確実に配置
COPY --from=builder --chown=nextjs:nodejs /app/book_layout ./book_layout
COPY --from=builder --chown=nextjs:nodejs /app/webapp/node_modules/@lesjoursfr/html-to-epub/templates ./webapp/node_modules/@lesjoursfr/html-to-epub/templates
COPY --from=builder --chown=nextjs:nodejs /app/webapp/node_modules/@lesjoursfr/html-to-epub/templates ./node_modules/@lesjoursfr/html-to-epub/templates

USER nextjs

EXPOSE 8080

CMD ["node", "webapp/server.js"]
