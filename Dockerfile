FROM node:lts-alpine AS build
WORKDIR /app
COPY . .
RUN corepack enable
RUN pnpm install
RUN pnpm build
RUN pnpm dlx prisma migrate dev --name init
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "dlx", "tsx", "backend/index.ts"]