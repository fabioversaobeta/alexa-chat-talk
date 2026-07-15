import xss from 'xss';
import validator from 'validator';
import logger from '../utils/logger.js';

const DANGEROUS_PATTERNS = [
  /ignore previous instructions/i,
  /system prompt/i,
  /jailbreak/i,
  /forget everything/i,
  /\{\{[\s\S]*?\}\}/g, // Templates
  /eval\s*\(/i,
  /exec\s*\(/i,
  /__proto__/i,
  /constructor\s*\[/i,
];

const MAX_INPUT_LENGTH = 500;

export function sanitizeAlexaInput(req, res, next) {
  try {
    const userInput = req.body?.request?.intent?.slots?.userInput?.value;

    if (!userInput) {
      return res.status(400).json({ error: 'No input provided' });
    }

    // 1. Verificar comprimento
    if (userInput.length > MAX_INPUT_LENGTH) {
      logger.warn('Input too long', { length: userInput.length, max: MAX_INPUT_LENGTH });
      return res.status(400).json({
        error: `Input too long (max ${MAX_INPUT_LENGTH} characters)`,
      });
    }

    // 2. Remover XSS
    const sanitized = xss(userInput, {
      whiteList: {}, // Nenhuma tag HTML permitida
      stripIgnoredTag: true,
      stripLeadingAndTrailingWhitespace: false,
    });

    // 3. Verificar padrões perigosos
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(sanitized)) {
        logger.warn('Dangerous pattern detected', {
          input: sanitized.substring(0, 50),
          pattern: pattern.source,
        });
        return res.status(400).json({
          error: 'Invalid input - suspicious patterns detected',
        });
      }
    }

    // 4. Validar se é string válida
    if (!validator.isLength(sanitized, { min: 1, max: MAX_INPUT_LENGTH })) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // 5. Validação adicional: rejeitar se ainda contiver caracteres de controle
    // After sanitization, shouldn't have control characters
    for (let i = 0; i < sanitized.length; i++) {
      const charCode = sanitized.charCodeAt(i);
      // Rejeitar caracteres de controle (0-31, excepto espaço/tab/newline)
      if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
        logger.warn('Control characters detected', { input: sanitized.substring(0, 30) });
        return res.status(400).json({
          error: 'Input contains invalid characters',
        });
      }
    }

    // Substituir input sanitizado no request
    req.body.request.intent.slots.userInput.value = sanitized.trim();

    logger.debug('Input sanitized', {
      original_length: userInput.length,
      sanitized_length: sanitized.length,
    });

    next();
  } catch (error) {
    logger.error('Sanitization error', { error: error.message });
    res.status(500).json({ error: 'Request processing failed' });
  }
}
