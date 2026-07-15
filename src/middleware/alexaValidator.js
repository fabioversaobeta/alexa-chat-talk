import https from 'https';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const ALEXA_CERT_URL_HOST = 's3.amazonaws.com';
const ALEXA_CERT_URL_PATH_PATTERN = /^\/echo\.api\/[a-zA-Z0-9-]+$/;
const certificateCache = new Map();

export async function alexaRequestValidator(req, res, next) {
  try {
    // Em development, pular validação se for teste local
    if (process.env.SKIP_ALEXA_VALIDATION === 'true') {
      logger.debug('Skipping Alexa validation in development mode');
      return next();
    }

    const certUrl = req.headers.signaturecertchainurl;
    const signature = req.headers.signature;
    const body = req.rawBody;

    // 1. Validar URL do certificado
    if (!certUrl) {
      logger.warn('Missing SignatureCertChainUrl header');
      return res.status(403).json({ error: 'Invalid request' });
    }

    let certUrlObj;
    try {
      certUrlObj = new URL(certUrl);
    } catch (e) {
      logger.warn('Invalid cert URL format', { certUrl });
      return res.status(403).json({ error: 'Invalid request' });
    }

    if (certUrlObj.hostname !== ALEXA_CERT_URL_HOST) {
      logger.warn(`Invalid cert URL host: ${certUrlObj.hostname}`);
      return res.status(403).json({ error: 'Invalid request' });
    }

    if (!ALEXA_CERT_URL_PATH_PATTERN.test(certUrlObj.pathname)) {
      logger.warn(`Invalid cert URL path: ${certUrlObj.pathname}`);
      return res.status(403).json({ error: 'Invalid request' });
    }

    // 2. Baixar certificado (com cache)
    let certificate;
    if (certificateCache.has(certUrl)) {
      certificate = certificateCache.get(certUrl);
      logger.debug('Using cached certificate');
    } else {
      certificate = await downloadCertificate(certUrl);
      certificateCache.set(certUrl, certificate);
      // Limpar cache a cada 60 min
      setTimeout(() => certificateCache.delete(certUrl), 3600000);
    }

    // 3. Verificar assinatura
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(body);
    const isValid = verifier.verify(certificate, signature, 'base64');

    if (!isValid) {
      logger.warn('Invalid signature for Alexa request');
      return res.status(403).json({ error: 'Invalid request' });
    }

    // 4. Validar timestamp (proteção contra replay attacks)
    const requestTimestamp = req.body.request.timestamp;
    const now = new Date().getTime();
    const requestTime = new Date(requestTimestamp).getTime();
    const timeDiff = Math.abs(now - requestTime);

    if (timeDiff > 150000) { // 150 segundos
      logger.warn(`Timestamp too old: ${timeDiff}ms`);
      return res.status(403).json({ error: 'Invalid request' });
    }

    // 5. Validar Skill ID
    const appId = req.body.context?.System?.application?.applicationId;
    if (!appId) {
      logger.warn('Missing application ID in request');
      return res.status(403).json({ error: 'Invalid request' });
    }

    if (appId !== process.env.ALEXA_SKILL_ID) {
      logger.warn(`Skill ID mismatch: ${appId}`);
      return res.status(403).json({ error: 'Invalid request' });
    }

    logger.debug('Alexa request validated successfully');
    next();
  } catch (error) {
    logger.error('Alexa validation error', { error: error.message });
    res.status(400).json({ error: 'Request validation failed' });
  }
}

function downloadCertificate(certUrl) {
  return new Promise((resolve, reject) => {
    https
      .get(certUrl, { timeout: 5000 }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download certificate: ${response.statusCode}`));
          return;
        }

        let data = '';
        response.on('data', (chunk) => (data += chunk));
        response.on('end', () => resolve(data));
      })
      .on('error', reject)
      .on('timeout', () => {
        reject(new Error('Certificate download timeout'));
      });
  });
}
