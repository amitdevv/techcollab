# TechCollab - The All-in-One Platform for Events, Freelancers, and Communities

<div align="center">

![TechCollab Banner](https://res.cloudinary.com/dtmo3evjx/image/upload/v1748529997/techcollab_oppeyf.png)

[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%20Powered-orange.svg)](https://ai.google.dev)

*A comprehensive platform connecting talented freelancers with exciting projects, managing tech events, and building vibrant communities*

[Live Demo](#) | [Documentation](#) | [Report Bug](#) | [Request Feature](#)

</div>


## Features

### Core Features
- **Smart Marketplace**: Browse and post freelance gigs with advanced filtering
- **AI-Powered Search**: Natural language search using Google Gemini AI
- **Real-time Chat**: Instant messaging between clients and freelancers
- **Event Management**: Create and discover tech events, workshops, and meetups
- **Community Building**: Connect with like-minded professionals and build networks
- **User Profiles**: Comprehensive profiles with skills, portfolios, and ratings
- **Proposal System**: Submit and manage project proposals

### Advanced Features
- **Dark/Light Theme**: System-wide theme toggle with persistent preferences
- **File Uploads**: Cloudinary integration for images and documents
- **Real-time Notifications**: Live updates for messages, proposals, and events
- **Google OAuth**: Secure authentication with Google Sign-In
- **Responsive Design**: Mobile-first design that works on all devices
- **Save Functionality**: Bookmark gigs and events for later

### AI Integration
- **Smart Search**: "I need a React developer under $500" → Automatically filters and sorts
- **Auto-suggestions**: AI-powered search suggestions as you type
- **Query Interpretation**: Explains how your search was processed
- **Fallback System**: Graceful degradation if AI services are unavailable

## Tech Stack

### Frontend
- **Framework**: React 18.2+ with TypeScript
- **Build Tool**: Vite 4.0+
- **Styling**: Tailwind CSS 3.0+
- **UI Components**: Custom component library with Radix UI primitives
- **Icons**: Lucide React
- **Routing**: React Router Dom 6.0+
- **State Management**: React Context API
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 18.0+
- **Framework**: Express.js 4.18+
- **Database**: MongoDB 6.0+ with Mongoose ODM
- **Authentication**: JWT + Google OAuth 2.0
- **File Storage**: Cloudinary
- **Real-time**: Socket.IO
- **AI Integration**: Google Gemini API
- **Validation**: Express Validator

### Development Tools
- **Language**: TypeScript 5.0+
- **Code Quality**: ESLint + Prettier
- **Version Control**: Git
- **Package Manager**: npm

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/techcollab.git
cd techcollab

# Install dependencies
npm run install:all

# Set up environment variables
cp backend/.env.example backend/.env
cp project/.env.example project/.env

# Start development servers
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app and [http://localhost:5000](http://localhost:5000) for the API.

## Installation

### Prerequisites
- Node.js 18.0 or higher
- npm 8.0 or higher
- MongoDB 6.0+ (local or Atlas)
- Git

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/techcollab.git
   cd techcollab
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../project
   npm install
   ```

4. **Build the Backend**
   ```bash
   cd ../backend
   npm run build
   ```

## Environment Setup

### Backend Environment (.env)

Create `backend/.env` file:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/techcollab
# Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/techcollab

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secure_jwt_secret_here

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Frontend Environment (.env)

Create `project/.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
```

### Getting API Keys

1. **MongoDB Atlas** (Free):
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create cluster → Get connection string

2. **Cloudinary** (Free tier available):
   - Sign up at [Cloudinary](https://cloudinary.com)
   - Dashboard → Account Details → Copy credentials

3. **Google Gemini API** (Free tier available):
   - Visit [Google AI Studio](https://ai.google.dev)
   - Create API key

## Usage

### Development Mode

```bash
# Start backend server (Terminal 1)
cd backend
npm run dev

# Start frontend server (Terminal 2)  
cd project
npm run dev
```

### Production Build

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd project
npm run build
```

### Key Features Guide

1. **AI Search**: Type natural language queries like "React developer under $300"
2. **Create Gig**: Post your services with detailed descriptions and pricing
3. **Event Management**: Create tech events and workshops
4. **Community Building**: Connect with professionals in your field
5. **Real-time Chat**: Communicate instantly with other users
6. **Theme Toggle**: Switch between light and dark modes
7. **File Uploads**: Add images to your gigs and profile

## AI Features

### Natural Language Search
```
User Input: "I need a mobile app developer under $500"
AI Processing: 
- Category: mobile
- Price: 0-500
- Sort: relevance
Result: Filtered gigs matching criteria
```

### Smart Suggestions
- Auto-complete based on popular searches
- Context-aware recommendations
- Skill-based filtering

### Search Examples
- "cheap web developer" → Web category, price low to high
- "experienced UI designer" → Design category, rating sorted
- "React expert urgent project" → Web category, newest first

## API Documentation

### Authentication Endpoints
```
POST /api/auth/register    - User registration
POST /api/auth/login       - User login
POST /api/auth/google      - Google OAuth login
GET  /api/auth/me          - Get current user
```

### Marketplace Endpoints
```
GET    /api/gigs           - Get all gigs (with filters)
POST   /api/gigs           - Create new gig
GET    /api/gigs/:id       - Get gig by ID
PUT    /api/gigs/:id       - Update gig
DELETE /api/gigs/:id       - Delete gig
```

### AI Search Endpoints
```
POST /api/ai/search        - AI-powered search
GET  /api/ai/suggestions   - Get search suggestions
```

### Events Endpoints
```
GET    /api/events         - Get all events
POST   /api/events         - Create new event
GET    /api/events/:id     - Get event by ID
PUT    /api/events/:id     - Update event
DELETE /api/events/:id     - Delete event
```

### Chat Endpoints
```
GET    /api/chat/conversations  - Get user conversations
POST   /api/chat/send          - Send message
GET    /api/chat/:id           - Get conversation
```

## Deployment

### Quick Deploy with Railway + Vercel

1. **Deploy Backend to Railway**
   ```bash
   cd backend
   npm install -g @railway/cli
   railway login
   railway project create techcollab-backend
   railway up
   ```

2. **Deploy Frontend to Vercel**
   ```bash
   cd project
   npm install -g vercel
   vercel login
   vercel --prod
   ```

3. **Set Environment Variables**
   - Railway: Set all backend env vars in dashboard
   - Vercel: Set `VITE_API_URL` to your Railway backend URL

### Alternative Platforms
- **Backend**: Render, DigitalOcean, AWS, Heroku
- **Frontend**: Netlify, GitHub Pages, Cloudflare Pages
- **Database**: MongoDB Atlas (recommended)

## Theme System

The app features a comprehensive dark/light theme system:

### Theme Colors
```css
/* Light Theme */
--background: #fafafa
--card-bg: #ffffff
--text: #1f2937

/* Dark Theme */  
--background: #232323
--card-bg: #171717
--text: #f9fafb
--accent: #219653
```

### Theme Toggle
- Persistent theme preferences
- System preference detection
- Smooth transitions
- Component-level theme support

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation
- Ensure responsive design


---
