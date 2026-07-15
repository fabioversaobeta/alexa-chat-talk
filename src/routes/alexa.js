import { Router } from 'express';
import { askClaude } from '../services/claudeService.js';
import {
  buildAlexaResponse,
  buildErrorResponse,
  buildWelcomeResponse,
  buildHelpResponse,
  buildGoodbyeResponse,
} from '../services/alexaResponseService.js';
import logger from '../utils/logger.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const requestType = req.body.request.type;
    const userId = req.body.context.System.user.userId;
    const userIdHash = userId.substring(0, 8) + '...';

    logger.info('Processing Alexa intent', {
      type: requestType,
      userId: userIdHash,
      timestamp: new Date().toISOString(),
    });

    // LaunchRequest - quando usuário abre a skill sem intent específico
    if (requestType === 'LaunchRequest') {
      logger.debug('LaunchRequest received', { userId: userIdHash });
      return res.json(buildWelcomeResponse());
    }

    // IntentRequest - quando usuário dispara um intent
    if (requestType === 'IntentRequest') {
      const intentName = req.body.request.intent.name;

      logger.debug('IntentRequest received', {
        intent: intentName,
        userId: userIdHash,
      });

      // GetAnswerIntent - intent principal para responder perguntas
      if (intentName === 'GetAnswerIntent') {
        const userInput = req.body.request.intent.slots?.userInput?.value;
        const locale = req.body.request.locale || 'en-US'; // Extrair idioma configurado na Alexa

        if (!userInput) {
          logger.warn('GetAnswerIntent without user input', { userId: userIdHash });
          return res.json(buildErrorResponse('Please ask me something'));
        }

        try {
          logger.debug('Calling Claude with user input', {
            inputLength: userInput.length,
            userId: userIdHash,
            locale,
          });

          const claudeResponse = await askClaude(userInput, userId, locale);

          logger.info('Successfully answered user question', {
            inputLength: userInput.length,
            responseLength: claudeResponse.text.length,
            userId: userIdHash,
          });

          const alexaResponse = buildAlexaResponse(
            claudeResponse.text,
            'Claude Response',
            claudeResponse.text
          );

          return res.json(alexaResponse);
        } catch (error) {
          logger.error('Claude API call failed', {
            error: error.message,
            userId: userIdHash,
            status: error.status,
          });

          // Mensagens de erro personalizadas baseadas no tipo de erro
          let errorMessage = 'Claude is temporarily unavailable. Please try again.';

          if (error.status === 401 || error.status === 403) {
            errorMessage = 'Authentication error. Please check the API key configuration.';
          } else if (error.status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again in a moment.';
          } else if (error.status === 503) {
            errorMessage = 'Claude service is temporarily unavailable. Please try again later.';
          }

          return res.json(buildErrorResponse(errorMessage));
        }
      }

      // AMAZON.HelpIntent
      if (intentName === 'AMAZON.HelpIntent') {
        logger.debug('HelpIntent received', { userId: userIdHash });
        return res.json(buildHelpResponse());
      }

      // AMAZON.StopIntent e AMAZON.CancelIntent
      if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        logger.debug('StopIntent/CancelIntent received', { userId: userIdHash });
        return res.json(buildGoodbyeResponse());
      }

      // Intent desconhecido
      logger.warn('Unknown intent', { intent: intentName, userId: userIdHash });
      return res.json(
        buildErrorResponse('I did not understand that. Please try asking a question.')
      );
    }

    // SessionEndedRequest
    if (requestType === 'SessionEndedRequest') {
      const reason = req.body.request.reason;
      logger.info('Session ended', {
        reason,
        userId: userIdHash,
      });
      return res.json({ version: '1.0', response: {} });
    }

    // Tipo de request desconhecido
    logger.warn('Unknown request type', { type: requestType, userId: userIdHash });
    return res.status(400).json(buildErrorResponse('Invalid request type'));
  } catch (error) {
    logger.error('Alexa intent handler unhandled error', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
    res.status(500).json(buildErrorResponse());
  }
});

export default router;
