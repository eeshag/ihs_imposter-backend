# Render Deployment Instructions

## Prerequisites
1. A GitHub account
2. Your code pushed to a GitHub repository
3. A Render account (sign up at https://render.com)

## Step 1: Push Your Code to GitHub

If you haven't already, push your backend code to GitHub:

```bash
cd backend
git init  # if not already a git repo
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Step 2: Deploy to Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Sign in or create an account

2. **Create a New Web Service**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your backend

3. **Configure the Service**
   - **Name**: `ihs-imposter-backend` (or any name you prefer)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend` (important!)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Environment Variables**
   Click "Advanced" and add these environment variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render automatically sets this, but good to have)
   - `ALLOWED_ORIGINS` = `https://your-frontend-url.onrender.com,http://localhost:3000`
     - Replace `your-frontend-url.onrender.com` with your actual frontend URL
     - You can add multiple origins separated by commas

5. **Click "Create Web Service"**
   - Render will start building and deploying your service
   - This may take a few minutes

## Step 3: Get Your Backend URL

Once deployed, Render will provide you with a URL like:
- `https://ihs-imposter-backend.onrender.com`

**Important**: Note this URL down - you'll need it for your frontend!

## Step 4: Update Frontend to Use Backend URL

In your frontend code, update `src/utils/gameStore.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.onrender.com/api';
```

Or create a `.env` file in your frontend root:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

## Step 5: Deploy Frontend (Optional)

If you also want to deploy your frontend to Render:

1. Create a new Static Site in Render
2. Connect your GitHub repo
3. Set:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-backend-url.onrender.com/api`

## Troubleshooting

### Backend won't start
- Check the logs in Render dashboard
- Ensure `package.json` has a `start` script
- Verify Node version compatibility

### CORS errors
- Update `ALLOWED_ORIGINS` environment variable in Render
- Make sure your frontend URL is included in the list

### 502 Bad Gateway
- Check if the server is listening on the correct port
- Render uses port from `PORT` environment variable automatically
- Ensure your server uses `process.env.PORT || 3001`

### Games not persisting
- This is expected - games are stored in memory
- Games will reset when the server restarts
- For persistence, you'd need to add a database (MongoDB, PostgreSQL, etc.)

## Notes

- Render free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid tier for always-on service
- Games are stored in memory, so they'll be lost on server restart
