# Deployment Guide for StudyMap

This guide will help you deploy StudyMap to Vercel.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`
- Your Anthropic API key

## Deployment Architecture

This application consists of two parts:
1. **Backend (Next.js API)** - Handles Claude AI integration and data storage
2. **Frontend (Vite React)** - User interface

Both will be deployed as separate Vercel projects.

## Step 1: Deploy Backend

### 1.1 Navigate to Backend Directory
```bash
cd backend
```

### 1.2 Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- **Set up and deploy**: Yes
- **Which scope**: Select your account
- **Link to existing project**: No
- **Project name**: studymap-backend (or your choice)
- **Directory**: ./
- **Override settings**: No

### 1.3 Set Environment Variables
After deployment, add your Anthropic API key:

```bash
vercel env add ANTHROPIC_API_KEY
```

Choose **Production** and paste your API key:
```
sk-ant-api03-YOUR_API_KEY_HERE
```

Also add it for **Preview** and **Development** environments if needed.

### 1.4 Redeploy with Environment Variables
```bash
vercel --prod
```

### 1.5 Note Your Backend URL
Your backend will be available at something like:
```
https://studymap-backend.vercel.app
```

**Save this URL - you'll need it for the frontend!**

## Step 2: Deploy Frontend

### 2.1 Navigate to Frontend Directory
```bash
cd ../frontend
```

### 2.2 Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- **Set up and deploy**: Yes
- **Which scope**: Select your account
- **Link to existing project**: No
- **Project name**: studymap-frontend (or your choice)
- **Directory**: ./
- **Override settings**: No

### 2.3 Set Backend URL Environment Variable
Add the backend URL from Step 1.5:

```bash
vercel env add VITE_API_BASE_URL
```

Choose **Production** and paste your backend URL with /api:
```
https://studymap-backend.vercel.app/api
```

Also add it for **Preview** and **Development** environments.

### 2.4 Redeploy with Environment Variables
```bash
vercel --prod
```

## Step 3: Configure Backend CORS (Optional)

If you encounter CORS issues, you may need to configure allowed origins in the backend.

## Step 4: Test Your Deployment

1. Visit your frontend URL (e.g., `https://studymap-frontend.vercel.app`)
2. Upload a syllabus PDF
3. Test the chat feature
4. Generate a quiz

## Alternative: Deploy from GitHub

You can also connect your GitHub repository to Vercel for automatic deployments:

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure two projects:
   - **Backend**: Root directory = `backend`, Framework = Next.js
   - **Frontend**: Root directory = `frontend`, Framework = Vite
4. Set environment variables in Vercel dashboard:
   - Backend: `ANTHROPIC_API_KEY`
   - Frontend: `VITE_API_BASE_URL` (set to your backend URL)

## Troubleshooting

### Backend Issues

**Problem**: "Claude API not configured"
- **Solution**: Make sure `ANTHROPIC_API_KEY` is set in Vercel environment variables

**Problem**: 500 errors in API routes
- **Solution**: Check Vercel function logs in the dashboard

### Frontend Issues

**Problem**: "Network Error" when calling API
- **Solution**: Verify `VITE_API_BASE_URL` is set correctly and includes `/api`

**Problem**: CORS errors
- **Solution**: Ensure frontend domain is allowed in backend CORS configuration

### Storage Issues

**Problem**: Data not persisting
- **Note**: Vercel's serverless functions are stateless. For production, consider:
  - Using Vercel KV for key-value storage
  - Using Vercel Postgres for relational data
  - Using external database (MongoDB, Supabase, etc.)

## Production Considerations

1. **Database**: Currently uses file-based storage which won't persist on Vercel
   - Consider migrating to Vercel KV, Postgres, or external database

2. **Rate Limits**: Claude API has rate limits (4,000 tokens/minute)
   - Implement request queuing or user-based rate limiting

3. **File Uploads**: Large PDFs may hit Vercel's body size limits
   - Consider using Vercel Blob for file storage

4. **Monitoring**: Set up error tracking and monitoring
   - Consider Sentry, LogRocket, or Vercel Analytics

## Environment Variables Reference

### Backend
- `ANTHROPIC_API_KEY`: Your Anthropic Claude API key (required)

### Frontend
- `VITE_API_BASE_URL`: Full URL to backend API including /api path (required for production)

## Support

For issues, check:
- Vercel deployment logs
- Browser console for frontend errors
- Network tab for API call details
