import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 segundo

export async function askClaude(userInput, sessionId = null, locale = 'en-US', retryCount = 0) {
  try {
    const languageName = getLanguageName(locale);

    logger.debug('Calling Claude API', {
      model: process.env.CLAUDE_MODEL,
      maxTokens: process.env.CLAUDE_MAX_TOKENS,
      sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'no-session',
      locale,
      language: languageName,
      retryCount,
    });

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet',
      max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || 512), // Reduzido para forçar respostas curtas
      messages: [
        {
          role: 'user',
          content: userInput,
        },
      ],
      system: `You are a helpful voice assistant integrated with Alexa.
IMPORTANT: Respond ONLY in ${languageName}. Always use this language exclusively.
Keep responses VERY SHORT - maximum 1-2 sentences (one small paragraph).
Be concise, clear, and direct. Avoid lists, complex explanations, or unnecessary details.
Always be friendly and conversational.
Prioritize brevity for voice responses.`,
    });

    const response = message.content[0].text;

    logger.info('Claude API response received', {
      inputLength: userInput.length,
      responseLength: response.length,
      model: message.model,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });

    return {
      text: response,
      stopReason: message.stop_reason,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  } catch (error) {
    logger.error('Claude API error', {
      error: error.message,
      status: error.status,
      retryCount,
    });

    // Retry com backoff exponencial para rate limit (429) e erros temporários
    if ((error.status === 429 || error.status === 502 || error.status === 503) && retryCount < MAX_RETRIES) {
      const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      logger.warn(`Rate limited or temporary error. Retrying in ${delayMs}ms`, {
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES,
      });

      await new Promise(resolve => setTimeout(resolve, delayMs));
      return askClaude(userInput, sessionId, retryCount + 1);
    }

    // Re-lançar erro
    throw error;
  }
}

export async function askClaudeWithHistory(messages, sessionId = null, locale = 'en-US') {
  try {
    const languageName = getLanguageName(locale);

    logger.debug('Calling Claude API with history', {
      messageCount: messages.length,
      sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'no-session',
      locale,
      language: languageName,
    });

    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet',
      max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || 1024),
      messages: messages,
    });

    return {
      text: response.content[0].text,
      usage: response.usage,
    };
  } catch (error) {
    logger.error('Claude API error with history', { error: error.message });
    throw error;
  }
}

// Mapeia locales Alexa para nomes de idioma
function getLanguageName(locale) {
  const languageMap = {
    'pt-BR': 'Portuguese (Brazilian)',
    'pt-PT': 'Portuguese (European)',
    'en-US': 'English (American)',
    'en-GB': 'English (British)',
    'es-ES': 'Spanish (Spain)',
    'es-MX': 'Spanish (Mexico)',
    'fr-FR': 'French',
    'fr-CA': 'French (Canadian)',
    'de-DE': 'German',
    'it-IT': 'Italian',
    'ja-JP': 'Japanese',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'ko-KR': 'Korean',
  };

  return languageMap[locale] || 'English'; // Default to English if locale not found
}
