# 🚀 Quick Start (5 minutos)

Guia rápido para começar em 5 minutos.

## 1️⃣ Instalar Dependências

```bash
npm install
```

## 2️⃣ Configurar API Key do Claude

1. Vai para https://console.anthropic.com/
2. Copia sua API key (começa com `sk-ant-`)
3. Abre arquivo `.env` neste projeto
4. Substitui `CLAUDE_API_KEY=sk-ant-YOUR_KEY_HERE` pela sua chave

## 3️⃣ Rodar Servidor

```bash
npm run dev
```

Verás:
```
Server running on port 3000 [development]
Health check: http://localhost:3000/health
```

## 4️⃣ Testar Localmente

**Em outro terminal:**

```bash
node scripts/test-alexa-request.js "What is AI?"
```

Verás:
```
✅ Sucesso! Resposta:
{
  "version": "1.0",
  "response": {
    "outputSpeech": {
      "type": "PlainText",
      "text": "Artificial intelligence refers to the simulation of human intelligence..."
    }
  }
}
```

## 5️⃣ Próximos Passos

### Setup Alexa (10 min)
Siga `docs/ALEXA_SETUP.md` para:
1. Criar Skill no Alexa Developer Console
2. Apontar o endpoint para seu backend
3. Testar pelo console

### Deploy em Produção (5-15 min)
Escolha uma opção:
- **Railway** (recomendado): `docs/DEPLOYMENT.md#railway`
- **DigitalOcean**: `docs/DEPLOYMENT.md#digitalocean`
- **AWS Lambda**: `docs/DEPLOYMENT.md#aws-lambda`

## 📁 Arquivos Importantes

| Arquivo | Propósito |
|---------|-----------|
| `.env` | Suas credenciais (LOCAL, não commit) |
| `server.js` | App Express principal |
| `src/routes/alexa.js` | Handler de intents |
| `src/services/claudeService.js` | Chamadas à API Claude |
| `src/middleware/alexaValidator.js` | Validação de segurança |
| `docs/ALEXA_SETUP.md` | Setup Alexa skill |
| `docs/DEPLOYMENT.md` | Deploy em produção |
| `docs/SECURITY.md` | Detalhes de segurança |

## ⚠️ Importante

- ✅ Guarda `.env` local, nunca faz commit
- ✅ `CLAUDE_API_KEY` é secreto
- ✅ Em produção, use HTTPS
- ✅ Testa tudo localmente antes de deploy

## 🆘 Problemas Comuns

### "Cannot find module '@anthropic-ai/sdk'"
```bash
npm install
```

### "CLAUDE_API_KEY not found"
- Verifica se `.env` existe
- Verifica se preencheu `CLAUDE_API_KEY`

### "ECONNREFUSED" ao testar
- Verifica se `npm run dev` está rodando
- Tenta acesar http://localhost:3000/health

## 📞 Precisa de Ajuda?

Vê os arquivos na pasta `docs/`:
- `ALEXA_SETUP.md` - Setup Alexa
- `DEPLOYMENT.md` - Deploy
- `SECURITY.md` - Segurança
- `README.md` - Documentação completa

---

**Pronto!** Você tem um backend Alexa + Claude funcionando localmente. 🎉

Agora siga `docs/ALEXA_SETUP.md` para conectar sua Alexa Skill.
