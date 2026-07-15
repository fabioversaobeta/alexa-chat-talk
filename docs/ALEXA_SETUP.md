# Guia: Setup Alexa Skill para Claude Assistant

Este guia cobre como criar e configurar sua Alexa Skill para integrar com o backend Claude.

## 📋 Pré-requisitos

- Conta Amazon (crie em https://www.amazon.com se não tiver)
- Developer account ativada (https://developer.amazon.com/)
- Backend Node.js rodando (localmente ou publicado)

## ✅ Etapa 1: Criar Alexa Skill

1. Acesse https://developer.amazon.com/
2. Faça login com sua conta Amazon
3. Vá para **Alexa → Alexa Skills Kit**
4. Clique em **Create Skill**

## ⚙️ Etapa 2: Configurar Skill Básico

**Nome da Skill:**
- Nome: `Claude Assistant` (ou seu nome)
- Idioma: `Portuguese (Brazil)` ou `English (US)`
- Clique: **Create Skill**

**Tipo de Skill:**
- Selecione: **Custom**
- Clique: **Next**

**Hospedagem:**
- Selecione: **Alexa-hosted (Node.js)** ou **Self-hosted web service**
- Clique: **Create Skill**

> Se escolheu "Self-hosted", use a URL do seu backend (ex: `https://seu-backend.com`)

## 🎯 Etapa 3: Configurar Intents

### 3.1 Acessar Build

1. Clique na aba **Build** (topo)
2. No menu esquerdo: **Interaction Model → Intents**

### 3.2 Criar GetAnswerIntent

1. Clique: **+ Add Intent**
2. Nome: `GetAnswerIntent`
3. Clique: **Create custom intent**

### 3.3 Adicionar Samples (Utterances)

Na seção **Sample Utterances**, adicione as seguintes frases (usuários dirão assim):

```
{userInput}
Ask Claude about {userInput}
What does Claude think about {userInput}
Ask {userInput}
What is {userInput}
Tell me about {userInput}
```

Clique em cada linha para confirmar.

### 3.4 Criar Slot userInput

1. Role até **Intent Slots**
2. Clique: **+ Add Slot**
3. Nome: `userInput`
4. Type: `AMAZON.AlphaNumeric` (ou `AMAZON.Food`, `AMAZON.Person`, etc conforme necessário)
5. Marque como **Required** se quiser
6. Clique: **Save Model**

### 3.5 Adicionar Built-in Intents

O Alexa automaticamente fornece estes intents (não precisa criar):
- `AMAZON.HelpIntent`
- `AMAZON.StopIntent`
- `AMAZON.CancelIntent`
- `AMAZON.FallbackIntent`

## 📡 Etapa 4: Configurar Endpoint

1. Clique na aba **Build**
2. No menu esquerdo: **Endpoints**
3. Tipo: **HTTPS**

**Default Region:**
- URL: `https://seu-backend-url.com/alexa/intent`
- Certificado SSL: Selecione `My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority`

4. Clique: **Save Endpoints**

> Se estás em development local, use o URL temporário do ngrok: `https://seu-ngrok-url.io/alexa/intent`

### 4.1 Setup Local com ngrok (Opcional)

Para testar localmente:

```bash
# Terminal 1: Rodando servidor local
npm run dev
# Rodando em http://localhost:3000

# Terminal 2: Criar tunnel ngrok
ngrok http 3000
# Obterá URL como: https://abc123.ngrok.io

# Copiar a URL HTTPS no Alexa: https://abc123.ngrok.io/alexa/intent
```

## 🔑 Etapa 5: Obter Skill ID

1. Clique na aba **Build**
2. No menu: **Skill ID** (à esquerda embaixo)
3. Copie o ID (ex: `amzn1.ask.skill.xxxxx-xxxxx-xxxxx`)
4. Cole no seu `.env`:

```bash
ALEXA_SKILL_ID=amzn1.ask.skill.xxxxx-xxxxx-xxxxx
```

5. Reinicie o servidor:
```bash
npm run dev
```

## 🧪 Etapa 6: Testar a Skill

### 6.1 Usando o Teste do Console

1. Vá para a aba **Test** (topo)
2. Selecione: **Development** (em "Skill testing is enabled in")
3. Na caixa de texto, digite:
   ```
   ask Claude what is artificial intelligence
   ```
4. Pressione Enter ou clique o microfone
5. Veja a resposta do Claude!

### 6.2 Usando Alexa Device

Se tiver um Alexa (Echo, Dot, etc):

1. Abra a app Alexa no seu telefone
2. Vá para **Skills & Games → Your Skills**
3. Procure por `Claude Assistant`
4. Clique para ativar
5. Diga: "Alexa, ask Claude Assistant what is AI?"

## 🎤 Etapa 7: Configurar Invocation Name

O invocation name é como o usuário chama sua skill.

1. Vá para **Interaction Model** (menu esquerda)
2. Clique em **Invocation Name**
3. Digite: `Claude` ou `Claude Assistant` (o que preferir)
4. Clique: **Save Model**

> Usuários dirão: "Alexa, ask Claude what is AI?"

## 🛠️ Etapa 8: Testar Diferentes Intents

### Test LaunchRequest
```
open Claude
```

### Test GetAnswerIntent
```
ask Claude what is machine learning
Claude tell me about Python programming
```

### Test HelpIntent
```
ask Claude for help
```

### Test StopIntent
```
tell Claude to stop
```

## 🔍 Troubleshooting

### ❌ "Skill not found"
- Verifica se estás na aba **Test**
- Seleciona **Development** em "Skill testing is enabled in"
- Espera 1 minuto após salvar o modelo

### ❌ "The remote endpoint could not be called"
- Verifica a URL do endpoint (deve ser HTTPS)
- Testa manualmente: `curl https://seu-url.com/alexa/intent`
- Verifica se o servidor está rodando
- Se local, usa ngrok para gerar URL HTTPS

### ❌ "Timeout"
- O backend demorando demais a responder
- Aumenta `CLAUDE_MAX_TOKENS` em `.env`? (menor = mais rápido)
- Verifica logs do servidor para erros

### ❌ "Invalid Signature"
- Em **production**, a assinatura Alexa é validada
- Em **development**, o middleware pula a validação se for teste local

## 📝 Integração Manual com Backend

Se o Alexa não conseguir chamar seu endpoint automaticamente:

1. Usa URL ngrok em development
2. Publica o backend em Railway/DigitalOcean/AWS para produção
3. Atualiza o endpoint no console Alexa
4. Testa novamente

## ✨ Próximos Passos

1. Customize o invocation name
2. Adicione mais intents se necessário (ex: intents diferentes para diferentes tipos de perguntas)
3. Configure a skill como "Alexa-hosted" para gerenciar tudo no console (avançado)
4. Publique a skill em beta (Distribute → Beta Testing)

## 📚 Recursos Adicionais

- [Alexa Developer Documentation](https://developer.amazon.com/docs/ask-overviews/what-is-the-alexa-skills-kit.html)
- [ASK CLI Reference](https://developer.amazon.com/docs/smapi/ask-cli-intro.html)
- [Interaction Model JSON Format](https://developer.amazon.com/docs/custom-skills/interaction-model-schema.html)
