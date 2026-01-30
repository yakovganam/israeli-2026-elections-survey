# 🚀 Deployment Guide - Israeli Elections Survey Website

## Quick Start (5 minutes)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd סקרים

# 2. Configure environment
cp .env.example .env
# Edit .env with MongoDB URI and other settings

# 3. Start services
docker compose up -d --build

# 4. Verify
curl http://localhost:3000/api/health

# 5. Visit website
# Open http://localhost:3000 in browser
```

### Option 2: Local Node.js

```bash
# 1. Install dependencies
npm install
cd backend && npm install

# 2. Configure environment
cp .env.example .env
export $(cat .env | xargs)

# 3. Start server
npm start

# 4. Server runs on http://localhost:3000
```

### Option 3: Cloud Deployment (Render.com)

```bash
# 1. Push to GitHub
git push origin master

# 2. Create Render service (see below for detailed steps)

# 3. Configure environment variables in Render dashboard

# 4. Service auto-deploys on push
```

---

## Prerequisites

### Required
- Node.js 18+ (for local development)
- Docker & Docker Compose (for containerized deployment)
- Git
- MongoDB Atlas account (free tier available at mongodb.com)

### Optional
- Render.com account (cloud deployment)
- Cloudflare account (DNS/CDN)
- Postman (API testing)

---

## Database Setup

### MongoDB Atlas (Cloud - Recommended)

1. Go to mongodb.com → Create account
2. Create free cluster (M0)
3. Create database user with password
4. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/surveydb
   ```
5. Add your IP to whitelist
6. Use connection string in `.env`

### MongoDB Local (Docker)

```yaml
# In docker-compose.yml, add:
services:
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

---

## Environment Configuration

### .env File Template

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/surveydb

# Security
IP_SALT=your-unique-salt-generate-with-openssl-rand-hex

# CORS
ALLOWED_ORIGIN=http://localhost:3000

# Optional: Analytics
ANALYTICS_ENABLED=false
```

### Generate IP_SALT (Linux/Mac)

```bash
openssl rand -hex 32
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
```

### Generate IP_SALT (Windows PowerShell)

```powershell
-join ((0..31 | % {'{0:X}' -f (Get-Random -Maximum 16)}) + (Get-Random -Maximum 256) * 2)
```

---

## Docker Deployment

### Build and Run

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# Check logs
docker compose logs -f

# Stop services
docker compose down

# Remove volumes
docker compose down -v
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      MONGODB_URI: ${MONGODB_URI}
      PORT: 3000
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASS}
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

---

## Render.com Cloud Deployment

### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git add -A
git commit -m "Ready for cloud deployment"
git push origin master
```

### Step 2: Create Render Service

1. Go to render.com dashboard
2. Click "+ New" → "Web Service"
3. Connect GitHub repository
4. Select branch: `master`
5. Configure:
   - **Name**: survey-website-backend
   - **Environment**: Node
   - **Region**: Closest to users
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Add Environment Variables

In Render dashboard:
1. Go to Environment
2. Add variables:
   ```
   NODE_ENV = production
   MONGODB_URI = mongodb+srv://...
   IP_SALT = (copy from .env)
   PORT = 3000
   ALLOWED_ORIGIN = https://yourdomain.com
   ```

### Step 4: Deploy

```bash
# Push to trigger auto-deployment
git push origin master

# Monitor in Render dashboard
# Deployment takes 2-3 minutes
# Once successful, service will be live
```

### Render Service URL

Once deployed, your service will be available at:
```
https://survey-website-backend.render.com
```

---

## DNS & Domain Setup

### Option 1: Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Update domain nameservers at registrar
3. Create DNS records:
   ```
   Type: CNAME
   Name: survey
   Target: survey-website-backend.render.com
   TTL: Auto
   ```
4. Enable SSL (Flexible or Full)

### Option 2: Direct DNS

```
Type: CNAME
Name: survey
Value: survey-website-backend.render.com
TTL: 3600
```

Wait 15-30 minutes for DNS propagation:
```bash
nslookup survey.yourdomain.com
```

---

## SSL/TLS Certificate

### Render.com (Automatic)
- Automatically provides free SSL certificate
- HTTPS enabled by default
- Auto-renewal included

### Self-Hosted (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d survey.yourdomain.com

# Configure in Nginx
ssl_certificate /etc/letsencrypt/live/survey.yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/survey.yourdomain.com/privkey.pem;

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Testing Deployment

### Health Check

```bash
curl https://yourdomain.com/api/health

# Expected response:
{
  "status": "ok",
  "mongoState": 1,
  "mongoStatus": "connected",
  "timestamp": "2026-01-29T12:00:00Z"
}
```

### Create Test Vote

```bash
curl -X POST https://yourdomain.com/api/surveys/1/responses \
  -H "Content-Type: application/json" \
  -d '{
    "answers": ["likud"],
    "metadata": {
      "sessionToken": "test_session",
      "clientIP": "203.0.113.42",
      "timestamp": "2026-01-29T12:00:00Z"
    }
  }'

# Expected response:
{
  "message": "Response submitted successfully",
  "votesTotal": 1
}
```

### Get Results

```bash
curl https://yourdomain.com/api/surveys/1/results

# Should show aggregated results
```

---

## Monitoring & Logs

### Docker Logs

```bash
# Real-time logs
docker compose logs -f web

# Last 100 lines
docker compose logs --tail=100

# Logs from specific time
docker compose logs --since 10m

# Timestamp included
docker compose logs -t
```

### Render Logs

1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. View real-time logs
5. Search by timestamp

### Application Health

```bash
# Check every 30 seconds
watch -n 30 'curl -s https://yourdomain.com/api/health | jq .'

# Monitor vote count
watch -n 60 'curl -s https://yourdomain.com/api/surveys/1/results | jq .totalResponses'
```

---

## Backup & Recovery

### MongoDB Backup

```bash
# Create backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/surveydb" \
          --out=./backup_$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/surveydb" \
             ./backup_20260129
```

### Docker Volume Backup

```bash
# Backup MongoDB volume
docker compose exec mongo mongodump --out /backup

# Create archive
docker compose exec mongo tar -czf backup.tar.gz /backup

# Copy to host
docker compose cp mongo:backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```

---

## Scaling & Performance

### Horizontal Scaling (Multiple Instances)

```yaml
# Use load balancer (Nginx)
upstream backend {
  server web1:3000;
  server web2:3000;
  server web3:3000;
}

server {
  listen 80;
  location / {
    proxy_pass http://backend;
  }
}
```

### Database Optimization

```javascript
// Add indexes for faster queries
db.surveys.createIndex({ "_id": 1 });
db.surveys.createIndex({ "responses.ipHash": 1 });
```

### Cache Configuration

```javascript
// Add Redis for session caching
const redis = require('redis');
const client = redis.createClient();

app.use(session({
  store: new RedisStore({ client }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true }
}));
```

---

## Troubleshooting

### Port Already in Use

```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017

Solution:
1. Verify MongoDB is running: docker compose ps
2. Check MONGODB_URI in .env
3. Test connection: mongo "mongodb+srv://..."
4. Whitelist your IP in MongoDB Atlas
```

### CORS Errors in Browser

```
Error: Access to XMLHttpRequest blocked by CORS

Solution:
1. Check ALLOWED_ORIGIN in .env
2. Verify it matches request origin
3. Add to CORS whitelist:
   app.use(cors({
     origin: process.env.ALLOWED_ORIGIN
   }));
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# If too high:
1. Reduce connection pool size
2. Enable garbage collection
3. Use clustering for Node.js
4. Increase container memory limit
```

---

## Security Hardening

### Production Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS whitelist
- [ ] Enable rate limiting
- [ ] Set secure cookie flags
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Set up monitoring/alerts
- [ ] Enable audit logging
- [ ] Regular security updates

### Rate Limiting Example

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

---

## Continuous Integration/Deployment

### GitHub Actions Workflow

```yaml
name: Deploy
on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Deploy to Render
        env:
          RENDER_DEPLOY_HOOK: ${{ secrets.RENDER_DEPLOY_HOOK }}
        run: curl $RENDER_DEPLOY_HOOK
```

---

## Support & Resources

- MongoDB Docs: https://docs.mongodb.com
- Express.js Docs: https://expressjs.com
- Docker Docs: https://docs.docker.com
- Render Docs: https://render.com/docs
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices

---

**🎉 Deployment Ready!**

*For issues, check logs and verify environment variables.*
*All code is documented and ready for production.*
