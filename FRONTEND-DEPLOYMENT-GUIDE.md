# Frontend Deployment Guide - GitHub + Vercel

This guide will help you deploy your React frontend using GitHub and Vercel, similar to your backend deployment.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Your backend already deployed (Render, Railway, etc.)

## Step 1: Prepare Your Frontend for GitHub

### 1.1 Initialize Git Repository (if not already done)
```bash
cd project
git init
```

### 1.2 Create .gitignore file (if not exists)
```bash
# Create .gitignore in the project folder
echo "node_modules/
dist/
.env.local
.env.development.local
.env.test.local
.env.production.local
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.vscode/
.idea/" > .gitignore
```

### 1.3 Update Environment Variables
Make sure your `.env.production` file has the correct backend URL:
```env
VITE_CLOUDINARY_CLOUD_NAME=dgzf8pr5j
VITE_CLOUDINARY_UPLOAD_PRESET=my_unsigned_preset
VITE_API_URL=https://your-actual-backend-url.com
```

## Step 2: Push to GitHub

### 2.1 Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name it: `tech-collab-frontend` (or your preferred name)
4. Make it **Public** (required for free Vercel deployment)
5. Don't initialize with README (since you already have code)

### 2.2 Push Your Code
```bash
# Add all files
git add .

# Commit your changes
git commit -m "Initial frontend setup for deployment"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/tech-collab-frontend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy with Vercel

### 3.1 Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click "New Project"
4. Import your `tech-collab-frontend` repository

### 3.2 Configure Vercel Settings
When importing your project, Vercel will auto-detect it's a Vite project. Use these settings:

**Framework Preset:** Vite
**Root Directory:** `./project` (since your frontend is in the project folder)
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### 3.3 Set Environment Variables in Vercel
In the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:

```
VITE_CLOUDINARY_CLOUD_NAME = dgzf8pr5j
VITE_CLOUDINARY_UPLOAD_PRESET = my_unsigned_preset
VITE_API_URL = https://your-backend-url.com
```

**Important:** Replace `https://your-backend-url.com` with your actual backend URL.

### 3.4 Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## Step 4: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to "Domains"
2. Add your custom domain
3. Update DNS settings as instructed by Vercel

## Step 5: Automatic Deployments

Once set up, every time you push to your `main` branch on GitHub:
1. Vercel automatically detects changes
2. Builds your project
3. Deploys the new version
4. You get a preview URL for each deployment

## Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check if all dependencies are in `package.json`
   - Ensure environment variables are set in Vercel

2. **API Connection Issues:**
   - Verify `VITE_API_URL` is correct in Vercel environment variables
   - Check CORS settings on your backend

3. **Environment Variables Not Working:**
   - Make sure variables start with `VITE_` prefix
   - Redeploy after adding new environment variables

### Useful Commands:

```bash
# Check build locally
npm run build

# Preview production build
npm run preview

# Check for linting issues
npm run lint
```

## File Structure After Setup

```
project/
├── .env                    # Local development
├── .env.production        # Production template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
├── vercel.json          # Vercel configuration
├── vite.config.ts       # Vite configuration
└── src/                 # Source code
```

## Next Steps

1. Test your deployed frontend
2. Update any hardcoded URLs in your code
3. Set up monitoring and analytics if needed
4. Configure automatic deployments for other branches (staging, etc.)

Your frontend will now be automatically deployed whenever you push changes to GitHub!
