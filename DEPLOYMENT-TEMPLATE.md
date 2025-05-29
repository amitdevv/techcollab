# 🚀 Deployment Guide for TechCollab

## 📋 Pre-Deployment Checklist

### Backend (Render Deployment)

1. **Environment Variables to Set in Render Dashboard:**
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string_here
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=30d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_FROM=your_email@gmail.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   PRODUCTION_FRONTEND_URL=https://techcollab.vercel.app
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

2. **Render Build & Start Commands:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** `backend`

### Frontend (Vercel Deployment)

1. **Environment Variables to Set in Vercel Dashboard:**
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   VITE_API_URL=https://your-backend-name.onrender.com
   ```

2. **Vercel Configuration:**
   - **Framework Preset:** Vite
   - **Root Directory:** `project`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign up/login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name:** `techcollab-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
6. Add all the environment variables listed above **with your actual values**
7. Deploy the service
8. **Copy the backend URL** (e.g., `https://techcollab-backend.onrender.com`)

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `project`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variables with your actual values
6. Deploy the project
7. Your frontend will be available at `https://techcollab.vercel.app`

## 🔧 Post-Deployment Configuration

### Update OAuth Redirects

1. **Google OAuth Console:**
   - Add `https://techcollab.vercel.app` to authorized origins
   - Update redirect URIs to include production domain

2. **GitHub OAuth App:**
   - Update authorization callback URL to `https://techcollab.vercel.app`

### Test Your Deployment

1. Visit `https://techcollab.vercel.app`
2. Test user registration/login
3. Test real-time chat functionality
4. Test file uploads
5. Test all major features

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure backend CORS is configured for `https://techcollab.vercel.app`
   - Check environment variables are set correctly

2. **Socket.IO Connection Issues:**
   - Verify WebSocket support on Render
   - Check socket CORS configuration

3. **Database Connection:**
   - Verify MongoDB URI is correct
   - Check network access settings in MongoDB Atlas

4. **Environment Variables:**
   - Double-check all required env vars are set in both platforms
   - Ensure no typos in variable names

## 📝 Important Notes

⚠️ **Security Notice:** This is a template file. Replace all placeholder values with your actual API keys and credentials when deploying.

1. **Free Tier Limitations:**
   - Render free tier has cold starts (may take 30-60 seconds to wake up)
   - Consider upgrading for production use

2. **Security:**
   - Keep all secrets secure
   - Never commit actual API keys to version control
   - Regularly rotate API keys and passwords

## 🎉 You're All Set!

Your TechCollab application should now be live at:
- **Frontend:** https://techcollab.vercel.app
- **Backend:** https://your-backend-name.onrender.com
