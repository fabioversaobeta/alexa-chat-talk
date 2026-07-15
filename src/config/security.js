import cors from 'cors';
import logger from '../utils/logger.js';

export function setupCors(app) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

  app.use(cors({
    origin: (origin, callback) => {
      // Alexa requests não têm origin header, permitir
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV === 'development') {
        logger.warn(`CORS: Origin não autorizado em dev: ${origin}`);
        return callback(null, true); // Permitir em dev
      }

      logger.warn(`CORS: Origin rejeitado: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['POST', 'GET'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    optionsSuccessStatus: 200,
    maxAge: 3600,
  }));
}

export const securityConfig = {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 10),
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },
};
