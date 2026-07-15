import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const requiredVars = [
  'ALEXA_SKILL_ID',
  'CLAUDE_API_KEY',
  'CLAUDE_MODEL',
  'NODE_ENV',
];

function validateEnv() {
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    process.exit(1);
  }

  // Validar formato de API key
  if (process.env.CLAUDE_API_KEY && !process.env.CLAUDE_API_KEY.startsWith('sk-ant-')) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Invalid Claude API key format');
      process.exit(1);
    } else {
      logger.warn('Claude API key not properly configured. Using placeholder for development.');
    }
  }

  // Validar NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(process.env.NODE_ENV)) {
    logger.warn(`Invalid NODE_ENV: ${process.env.NODE_ENV}. Using 'development'.`);
    process.env.NODE_ENV = 'development';
  }

  logger.info('Environment variables validated', { env: process.env.NODE_ENV });
}

export default validateEnv;
