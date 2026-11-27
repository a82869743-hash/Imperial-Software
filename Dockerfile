# Imperial ERP: small production image. Data (database, uploads, backups) lives in the /data volume.
FROM node:20-slim
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
WORKDIR /app
COPY package.json package-lock.json ./
# Fail the build if the install did not really work (npm can exit 0 after a crash).
RUN npm ci --omit=dev && node -e "require('express'); require('better-sqlite3')" && npm cache clean --force
COPY server.js ./
COPY public ./public
RUN mkdir -p /data && chown -R node:node /data
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
