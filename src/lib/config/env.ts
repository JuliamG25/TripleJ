const getEnv = (key: string, defaultValue: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key];
  }
  return process.env[key] || defaultValue;
};

export const config = {
  port: parseInt(getEnv('PORT', '4321'), 10),
  nodeEnv: getEnv('MODE', getEnv('NODE_ENV', 'development')),
  mongoURI: getEnv('MONGODB_URI', 'mongodb://localhost:27017/fesc-proyectos'),
  jwt: {
    secret: getEnv('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production'),
    expire: getEnv('JWT_EXPIRE', '7d'),
  },
  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:4321'),
  },
  email: {
    smtpHost: getEnv('SMTP_HOST', 'smtp.gmail.com'),
    smtpPort: parseInt(getEnv('SMTP_PORT', '587'), 10),
    smtpUser: getEnv('SMTP_USER', ''),
    smtpPassword: getEnv('SMTP_PASSWORD', ''),
    smtpFrom: getEnv('SMTP_FROM', ''),
    appUrl: getEnv('APP_URL', 'http://localhost:4321'),
  },
};
