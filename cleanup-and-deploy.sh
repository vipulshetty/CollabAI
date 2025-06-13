#!/bin/bash

echo "🧹 Starting CollabAI Repository Cleanup..."

# Create backup first
echo "📦 Creating backup..."
cp -r . ../CollabAI-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "Backup creation failed, continuing..."

# Remove old duplicate files and folders
echo "🗑️ Removing old duplicate files..."

# Remove old root-level files that should be in frontend/
rm -f ./app/layout.tsx 2>/dev/null
rm -rf ./app 2>/dev/null
rm -rf ./components 2>/dev/null
rm -f ./Procfile 2>/dev/null

# Remove node_modules and build artifacts
echo "🗑️ Removing build artifacts..."
rm -rf ./frontend/node_modules 2>/dev/null
rm -rf ./backend/node_modules 2>/dev/null
rm -rf ./frontend/.next 2>/dev/null
rm -rf ./backend/dist 2>/dev/null

# Remove old deployment configs that might conflict
echo "🗑️ Removing old deployment configs..."
rm -f ./frontend/Procfile 2>/dev/null
rm -f ./frontend/netlify.toml 2>/dev/null
rm -f ./frontend/railway.json 2>/dev/null
rm -f ./frontend/nixpacks.toml 2>/dev/null
rm -f ./backend/railway.json 2>/dev/null
rm -f ./backend/vercel.json 2>/dev/null

# Remove duplicate config files
rm -f ./frontend/next.config.js 2>/dev/null  # Keep only next.config.ts

# Create proper .gitignore
echo "📝 Creating comprehensive .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
.next/
out/
dist/
build/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Cache
.cache/
.parcel-cache/
.eslintcache

# Temporary files
*.tmp
*.temp

# Testing
coverage/

# Misc
*.tgz
*.tar.gz

# Local development
.vercel
.railway

# Backup files
*-backup-*
EOF

# Create deployment-ready package.json for root (if needed)
echo "📝 Creating root package.json for deployment..."
cat > package.json << 'EOF'
{
  "name": "collab-ai",
  "version": "1.0.0",
  "description": "AI-powered video collaboration platform with GDPR compliance",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "start": "npm run start:backend",
    "start:frontend": "cd frontend && npm start",
    "start:backend": "cd backend && npm start",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install"
  },
  "keywords": ["video-call", "collaboration", "ai", "gdpr", "webrtc"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

# Update frontend vercel.json for proper deployment
echo "📝 Creating optimized Vercel config..."
cat > frontend/vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
EOF

# Create Render config for backend
echo "📝 Creating Render config..."
cat > backend/render.yaml << 'EOF'
services:
  - type: web
    name: collab-ai-backend
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
    healthCheckPath: /health
EOF

# Create health check endpoint for backend
echo "📝 Adding health check endpoint..."
cat > backend/src/health.ts << 'EOF'
import { Request, Response } from 'express';

export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'collab-ai-backend',
    version: '1.0.0'
  });
};
EOF

echo "✅ Cleanup completed!"
echo ""
echo "🚀 Next steps:"
echo "1. Review the changes"
echo "2. Test locally: npm run dev"
echo "3. Commit changes: git add . && git commit -m 'cleanup: Prepare for production deployment'"
echo "4. Push to GitHub: git push origin main"
echo "5. Deploy frontend to Vercel"
echo "6. Deploy backend to Render"
echo ""
echo "📁 File structure is now clean and deployment-ready!"
EOF
