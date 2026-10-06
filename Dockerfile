# syntax=docker/dockerfile:1
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data

WORKDIR /app

# App files belong to root and are read-only for the user the server runs as.
COPY package.json server.js publish.js ./
COPY src ./src
COPY public ./public
COPY admin ./admin
COPY views ./views
COPY seed ./seed
COPY scripts ./scripts
COPY engine ./engine

# The only writable place: the edition and its history.
RUN mkdir -p /data && chown node:node /data && chmod 700 /data

USER node
EXPOSE 8080
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

CMD ["node", "server.js"]
