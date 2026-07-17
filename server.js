import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import validateEnv from './src/config/env.js';
import { setupCors } from './src/config/security.js';
import { alexaLimiterMemory } from './src/middleware/rateLimiter.js';
import { alexaRequestValidator } from './src/middleware/alexaValidator.js';
import { sanitizeAlexaInput } from './src/middleware/inputSanitizer.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { requestDebugLogger } from './src/middleware/requestDebugLogger.js';
import alexaRoutes from './src/routes/alexa.js';
import logger from './src/utils/logger.js';

// Validar environment
validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
setupCors(app);

// Logging
app.use(morgan('combined', { stream: { write: msg => logger.info(msg) } }));

// Capture raw body ANTES de parsing (necessário para validação Alexa)
app.use(express.raw({ type: 'application/json' }), (req, res, next) => {
  if (req.method === 'POST' && req.is('json')) {
    req.rawBody = req.body.toString('utf8');
    req.body = JSON.parse(req.rawBody);
  }
  next();
});

// Parsed JSON
app.use(express.json({ limit: '1mb' }));

// Debug logger (opcional - habilitado via DEBUG_REQUESTS=true) - DEPOIS de parsing
app.use(requestDebugLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Alexa routes com middlewares
app.use(
  '/alexa/intent',
  alexaLimiterMemory,
  alexaRequestValidator,
  sanitizeAlexaInput,
  alexaRoutes
);

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({ error: 'Not found' });
});

// Error handler (middleware final)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

export default app;
