# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# Set environment variable for build time
ENV VITE_API_URL=http://localhost:3001/api
RUN npm run build

# Production stage using Nginx
FROM nginx:alpine

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
