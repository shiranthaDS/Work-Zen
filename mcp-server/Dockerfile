# MCP Server Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# MCP Server runs on stdio, no port exposure needed
# It will be started by the backend service

CMD ["node", "index.js"]
