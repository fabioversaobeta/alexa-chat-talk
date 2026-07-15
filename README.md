# Alexa + Claude API Integration

Backend Node.js que integra uma Alexa Skill com a API do Claude para criar um assistente de voz inteligente.

## 🚀 Quick Start

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```bash
CLAUDE_API_KEY=sk-ant-YOUR_API_KEY_HERE
ALEXA_SKILL_ID=amzn1.ask.skill.YOUR_SKILL_ID
```

### 3. Iniciar servidor em desenvolvimento

```bash
npm run dev
```

Servidor rodando em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
alexa-claude-backend/
├── server.js                    # Entry point
├── package.json                 # Dependências
├── .env                         # Variáveis de ambiente (local)
├── .env.example                 # Template seguro
│
├── src/
│   ├── config/
│   │   ├── env.js              # Validação de environment
│   │   └── security.js         # Configurações de segurança
│   │
│   ├── middleware/
│   │   ├── alexaValidator.js   # Valida assinatura Alexa (CRÍTICO)
│   │   ├── rateLimiter.js      # Proteção contra abuso
│   │   ├── inputSanitizer.js   # Remove XSS e injection
│   │   ├── errorHandler.js     # Tratamento centralizado de erros
│   │   └── requestLogger.js    # Logging de requisições
│   │
│   ├── services/
│   │   ├── claudeService.js    # Integração com Claude API
│   │   └── alexaResponseService.js # Formata respostas Alexa
│   │
│   ├── routes/
│   │   └── alexa.js            # Handler de intents
│   │
│   └── utils/
│       ├── logger.js           # Winston logger
│       └── validators.js       # Funções de validação
│
└── docs/
    └── ALEXA_SETUP.md          # Guia de setup do Alexa Developer Console
```

## 🔐 Segurança

### Camadas de Proteção Implementadas

1. **Validação Alexa** - Verifica certificado + assinatura SHA-256 + timestamp
2. **Rate Limiting** - 10 req/min por usuário Alexa
3. **Input Sanitization** - Remove XSS e detecta prompt injection
4. **Secrets Management** - API keys em .env (nunca em código)
5. **HTTPS obrigatório** - Em produção

### Proteção contra Prompt Injection

O middleware `inputSanitizer.js` detecta padrões perigosos:
- "ignore previous instructions"
- "system prompt"
- "jailbreak"
- Templates ({{ }})
- Eval/exec commands

## 🔌 Endpoints

### POST `/alexa/intent`
Endpoint principal que recebe requisições da Alexa Skill.

**Headers necessários (Alexa adiciona automaticamente):**
- `SignatureCertChainUrl` - URL do certificado Amazon
- `Signature` - Assinatura SHA-256
- `Content-Type: application/json`

**Body:**
```json
{
  "version": "1.0",
  "session": { ... },
  "context": { ... },
  "request": {
    "type": "IntentRequest",
    "intent": {
      "name": "GetAnswerIntent",
      "slots": {
        "userInput": {
          "value": "What is artificial intelligence?"
        }
      }
    }
  }
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

## 🧪 Testes Locais

### Teste com script Node.js

```bash
node scripts/test-alexa-request.js "What is AI?"
```

### Teste com curl

```bash
curl -X POST http://localhost:3000/alexa/intent \
  -H "Content-Type: application/json" \
  -H "SignatureCertChainUrl: https://s3.amazonaws.com/echo.api/local-cert" \
  -H "Signature: local-signature-test" \
  -d '{
    "version": "1.0",
    "session": { "new": true, "sessionId": "test" },
    "context": {
      "System": {
        "application": { "applicationId": "amzn1.ask.skill.local-development" },
        "user": { "userId": "test-user" }
      }
    },
    "request": {
      "type": "IntentRequest",
      "requestId": "test",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "intent": {
        "name": "GetAnswerIntent",
        "slots": {
          "userInput": { "value": "Hello!" }
        }
      }
    }
  }'
```

## 📊 Logging

Logs são salvos em `logs/`:
- `error.log` - Apenas erros
- `combined.log` - Todos os logs

Em development, logs aparecem também no console.

**Dados sensíveis nunca são logados:**
- API keys
- User IDs completos
- Tokens de autenticação

## 🚀 Deploy

### Railway (Recomendado)

1. Criar conta em https://railway.app
2. Conectar seu repositório GitHub
3. Configurar variáveis de environment
4. Deploy automático

URL pública será gerada automaticamente.

### DigitalOcean App Platform

1. Push código para GitHub
2. Criar aplicação em DigitalOcean
3. Conectar repositório
4. Deploy

### AWS Lambda

Usar Serverless Framework:
```bash
serverless deploy
```

Veja `docs/DEPLOYMENT.md` para instruções detalhadas.

## 🔧 Configuração do Alexa Developer Console

Veja `docs/ALEXA_SETUP.md` para guia passo-a-passo completo.

**Resumo:**
1. Criar Alexa Skill no Developer Console
2. Configurar intent `GetAnswerIntent`
3. Apontar endpoint para sua URL (ex: `https://seu-backend.com/alexa/intent`)
4. Copiar Skill ID para `.env`

## 📝 Variáveis de Environment

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `ALEXA_SKILL_ID` | ID da Alexa Skill | `amzn1.ask.skill.xxxxx` |
| `CLAUDE_API_KEY` | API key do Claude | `sk-ant-...` |
| `CLAUDE_MODEL` | Modelo Claude a usar | `claude-3-5-sonnet-20241022` |
| `CLAUDE_MAX_TOKENS` | Máximo de tokens na resposta | `1024` |
| `NODE_ENV` | Ambiente (dev/prod) | `production` |
| `PORT` | Porta do servidor | `3000` |
| `LOG_LEVEL` | Nível de log (debug/info/warn/error) | `info` |
| `ALLOWED_ORIGINS` | Origins permitidos para CORS | `https://alexa.example.com` |
| `RATE_LIMIT_WINDOW_MS` | Janela de rate limit (ms) | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Requisições por janela | `10` |

## 🐛 Troubleshooting

### "Invalid Signature"
- Verifica se estás testando localmente com a flag correta em `alexaValidator.js`
- Em produção, a assinatura Alexa será validada corretamente

### "CLAUDE_API_KEY not found"
- Verifica se `.env` existe e tem `CLAUDE_API_KEY`
- Não commita `.env` em produção

### "Skill ID mismatch"
- Copia o Skill ID correto do Alexa Developer Console
- Coloca em `.env` como `ALEXA_SKILL_ID`

### Rate limit exceeded
- Aumenta `RATE_LIMIT_MAX_REQUESTS` em `.env` se legítimo
- Ou usa Redis para distribuição em múltiplas instâncias

## 📚 Documentação Adicional

- `docs/ALEXA_SETUP.md` - Setup completo do Alexa Developer Console
- `docs/DEPLOYMENT.md` - Instruções de deploy em diferentes plataformas
- `docs/SECURITY.md` - Detalhes de segurança

## 🤝 Contribuir

Pull requests são bem-vindos!

## 📄 Licença

MIT
