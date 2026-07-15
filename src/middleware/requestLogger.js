import logger from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Capturar end da response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    const userId = req.body?.context?.System?.user?.userId;
    const userIdHash = userId ? userId.substring(0, 8) + '...' : 'unknown';

    logger.info('Alexa request processed', {
      method: req.method,
      path: req.path,
      userId: userIdHash,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
}
