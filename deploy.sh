#!/bin/bash

# ============================================================
# 🚀 INTERACTIVE DEPLOYMENT SCRIPT (SAFE MONGO)
# ============================================================

# 1. DETECT VPS IP
VPS_IP=$(curl -s ifconfig.me)
echo "----------------------------------------------------"
echo "🌍 VPS IP DETECTED: $VPS_IP"
echo "----------------------------------------------------"

# 2. GENERATE DOCKER-COMPOSE.YML (Always update config to be safe)
#    We do this silently so the script looks clean.
cat > docker-compose.yml <<EOF
version: '3.8'

services:
  mongo:
    image: mongo:latest
    container_name: resume_db
    restart: always
    ports:
      - "27099:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./IP-Backend
    container_name: resume_backend
    restart: always
    ports:
      - "9091:8080"
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      - mongo
    environment:
      - MONGO_URI=mongodb://mongo:27017/resume_db
      - PORT=8080
      - UPLOAD_DIR=/app/uploads
      - JWT_SECRET=auto_secret_key_123
      - APP_CORS_ALLOWED_ORIGINS=http://localhost:9090,http://$VPS_IP:9090
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=465
      - SMTP_USERNAME=your_email@gmail.com
      - SMTP_PASSWORD=your_app_password
      - MAIL_FROM_EMAIL=your_email@gmail.com
      - MAIL_SENDER_NAME=RecruitAI_HR
      - HR_EMAIL=hr@example.com

  frontend:
    build: ./IP-Frontend
    container_name: resume_frontend
    restart: always
    ports:
      - "9090:80"
    depends_on:
      - backend

volumes:
  mongo_data:
  uploads_data:
EOF

# 3. REFRESH FRONTEND ENV (To ensure IP is correct)
echo "VITE_API_BASE_URL=/api" > ./IP-Frontend/.env

# 4. SHOW MENU
echo "Select deployment option:"
echo "1) ⚛️  Redeploy FRONTEND only (Keep Backend & Mongo running)"
echo "2) ☕  Redeploy BACKEND only (Keep Frontend & Mongo running)"
echo "3) 🚀  Redeploy BOTH (Frontend + Backend)"
echo "----------------------------------------------------"
read -p "Enter your choice (1, 2, or 3): " choice

# Define Docker Command (Handles v1 and v2)
if docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
else
    DOCKER_CMD="docker-compose"
fi

echo ""

case $choice in
    1)
        echo "🔄 Rebuilding FRONTEND only..."
        $DOCKER_CMD stop frontend
        $DOCKER_CMD rm -f frontend
        $DOCKER_CMD up -d --build frontend
        ;;
    2)
        echo "🔄 Rebuilding BACKEND only..."
        $DOCKER_CMD stop backend
        $DOCKER_CMD rm -f backend
        $DOCKER_CMD up -d --build backend
        ;;
    3)
        echo "🔄 Rebuilding BOTH Frontend & Backend..."
        $DOCKER_CMD stop frontend backend
        $DOCKER_CMD rm -f frontend backend
        $DOCKER_CMD up -d --build frontend backend
        # Ensure mongo is running just in case, but don't rebuild it
        $DOCKER_CMD up -d mongo 
        ;;
    *)
        echo "❌ Invalid option selected."
        exit 1
        ;;
esac

# 5. CLEANUP (Improvement)
# Removes old "dangling" images to save space on your VPS
echo "🧹 Cleaning up old Docker images..."
docker image prune -f > /dev/null 2>&1

echo ""
echo "✅ DEPLOYMENT FINISHED!"
echo "👉 Frontend: http://$VPS_IP:9090"
echo "👉 Backend:  http://$VPS_IP:9091"