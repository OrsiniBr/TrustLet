# Render Deployment Guide

## 🚀 Deploying Gladen Chat DApp to Render

### 1. **Repository Setup**

- Your repo is now configured with `render.yaml` for automatic deployment
- Removed Vercel configuration files (since you're using Render)

### 2. **Environment Variables to Set on Render**

Go to your Render dashboard → Environment tab and add these variables:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gladen-chat?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
PRIVATE_KEY=your-ethereum-private-key-here
```

### 3. **Deployment Configuration**

- **Build Command**: `cd frontend && npm run build`
- **Start Command**: `cd frontend/server && npm start`
- **Node Version**: 18+ (specified in package.json)

### 4. **Common Issues & Solutions**

#### Issue: "Website not showing"

**Solutions:**

1. **Check Build Logs**: Look for build errors in Render dashboard
2. **Environment Variables**: Ensure all required env vars are set
3. **Database Connection**: Verify MongoDB URI is correct
4. **Port Configuration**: Render automatically sets PORT, but we have fallback to 10000

#### Issue: "Build fails"

**Solutions:**

1. **Node Version**: Ensure you're using Node 18+
2. **Dependencies**: Check if all packages install correctly
3. **Build Path**: Verify the build command runs from correct directory

#### Issue: "CORS errors"

**Solutions:**

1. Update CORS origin in `frontend/server/src/index.js`:

```javascript
cors({
  origin: "https://your-app-name.onrender.com", // Your Render URL
  credentials: true,
});
```

### 5. **Testing Deployment**

1. Check Render logs for successful startup
2. Visit your Render URL
3. Test the chat functionality
4. Verify database connections

### 6. **Post-Deployment**

- Update your frontend CORS settings
- Test all features (auth, chat, staking)
- Monitor logs for any runtime errors

## 🔧 Troubleshooting Commands

If deployment fails, check:

```bash
# Test build locally
cd frontend
npm run build

# Test server locally
cd frontend/server
npm start
```

## 📝 Notes

- Render free tier has sleep mode (app sleeps after 15 min of inactivity)
- First request after sleep may be slow (cold start)
- Consider upgrading to paid plan for production use
