# Git Repository Cleanup & Deployment Guide

## 🚨 Problem: GitHub has unnecessary files that might conflict with improved local code

## 🎯 **Solution 1: Clean Merge Strategy (Recommended)**

### Step 1: Backup Your Current Working Code
```bash
# Create a backup of your current working directory
cp -r . ../CollabAI-backup
# or on Windows
xcopy . ..\CollabAI-backup /E /I
```

### Step 2: Create .gitignore for Unnecessary Files
```bash
# Add to .gitignore to prevent future issues
echo "# Dependencies
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

# Cache
.cache/
.parcel-cache/

# Temporary files
*.tmp
*.temp

# Old deployment configs (if not needed)
# render.yaml
# vercel.json (keep if still using Vercel)" > .gitignore
```

### Step 3: Clean Local Repository
```bash
# Remove unnecessary files locally first
rm -rf node_modules
rm -rf .next
rm -rf dist
rm -rf build

# Remove any old config files you don't need
# rm old-config-file.js
# rm unnecessary-folder/
```

### Step 4: Selective Git Operations
```bash
# Add only the files you want to keep/update
git add frontend/
git add backend/
git add .gitignore
git add DEPLOYMENT_GUIDE.md
git add GIT_CLEANUP_GUIDE.md

# Commit your improvements
git commit -m "feat: Production-ready video call system with optimizations

- Enhanced WebRTC with multiple STUN servers
- Production-ready Socket.IO configuration
- GDPR-compliant features
- Improved error handling and reconnection
- Production environment templates
- Updated CORS for production deployment"

# Push to a new branch first to avoid conflicts
git checkout -b production-ready
git push origin production-ready
```

### Step 5: Create Pull Request
- Create a PR from `production-ready` to `main`
- Review changes carefully
- Merge when ready

## 🎯 **Solution 2: Fresh Start Strategy (If too many conflicts)**

### Option A: New Repository
```bash
# Create a new repository on GitHub
# Clone it locally
git clone https://github.com/yourusername/CollabAI-v2.git
cd CollabAI-v2

# Copy your good files
cp -r ../CollabAI/frontend .
cp -r ../CollabAI/backend .
cp ../CollabAI/DEPLOYMENT_GUIDE.md .
cp ../CollabAI/.gitignore .

# Initial commit
git add .
git commit -m "Initial commit: Production-ready CollabAI"
git push origin main
```

### Option B: Force Replace (Dangerous - Use with caution)
```bash
# Only if you're sure you want to replace everything
git checkout main
git reset --hard HEAD~10  # Go back 10 commits (adjust as needed)
# Then add your new files and commit
```

## 🎯 **Solution 3: Selective File Management**

### Identify and Remove Unnecessary Files
```bash
# List all files to identify unnecessary ones
find . -name "*.log" -delete
find . -name "node_modules" -exec rm -rf {} +
find . -name ".next" -exec rm -rf {} +

# Remove specific unnecessary files
git rm --cached unnecessary-file.js
git rm -r --cached unnecessary-folder/
```

## 🚀 **Deployment Strategy for Render + Vercel**

### For Render (Backend)
1. **Update render.yaml** (if exists):
```yaml
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
      - key: FRONTEND_URL
        value: https://your-vercel-app.vercel.app
```

2. **Environment Variables in Render:**
   - Copy from `backend/.env.production`
   - Update `FRONTEND_URL` with your Vercel domain

### For Vercel (Frontend)
1. **Update vercel.json** (if exists):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SOCKET_URL": "https://your-render-app.onrender.com"
  }
}
```

2. **Environment Variables in Vercel:**
   - Copy from `frontend/.env.production`
   - Update `NEXT_PUBLIC_SOCKET_URL` with your Render domain

## 🔧 **Pre-Deployment Checklist**

### Before Pushing to GitHub:
- [ ] Remove all `node_modules` folders
- [ ] Remove all `.next` and `dist` folders
- [ ] Update `.gitignore` file
- [ ] Check environment variables are not committed
- [ ] Test locally one more time
- [ ] Create backup of working code

### After Pushing to GitHub:
- [ ] Update Render environment variables
- [ ] Update Vercel environment variables
- [ ] Test deployment on staging first
- [ ] Monitor logs for any issues
- [ ] Test video calls in production

## 🚨 **Emergency Rollback Plan**

If deployment fails:
```bash
# Rollback to previous working commit
git log --oneline  # Find the last working commit hash
git checkout <commit-hash>
git checkout -b emergency-rollback
git push origin emergency-rollback

# Then redeploy from this branch
```

## 📝 **Recommended Approach**

**For your situation, I recommend Solution 1 (Clean Merge Strategy):**

1. ✅ Backup your current working code
2. ✅ Create a new branch `production-ready`
3. ✅ Add only necessary files
4. ✅ Create PR for review
5. ✅ Update deployment environment variables
6. ✅ Test thoroughly before merging

This approach:
- ✅ Preserves your working code
- ✅ Allows for easy rollback
- ✅ Maintains git history
- ✅ Prevents merge conflicts
- ✅ Enables gradual deployment
