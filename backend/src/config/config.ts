// Configuration values for the application
const config = {
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  jwtExpire: process.env.JWT_EXPIRE || '30d',

  // Email configuration
  emailFrom: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
  emailHost: process.env.EMAIL_HOST || 'smtp.example.com',
  emailPort: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
  emailUser: process.env.EMAIL_USER || 'user',
  emailPassword: process.env.EMAIL_PASSWORD || 'password',

  // Application settings
  appName: process.env.APP_NAME || 'Your Application',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // OAuth configurations
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
};

export default config;
