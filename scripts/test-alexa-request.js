#!/usr/bin/env node

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const SKILL_ID = 'amzn1.ask.skill.local-development';
const USER_ID = `test-user-${Date.now()}`;

async function createTestRequest(userInput) {
  const timestamp = new Date().toISOString();
  const requestId = `local-test-${Date.now()}`;

  const body = {
    version: '1.0',
    session: {
      new: true,
      sessionId: `local-session-${Date.now()}`,
      application: { applicationId: SKILL_ID },
      attributes: {},
      user: { userId: USER_ID },
    },
    context: {
      System: {
        application: { applicationId: SKILL_ID },
        user: { userId: USER_ID },
        device: {
          deviceId: 'local-device',
          supportedInterfaces: {},
        },
        apiEndpoint: 'https://api.amazonalexa.com',
        apiAccessToken: 'local-token',
      },
    },
    request: {
      type: 'IntentRequest',
      requestId: requestId,
      timestamp: timestamp,
      locale: 'pt-BR',
      intent: {
        name: 'GetAnswerIntent',
        confirmationStatus: 'NONE',
        slots: {
          userInput: {
            name: 'userInput',
            value: userInput,
            confirmationStatus: 'NONE',
          },
        },
      },
    },
  };

  try {
    console.log(`\n📤 Enviando requisição para ${BACKEND_URL}/alexa/intent`);
    console.log(`🤖 Input: "${userInput}"`);
    console.log('⏳ Aguardando resposta...\n');

    const startTime = Date.now();

    const response = await axios.post(`${BACKEND_URL}/alexa/intent`, body, {
      headers: {
        'Content-Type': 'application/json',
        'SignatureCertChainUrl': 'https://s3.amazonaws.com/echo.api/local-cert',
        'Signature': 'local-signature-test',
      },
      timeout: 30000,
    });

    const duration = Date.now() - startTime;

    console.log('✅ Sucesso! Resposta:');
    console.log(`⏱️  Tempo: ${duration}ms\n`);
    console.log(JSON.stringify(response.data, null, 2));

    // Extract the response text
    const speechText = response.data?.response?.outputSpeech?.text;
    if (speechText) {
      console.log(`\n🔊 Texto para fala (Alexa dirá):`);
      console.log(`"${speechText}"\n`);
    }
  } catch (error) {
    console.log('❌ Erro ao chamar o backend:\n');

    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Resposta:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Não conseguiu conectar ao servidor.');
      console.log(`Verifica se o servidor está rodando em ${BACKEND_URL}`);
      console.log('Tenta: npm run dev');
    } else {
      console.log(`Erro: ${error.message}`);
    }

    process.exit(1);
  }
}

// Obter input do argumento ou usar padrão
const userInput = process.argv[2] || 'What is artificial intelligence?';

console.log('🎤 Teste Alexa Request\n');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Skill ID: ${SKILL_ID}`);
console.log(`User ID: ${USER_ID}\n`);

createTestRequest(userInput);
