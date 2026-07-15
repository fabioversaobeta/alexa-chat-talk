import logger from '../utils/logger.js';

// Limite Alexa para fala (8000 caracteres)
const MAX_SPEECH_LENGTH = 8000;

export function buildAlexaResponse(speechText, cardTitle = null, cardContent = null, shouldEndSession = true) {
  const truncatedSpeech = truncateSpeech(speechText);

  const response = {
    version: '1.0',
    sessionAttributes: {},
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: truncatedSpeech,
      },
      shouldEndSession: shouldEndSession,
    },
  };

  // Adicionar card se fornecido (mostrado no app Alexa)
  if (cardTitle && cardContent) {
    response.response.card = {
      type: 'Simple',
      title: cardTitle,
      content: truncateSpeech(cardContent),
    };
  }

  return response;
}

export function buildErrorResponse(errorMessage = 'I encountered an error. Please try again.') {
  logger.warn('Building error response', { message: errorMessage });

  return {
    version: '1.0',
    sessionAttributes: {},
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: errorMessage,
      },
      shouldEndSession: true,
    },
  };
}

export function buildRepromptResponse(speechText, repromptText) {
  const truncatedSpeech = truncateSpeech(speechText);
  const truncatedReprompt = truncateSpeech(repromptText);

  return {
    version: '1.0',
    sessionAttributes: {},
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: truncatedSpeech,
      },
      reprompt: {
        outputSpeech: {
          type: 'PlainText',
          text: truncatedReprompt,
        },
      },
      shouldEndSession: false,
    },
  };
}

export function buildWelcomeResponse() {
  return buildAlexaResponse(
    'Welcome to Claude Assistant. Ask me anything!',
    'Claude Assistant',
    'Ready to help. Ask me any question.'
  );
}

export function buildHelpResponse() {
  return buildAlexaResponse(
    'I can answer any question you ask. Just say ask Claude and your question.',
    'Help',
    'Ask me anything and I will try to help.'
  );
}

export function buildGoodbyeResponse() {
  return buildAlexaResponse(
    'Goodbye!',
    'Goodbye',
    null,
    true
  );
}

function truncateSpeech(text) {
  if (!text) {
    return '';
  }

  if (text.length <= MAX_SPEECH_LENGTH) {
    return text;
  }

  logger.warn('Response truncated', {
    originalLength: text.length,
    truncatedLength: MAX_SPEECH_LENGTH,
  });

  return text.substring(0, MAX_SPEECH_LENGTH - 3) + '...';
}
