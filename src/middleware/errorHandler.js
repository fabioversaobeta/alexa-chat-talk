import logger from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  // Log do erro (sem dados sensíveis)
  logger.error('Unhandled error', {
    message: err.message,
    status: err.status || 500,
    method: req.method,
    path: req.path,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Responder ao cliente
  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
  });
}
