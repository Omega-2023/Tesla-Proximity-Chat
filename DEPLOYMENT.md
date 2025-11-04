# 🚀 Deployment Guide

This guide will help you deploy the Tesla Proximity Chat application to production.

## Architecture Overview

The application consists of two parts:
1. **Frontend**: Next.js app (deploy to Vercel)
2. **Backend**: Socket.io server (deploy to Render, Railway, or Heroku)

## Option 1: Deploy to Vercel (Frontend) + Render (Backend) - Recommended

### Frontend Deployment (Vercel)

1. **Push your code to GitHub** (already done ✅)

2. **Go to [Vercel](https://vercel.com)**
   - Sign up/login with your GitHub account
   - Click "New Project"
   - Import your repository: `Omega-2023/Tesla-Proximity-Chat`

3. **Configure Environment Variables**
   - Add environment variable:
     - `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend-url.onrender.com` (or your backend URL)
   - Leave other settings as default

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your frontend will be live at: `https://your-app.vercel.app`

### Backend Deployment (Render)

1. **Go to [Render](https://render.com)**
   - Sign up/login with your GitHub account
   - Click "New +" → "Web Service"
   - Connect your repository: `Omega-2023/Tesla-Proximity-Chat`

2. **Configure Backend Service**
   - **Name**: `tesla-proximity-chat-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Environment**: `Node`
   - **Build Command**: Leave blank (no build needed)
   - **Start Command**: `node server/index.js`

3. **Environment Variables**
   - `PORT`: `3001` (or let Render auto-assign)
   - `NODE_ENV`: `production`
   - `NEXT_PUBLIC_CLIENT_URL`: `https://your-app.vercel.app` (your Vercel frontend URL)

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Your backend will be live at: `https://your-backend.onrender.com`

5. **Update Frontend Environment Variable**
   - Go back to Vercel
   - Update `NEXT_PUBLIC_SOCKET_URL` to your Render backend URL
   - Redeploy the frontend

### CORS Configuration

The backend is already configured to accept CORS from your frontend. Make sure:
- `NEXT_PUBLIC_CLIENT_URL` in backend matches your frontend URL
- `NEXT_PUBLIC_SOCKET_URL` in frontend matches your backend URL

---

## Option 2: Deploy to Railway (Alternative)

### Frontend + Backend on Railway

1. **Go to [Railway](https://railway.app)**
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Deploy Backend First**
   - Create a new service for the backend
   - Set root directory to: `/` (root)
   - Set start command: `node server/index.js`
   - Add environment variables:
     - `PORT`: `3001`
     - `NEXT_PUBLIC_CLIENT_URL`: (will update after frontend deploys)

3. **Deploy Frontend**
   - Create another service for the frontend
   - Railway will auto-detect Next.js
   - Add environment variable:
     - `NEXT_PUBLIC_SOCKET_URL`: (your backend Railway URL)

4. **Update URLs**
   - Update `NEXT_PUBLIC_CLIENT_URL` in backend with frontend URL
   - Update `NEXT_PUBLIC_SOCKET_URL` in frontend with backend URL
   - Redeploy both services

---

## Option 3: Deploy Backend to Heroku

### Backend on Heroku

1. **Install Heroku CLI** (if not installed)
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create tesla-proximity-chat-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set PORT=3001
   heroku config:set NODE_ENV=production
   heroku config:set NEXT_PUBLIC_CLIENT_URL=https://your-app.vercel.app
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Update Frontend**
   - Get your Heroku app URL: `https://tesla-proximity-chat-backend.herokuapp.com`
   - Update `NEXT_PUBLIC_SOCKET_URL` in Vercel with this URL

---

## Quick Deployment Scripts

### For Vercel (Frontend)
```bash
npm i -g vercel
vercel
# Follow the prompts
# Add environment variable: NEXT_PUBLIC_SOCKET_URL
```

### For Render (Backend)
1. Use the `render.yaml` file in the repository
2. Render will auto-detect and configure

---

## Environment Variables Summary

### Frontend (Vercel)
- `NEXT_PUBLIC_SOCKET_URL` - Your backend URL (e.g., `https://your-backend.onrender.com`)

### Backend (Render/Railway/Heroku)
- `PORT` - Server port (usually auto-assigned, default: 3001)
- `NODE_ENV` - Set to `production`
- `NEXT_PUBLIC_CLIENT_URL` - Your frontend URL (e.g., `https://your-app.vercel.app`)

---

## Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend environment variable points to backend
- [ ] Backend CORS allows frontend domain
- [ ] Test connection between frontend and backend
- [ ] Test GPS location sharing
- [ ] Test messaging between users
- [ ] Verify speed lock works

---

## Troubleshooting

### Connection Issues
- Check that `NEXT_PUBLIC_SOCKET_URL` matches your backend URL exactly
- Verify CORS settings in `server/index.js`
- Check browser console for connection errors

### Backend Not Starting
- Ensure `startCommand` is correct: `node server/index.js`
- Check server logs in your hosting platform
- Verify all dependencies are in `package.json`

### CORS Errors
- Update `NEXT_PUBLIC_CLIENT_URL` in backend environment variables
- Make sure frontend URL is allowed in CORS configuration

---

## Free Tier Limitations

### Render
- Free tier spins down after 15 minutes of inactivity
- Cold starts may take 30-60 seconds
- Consider upgrading for production use

### Vercel
- Excellent free tier
- No cold starts for Next.js
- Perfect for frontend hosting

### Railway
- $5/month credit
- Better for always-on services
- No cold starts

---

## Recommended Production Setup

For a production-ready setup:
1. **Frontend**: Vercel (excellent Next.js support)
2. **Backend**: Railway or Heroku (always-on, no cold starts)
3. **Database**: Add Redis for scaling (future enhancement)
4. **Monitoring**: Add error tracking (Sentry, LogRocket)

---

## Need Help?

- Check the main [README.md](./README.md) for setup instructions
- Review server logs in your hosting platform
- Test locally first before deploying
