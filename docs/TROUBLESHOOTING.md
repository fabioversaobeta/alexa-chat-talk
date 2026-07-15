# 🔧 Troubleshooting Guide

Guia completo para resolver erros comuns na aplicação Alexa + Claude.

## 🚨 Erros Comuns e Soluções

### 1. Model Not Found (404)

**Erro:**
```
{"error":"404 {\"type\":\"error\",\"error\":{\"type\":\"not_found_error\",\"message\":\"model: claude-3-5-sonnet-20241022\"}
```

**Causa:** Nome do modelo inválido ou modelo não existe.

**Solução:**
```bash
# Edita .env e usa:
CLAUDE_MODEL=claude-3-5-sonnet-latest
# ou
CLAUDE_MODEL=claude-opus-4-1
# ou
CLAUDE_MODEL=claude-3-5-sonnet-latest
```

**Verificar modelos disponíveis:**
- https://console.anthropic.com/docs/models

---

### 2. Invalid API Key (401/403)

**Erro:**
```
status: 401
message: "Invalid API key"
```

**Causa:** API key do Claude inválida, expirada ou mal formatada.

**Solução:**
1. Vai para https://console.anthropic.com/
2. Login
3. Cria nova API key (Settings → API Keys)
4. Substitui em `.env`:
   ```bash
   CLAUDE_API_KEY=sk-ant-NOVO_KEY_AQUI
   ```
5. Reinicia servidor: `npm run dev`

**Verificar API key:**
```bash
# Deve começar com sk-ant-
echo $CLAUDE_API_KEY
```

---

### 3. Rate Limited (429)

**Erro:**
```
status: 429
message: "Rate limit exceeded"
```

**Causa:** Muitas requisições ao Claude em pouco tempo.

**Solução:**
- Aguarda ~60 segundos
- Ou aumenta o limit em `.env`:
  ```bash
  RATE_LIMIT_MAX_REQUESTS=20  # Ao invés de 10
  ```

**Verificar rate limits:**
```bash
# Últimos 60 segundos de logs
tail -f logs/combined.log | grep "rate"
```

---

### 4. "Cannot find module" Error

**Erro:**
```
Cannot find module '@anthropic-ai/sdk'
Error: Cannot find module 'express'
```

**Causa:** Dependências não instaladas.

**Solução:**
```bash
# Instalar todas as dependências
npm install

# Ou reinstalar tudo
rm -rf node_modules package-lock.json
npm install
```

---

### 5. ECONNREFUSED (Servidor não está rodando)

**Erro ao testar:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Causa:** Servidor Node.js não está rodando ou porta diferente.

**Solução:**
```bash
# Verificar se servidor está rodando
ps aux | grep node

# Se não estiver, inicia:
npm run dev

# Ou se quiser em background:
npm start &

# Testar se está respondendo:
curl http://localhost:3000/health
```

---

### 6. "Invalid Signature" (Alexa Validation)

**Erro:**
```
status: 403
error: "Invalid request"
```

**Causa:** 
- Assinatura Alexa inválida
- Timestamp expirado (>150 segundos)
- Skill ID não corresponde

**Solução:**

**Para testes locais:**
- O header `Signature: local-signature-test` pula a validação em development
- Script de teste usa isso automaticamente

**Para produção:**
- Validação é obrigatória (a Alexa envia assinatura correta)
- Verifica se `ALEXA_SKILL_ID` está correto:
  ```bash
  echo $ALEXA_SKILL_ID
  # Deve ser: amzn1.ask.skill.xxxxx-xxxxx-xxxxx
  ```

---

### 7. Timeout (Alexa não responde)

**Erro:**
```
Request timed out
Alexa did not receive a response within 8 seconds
```

**Causa:** Backend demorou demais para responder.

**Solução:**

1. **Reduzir tokens da resposta:**
   ```bash
   # Em .env
   CLAUDE_MAX_TOKENS=256  # Ao invés de 1024
   ```

2. **Verificar logs do servidor:**
   ```bash
   tail -f logs/combined.log
   ```

3. **Aumentar timeout em Alexa** (não é possível - máx 8s)

4. **Verificar latência Claude:**
   ```bash
   # Teste manualmente
   curl -X POST https://api.anthropic.com/v1/messages \
     -H "x-api-key: $CLAUDE_API_KEY" \
     -d '{"model":"claude-3-5-sonnet-latest","messages":[{"role":"user","content":"hi"}]}'
   ```

---

### 8. "Please ask me something" (Sem input)

**Erro:**
```json
{
  "error": "No input provided"
}
```

**Causa:** User não disse nada ou Alexa não reconheceu a fala.

**Solução:**
- User precisa dizer: "Ask Claude what is AI?"
- Não basta: "Ask Claude"
- Verificar intent no Alexa Developer Console:
  - GetAnswerIntent precisa ter slot `userInput`

---

### 9. "Dangerous pattern detected"

**Erro:**
```
status: 400
error: "Invalid input - suspicious patterns detected"
```

**Causa:** Input contém padrão perigoso (prompt injection attempt).

**Exemplo de inputs bloqueados:**
```
❌ "ignore previous instructions"
❌ "system prompt"
❌ "{{template}}"
❌ "eval(...)"
```

**Solução:**
- Padrão de segurança está funcionando ✅
- Se for input legítimo, ajusta em `src/middleware/inputSanitizer.js`:
  ```javascript
  const DANGEROUS_PATTERNS = [
    // Remove padrões desnecessários
  ];
  ```

---

### 10. 404 "Not found"

**Erro:**
```
status: 404
error: "Not found"
```

**Causa:** 
- Rota não existe
- URL está errada
- Endpoint não está registrado

**Solução:**

**Verificar endpoints disponíveis:**
```bash
# Health check
curl http://localhost:3000/health

# Alexa endpoint (POST)
curl -X POST http://localhost:3000/alexa/intent \
  -H "Content-Type: application/json" \
  -H "Signature: local-signature-test" \
  -d '{...}'
```

**Endpoints válidos:**
- `GET /health` - Health check
- `POST /alexa/intent` - Intent handler

---

## 🔍 Debug Avançado

### Ver Logs em Tempo Real

```bash
# Todos os logs
tail -f logs/combined.log

# Apenas erros
tail -f logs/error.log

# Filtrar por palavra
tail -f logs/combined.log | grep "Claude"

# Com timestamp
tail -f logs/combined.log | grep --line-buffered "2026-07-15"
```

### Teste Completo de Integração

```bash
# 1. Verifica se servidor está rodando
curl http://localhost:3000/health

# 2. Verifica API key do Claude
echo "API Key formato: $(echo $CLAUDE_API_KEY | cut -c1-10)..."

# 3. Testa com script
node scripts/test-alexa-request.js "Hello world"

# 4. Vê logs em tempo real
tail -f logs/combined.log
```

### Inspecionar Request/Response

```javascript
// Em src/routes/alexa.js, adiciona debug:
logger.debug('Full request body:', JSON.stringify(req.body, null, 2));
logger.debug('Claude response:', claudeResponse);
```

---

## 📊 Comandos Úteis

| Comando | Propósito |
|---------|-----------|
| `npm run dev` | Inicia servidor em development (hot-reload) |
| `npm start` | Inicia servidor em production |
| `npm test` | Roda testes |
| `node scripts/test-alexa-request.js "pergunta"` | Testa manualmente |
| `tail -f logs/combined.log` | Vê logs em tempo real |
| `curl http://localhost:3000/health` | Verifica saúde do server |
| `ps aux \| grep node` | Vê processos Node rodando |
| `kill -9 PID` | Mata processo Node |

---

## 🆘 Checklist de Debug

Quando algo não funciona, segue este checklist:

- [ ] Servidor está rodando? (`npm run dev`)
- [ ] `.env` existe e está preenchido?
- [ ] `CLAUDE_API_KEY` está correto?
- [ ] `ALEXA_SKILL_ID` está correto?
- [ ] Health check passa? (`curl localhost:3000/health`)
- [ ] Logs mostram erro específico? (`tail -f logs/combined.log`)
- [ ] Conexão à internet está OK?
- [ ] API key não expirou?
- [ ] Rate limit não foi acionado?
- [ ] Em produção? Verifica variáveis de ambiente lá também

---

## 🤖 Quando Pedir Ajuda

Se ainda não conseguir resolver, forneça:

1. **O erro exato** (copie da saída)
2. **Logs relevantes** (últimas 10-20 linhas)
3. **O que fez antes do erro** (passo-a-passo)
4. **Environment** (dev/prod, onde está rodando)

**Exemplo de boa descrição:**
```
Erro: status 429 ao testar com o script
Comando: node scripts/test-alexa-request.js "what is AI?"
Logs: [últimas 5 linhas do error.log]
Environment: development, localhost:3000
Já tentei: reiniciar servidor, limpar cache
```

---

## 📞 Recursos

- [Claude API Docs](https://console.anthropic.com/docs)
- [Alexa Skills Kit](https://developer.amazon.com/docs/ask-overviews/what-is-the-alexa-skills-kit.html)
- [Node.js Docs](https://nodejs.org/docs/)
- [Express Docs](https://expressjs.com/)
