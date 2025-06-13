# 🚀 Quick Production Deployment Guide

## 🎯 **1-Click Deploy Links**

### **Frontend (Vercel)**
1. **Go to**: https://vercel.com/new
2. **Import**: Your GitHub repository
3. **Root Directory**: `frontend`
4. **Framework**: Next.js (auto-detected)

### **Backend (Railway)**
1. **Go to**: https://railway.app/new
2. **Deploy from GitHub**: Select your repository
3. **Root Directory**: `backend`
4. **Framework**: Node.js (auto-detected)

## ⚡ **Environment Variables**

### **Frontend (Vercel)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://alkkrjkoyxlbwtkyklde.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa2tyamtveXhsYnd0a3lrbGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5Mzg4NzUsImV4cCI6MjA0OTUxNDg3NX0.LVh3jHK_2KiyOGMUSWUrmY6Ml8UVG2UxWUqKiL4GnxA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa2tyamtveXhsYnd0a3lrbGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzkzODg3NSwiZXhwIjoyMDQ5NTE0ODc1fQ.vC9NMCi2_3k4LEPVE0nLhT_OB-Zm4MFXxOTM9JHrNWA
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=https://your-app.vercel.app
GEMINI_API_KEY=AIzaSyBLGKtVljNniQrg8a-aSm7waYHSwuvsMTo
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
```

### **Backend (Railway)**
```env
PORT=3001
SUPABASE_URL=https://alkkrjkoyxlbwtkyklde.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa2tyamtveXhsYnd0a3lrbGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5Mzg4NzUsImV4cCI6MjA0OTUxNDg3NX0.LVh3jHK_2KiyOGMUSWUrmY6Ml8UVG2UxWUqKiL4GnxA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa2tyamtveXhsYnd0a3lrbGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzkzODg3NSwiZXhwIjoyMDQ5NTE0ODc1fQ.vC9NMCi2_3k4LEPVE0nLhT_OB-Zm4MFXxOTM9JHrNWA
NODE_ENV=production
```

## 🔄 **Deployment Steps**

### **Step 1: Deploy Backend First**
1. Go to Railway and deploy backend
2. Copy the Railway URL (e.g., `https://backend-production-xxxx.railway.app`)

### **Step 2: Deploy Frontend**
1. Go to Vercel and deploy frontend
2. Set `NEXT_PUBLIC_BACKEND_URL` to your Railway URL
3. Set `NEXTAUTH_URL` to your Vercel URL

### **Step 3: Update Supabase**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

## ✅ **Test Production**

1. **Visit your Vercel URL**
2. **Test Authentication**:
   - Sign up with email
   - Sign in with email
   - Test Google OAuth
3. **Test Video Calling**:
   - Create a meeting
   - Share the meeting link
   - Test video call functionality

## 🎉 **You're Live!**

Your CollabAI app is now running in production! 

**Share meeting links and start collaborating!** 🚀

---

### **Need Help?**
- Check logs in Vercel/Railway dashboards
- Verify environment variables are set correctly
- Ensure Supabase URLs are updated
- Test authentication flow first
