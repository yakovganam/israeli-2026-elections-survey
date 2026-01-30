# 🚀 Render.com Deployment - Full Guide

## Prerequisites

- [ ] GitHub account (with yakovganam/israeli-2026-elections-survey repository)
- [ ] Render.com account (free, sign up at https://render.com)
- [ ] MongoDB Atlas account (free tier at https://www.mongodb.com/cloud/atlas)

---

## Step 1: Create MongoDB Atlas Database

### 1a. Sign up for MongoDB Atlas
- Go to: https://www.mongodb.com/cloud/atlas
- Sign up with email
- Create organization
- Create project: "survey"

### 1b. Create Cluster
- Click "Build a Cluster"
- Choose FREE (M0)
- Provider: AWS
- Region: eu-west-1 (Europe) or closest to you
- Cluster Name: `cluster0`
- Click "Create Cluster"
- Wait 1-3 minutes

### 1c. Create Database User
1. Go to "Database Access"
2. Add Database User:
   - Username: `survey_user`
   - Password: Generate secure password
   - Privileges: Read and write to any database
3. Click "Add User"

### 1d. Create Database
1. Go to "Databases"
2. Click "Browse Collections"
3. Create Database:
   - Database name: `surveydb`
   - Collection name: `surveys`
4. Click "Create"

### 1e: Copy Connection String
1. Go to "Databases" → "Cluster0"
2. Click "Connect" button
3. Choose "Drivers" → "Node.js"
4. Copy connection string
5. Format: `mongodb+srv://survey_user:PASSWORD@cluster0.mongodb.net/surveydb?retryWrites=true&w=majority`
6. **Important:** Replace `PASSWORD` with your actual password!

---

## Step 2: Deploy on Render.com

### Option A: Automatic Blueprint (RECOMMENDED) ⭐

1. Go to: https://dashboard.render.com/blueprints/github
2. Click "Connect GitHub"
3. Authorize Render with your GitHub account
4. Search for: `israeli-2026-elections-survey`
5. Click "Select Repository"
6. Click "Create New Blueprint Instance"
7. Render will read `render.yaml` automatically
8. In environment variables section:
   - MongoDB URI is pre-configured ✅
9. Click "Create Resources"
10. Wait 3-5 minutes

### Option B: Manual Web Service

1. Go to: https://dashboard.render.com/new/web
2. Click "Build and deploy from GitHub"
3. Search for: `israeli-2026-elections-survey`
4. Click "Connect"
5. Configure service:
   - **Name:** `israeli-2026-elections`
   - **Environment:** Node
   - **Region:** Frankfurt (eu-west-1) recommended
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Click "Advanced"
7. Add Environment Variables:
   - **Key:** `NODE_ENV`
   - **Value:** `production`
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://survey_user:PASSWORD@cluster0.mongodb.net/surveydb?retryWrites=true&w=majority`
8. Choose plan: **Free** (this is fine)
9. Click "Create Web Service"
10. Wait 5-10 minutes for build and deployment

---

## Step 3: Verify Deployment

### Check Build Status:
1. Go to your Render dashboard
2. Click on "israeli-2026-elections"
3. Watch "Build & Deploy" logs
4. Should say "✓ Build succeeded"
5. Should say "✓ Running"

### Get Your Live URL:
- Your site will be available at:
  ```
  https://israeli-2026-elections.onrender.com
  ```

### Test the Site:
1. Open URL in browser
2. Should see purple/pink gradient hero
3. "התחל סקר עכשיו" button should work
4. Dark mode toggle (moon icon) should switch themes
5. Click through survey
6. Check results.html

---

## Step 4: Monitor and Maintain

### View Logs:
- Render Dashboard → Your Service → Logs
- Shows real-time server output
- Check for errors

### Update Code:
- Push to GitHub `master` branch
- Render auto-redeploys within 1-2 minutes
- No manual deployment needed!

### Scale Up (if needed):
- Go to Service Settings
- Change plan from Free to Starter ($7/month)
- Gets more resources and custom domain

---

## Troubleshooting

### Build Failed?
1. Check "Build & Deploy" logs for errors
2. Most common: Missing environment variables
3. Verify MongoDB URI is correct
4. Check package.json and render.yaml

### Site Not Loading?
1. Wait 2-3 minutes (first deployment takes time)
2. Check if MongoDB connection is working
3. Look at Render logs for server errors
4. Try hard refresh (Ctrl+Shift+R)

### MongoDB Connection Error?
1. Verify MongoDB URI in Render environment variables
2. Check MongoDB Atlas "Network Access" - IP whitelist
3. For Render: Whitelist all IPs (0.0.0.0/0) or Render's IPs
4. Check database username/password

### Dark Mode Not Working?
- This is CSS/JS only feature
- Should work automatically
- Check browser console for JavaScript errors

---

## After Deployment ✅

1. **Share the Link:**
   ```
   https://israeli-2026-elections.onrender.com
   ```

2. **Promote on Social:**
   - Twitter/X
   - WhatsApp groups
   - Telegram channels
   - Facebook

3. **Monitor Results:**
   - Check results.html page
   - See real-time vote distribution
   - Track mandate calculations

4. **Collect Data:**
   - API at: `https://israeli-2026-elections.onrender.com/api`
   - Submit surveys
   - Get results

---

## Useful Links

- **GitHub Repo:** https://github.com/yakovganam/israeli-2026-elections-survey
- **Render Dashboard:** https://dashboard.render.com
- **MongoDB Atlas:** https://cloud.mongodb.com
- **API Documentation:** Check backend/server.js in repo

---

## Support

If something breaks:
1. Check Render logs (most helpful)
2. Check MongoDB connection
3. Verify environment variables
4. Try redeploying from GitHub
5. Contact support@render.com

---

**You got this!** 🚀 Good luck with your survey!

*Last Updated: 2026-01-30*