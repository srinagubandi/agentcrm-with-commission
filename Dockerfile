FROM node:24-alpine
WORKDIR /app
COPY *.js *.json *.css ./
ENV NODE_ENV=production DATA_DIR=/data
CMD ["node", "server.js"]
