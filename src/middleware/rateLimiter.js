import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// Rate limiter em memória (sem Redis, para desenvolvimento)
export const alexaLimiterMemory = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 60000), // 1 minuto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 10), // 10 requisições por minuto
  keyGenerator: (req) => {
    // Usar User ID da sessão Alexa como chave
    const userId = req.body?.context?.System?.user?.userId;
    return userId || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      userId: req.body?.context?.System?.user?.userId?.substring(0, 8),
      ip: req.ip,
    });
    res.status(429).json({
      error: 'Too many requests, please try again later',
    });
  },
  skip: (req) => {
    // Não limitar em testes locais
    if (process.env.NODE_ENV === 'development' && req.headers.signature === 'local-signature-test') {
      return true;
    }
    return false;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter mais restritivo para IP (proteção contra DDoS)
export const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP por 15 min
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn('IP rate limit exceeded', { ip: req.ip });
    res.status(429).json({ error: 'Too many requests from this IP' });
  },
  skip: (req) => process.env.NODE_ENV === 'development',
});
