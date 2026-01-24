# =======================================
# Stage 1: Build the React App
# =======================================
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the project (creates dist/ folder)
RUN npm run build

# =======================================
# Stage 2: Serve with Nginx
# =======================================
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy the build output from Stage 1
COPY --from=build /app/dist .

# Copy our custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]