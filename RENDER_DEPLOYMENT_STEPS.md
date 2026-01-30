# 🚀 RENDER.COM DEPLOYMENT GUIDE - ISRAELI 2026 ELECTIONS SURVEY

## ✅ COMPLETED STEPS:
- [x] GitHub Repository Created: https://github.com/yakovganam/israeli-2026-elections-survey
- [x] Code Pushed to GitHub (master branch)
- [x] render.yaml Configuration Added
- [x] .gitignore Updated for Production

## 📋 NEXT STEPS TO DEPLOY ON RENDER.COM:

### STEP 1: Set Up MongoDB Atlas (FREE TIER)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a new Project (name: "Israeli Elections Survey")
4. Create a Free Cluster (M0 - forever free tier)
   - Region: Choose closest to you (or us-east-1)
   - Cluster name: "cluster0"
5. Wait for cluster to deploy (takes ~5-10 minutes)
6. Go to "Database Access" and create a database user:
   - Username: `survey_user`
   - Password: Generate strong password (save it!)
   - Database User Privileges: Atlas admin
7. Go to "Network Access" and add:
   - Allow access from: 0.0.0.0/0 (allow everywhere)
8. Go to "Clusters" → Click "Connect"
9. Choose "Connect your application"
10. Copy the Connection String (should look like):
    ```
    mongodb+srv://survey_user:PASSWORD@cluster0.mongodb.net/surveydb?retryWrites=true&w=majority
    ```
    **Replace PASSWORD with your actual password from Step 6**

### STEP 2: Create Render Web Service
1. Go to https://render.com
2. Sign up with GitHub or email
3. Create a new Web Service:
   - Name: `israeli-2026-elections`
   - Connect your GitHub repository:
     - Repository: `yakovganam/israeli-2026-elections-survey`
     - Branch: `master`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Select **Free**

### STEP 3: Configure Environment Variables
In Render.com dashboard for your service, go to Environment:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://survey_user:PASSWORD@cluster0.mongodb.net/surveydb?retryWrites=true&w=majority
```
Replace PASSWORD with your MongoDB password!

### STEP 4: Deploy
1. Click "Create Web Service" button
2. Render will automatically build and deploy from GitHub
3. Wait for deployment to complete (takes ~3-5 minutes)
4. You'll see a live URL like: `https://israeli-2026-elections.onrender.com`

### STEP 5: Verify Deployment
Test these endpoints:
- Health Check: `https://your-render-url/api/health`
- Frontend: `https://your-render-url/`

## 🔑 IMPORTANT NOTES:

1. **First Load**: The app will create MongoDB collections automatically on first use
2. **Free Tier Limits**:
   - Render: Auto-spins down after 15 min inactivity (takes ~1 min to wake up)
   - MongoDB Atlas: M0 cluster (512 MB storage, perfect for surveys)
3. **Monitoring**: Check Render logs for any errors during deployment
4. **Troubleshooting**: If voting fails, check MongoDB connection string in environment variables

## 📊 TESTING CHECKLIST:

After deployment is live:
- [ ] Vote page loads (check HTML renders correctly)
- [ ] Can select a party and vote
- [ ] Results page shows votes
- [ ] Vote cooldown works (can't vote twice in 24h)
- [ ] Favicon displays correctly

## 🔗 DEPLOYMENT LINKS (After completion):

- **GitHub Repository**: https://github.com/yakovganam/israeli-2026-elections-survey
- **Live Survey URL**: https://israeli-2026-elections.onrender.com
- **MongoDB Atlas Cluster**: https://cloud.mongodb.com (manage data there)
- **Render Dashboard**: https://dashboard.render.com

---

**Last Updated**: 2026-01-30
**Deployment Status**: READY FOR RENDER.COM ✅
