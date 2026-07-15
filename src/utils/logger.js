import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logDir = path.join(process.cwd(), 'logs');

// Criar diretório de logs se não existir
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configuração para logs com tamanho máximo (sem rotação, apenas sobrescreve)
const MAX_LOG_SIZE = parseInt(process.env.MAX_LOG_SIZE || 5242880); // 5MB por padrão
const MAX_ERROR_LOG_SIZE = parseInt(process.env.MAX_ERROR_LOG_SIZE || 2097152); // 2MB para erros

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'alexa-claude-backend',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Arquivo de erros - sobrescreve quando atinge tamanho máximo
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: MAX_ERROR_LOG_SIZE, // 2MB (sobrescreve)
      maxFiles: 1, // Mantém apenas 1 arquivo
      tailable: true, // Permite sobrescrita
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Arquivo combinado - sobrescreve quando atinge tamanho máximo
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: MAX_LOG_SIZE, // 5MB (sobrescreve)
      maxFiles: 1, // Mantém apenas 1 arquivo
      tailable: true, // Permite sobrescrita
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Console (apenas em development)
    ...(process.env.NODE_ENV !== 'production'
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ level, message, timestamp, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${timestamp} [${level}]: ${message} ${metaStr}`;
              })
            ),
          }),
        ]
      : []),
  ],
});

// NUNCA logar dados sensíveis:
// - API keys
// - User IDs completos
// - Tokens
// - Passwords
// - Dados pessoais

export default logger;
