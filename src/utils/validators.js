import logger from './logger.js';

export function validateAlexaRequestStructure(body) {
  if (!body.request) {
    return { valid: false, error: 'Missing request object' };
  }

  if (!body.context?.System?.application?.applicationId) {
    return { valid: false, error: 'Missing application ID' };
  }

  if (!body.context?.System?.user?.userId) {
    return { valid: false, error: 'Missing user ID' };
  }

  if (!body.request.requestId) {
    return { valid: false, error: 'Missing request ID' };
  }

  if (!body.request.timestamp) {
    return { valid: false, error: 'Missing timestamp' };
  }

  return { valid: true };
}

export function validateUserInput(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Input cannot be empty' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Input too long (max 500 chars)' };
  }

  return { valid: true, input: trimmed };
}

export function hashUserId(userId) {
  if (!userId) return 'unknown';
  return userId.substring(0, 8) + '...';
}
