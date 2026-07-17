import logger from '../utils/logger.js';

/**
 * Middleware para logar completo de requests e responses
 * Habilitado via variável de ambiente: DEBUG_REQUESTS=true
 *
 * Logs registram:
 * - Request completo (headers, body)
 * - Response completo (status, body)
 * - Tempo de execução
 */

export function requestDebugLogger(req, res, next) {
  if (process.env.DEBUG_REQUESTS !== 'true') {
    return next();
  }

  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;

  // Log do request
  logger.debug('📥 REQUEST RECEIVED', {
    requestId,
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    headers: sanitizeHeaders(req.headers),
    body: req.body,
    rawBody: req.rawBody ? req.rawBody.substring(0, 500) : null, // Primeiros 500 chars
  });

  // Capturar a response
  const originalSend = res.send;
  const originalJson = res.json;

  let responseBody = null;

  res.send = function (data) {
    responseBody = data;
    return originalSend.call(this, data);
  };

  res.json = function (data) {
    responseBody = data;
    return originalJson.call(this, data);
  };

  // Log da response ao terminar
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.debug('📤 RESPONSE SENT', {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseBody: responseBody,
      headers: res.getHeaders(),
    });
  });

  next();
}

/**
 * Remove headers sensíveis do log
 */
function sanitizeHeaders(headers) {
  const sensitiveHeaders = [
    'authorization',
    'x-api-key',
    'cookie',
    'signature',
    'signaturecertchainurl',
  ];

  const sanitized = { ...headers };

  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '***REDACTED***';
    }
  });

  return sanitized;
}
