# Guia: Deploy em Produção

Instruções passo-a-passo para publicar seu backend em diferentes plataformas.

## 🚀 Railway (RECOMENDADO)

Railway é a opção mais simples com melhor suporte para Node.js.

### Pré-requisitos
- Conta GitHub (cria em https://github.com)
- Repositório com seu código

### Passos

1. **Push para GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/alexa-claude.git
git push -u origin main
```

2. **Criar Conta Railway**
- Acessa https://railway.app
- Clica **Login with GitHub**

3. **Criar Novo Projeto**
- Clica **+ New Project**
- Seleciona **Deploy from GitHub repo**
- Autoriza GitHub
- Seleciona seu repositório `alexa-claude`

4. **Configurar Build**
- Railway detecta automaticamente Node.js
- Clica **Deploy**

5. **Adicionar Variáveis de Ambiente**
- No dashboard do projeto
- Clica **Variables**
- Adiciona cada uma do seu `.env`:
  - `ALEXA_SKILL_ID`
  - `CLAUDE_API_KEY`
  - `CLAUDE_MODEL`
  - `NODE_ENV=production`
  - `LOG_LEVEL=info`

6. **Obter URL Pública**
- No Railway, vai para **Deployments**
- Copia a URL (ex: `https://alexa-claude-prod.railway.app`)

7. **Configurar no Alexa**
- Alexa Developer Console → Endpoints
- URL: `https://alexa-claude-prod.railway.app/alexa/intent`
- Salva

8. **Verificar Saúde**
```bash
curl https://alexa-claude-prod.railway.app/health
```

### Custo
- Grátis até $5/mês
- Depois cobrado por uso

---

## 🐳 DigitalOcean App Platform

Alternativa com pricing fixo ($12/mês).

### Pré-requisitos
- Conta DigitalOcean
- Repositório GitHub

### Passos

1. **Criar `Dockerfile`** (já incluído no projeto)

2. **Push para GitHub** (mesmo processo acima)

3. **Criar Conta DigitalOcean**
- https://www.digitalocean.com
- Clica **Sign Up**

4. **Criar App**
- Dashboard → **Apps** → **Create Apps**
- Seleciona **GitHub**
- Autoriza GitHub
- Seleciona seu repositório

5. **Configurar Builder**
- Tipo: **Dockerfile**
- Port: `3000`
- Clica **Next**

6. **Adicionar Environment Variables**
- Clica **Edit** nas variáveis
- Adiciona cada uma:
  ```
  ALEXA_SKILL_ID=amzn1.ask.skill.xxxxx
  CLAUDE_API_KEY=sk-ant-xxxxx
  CLAUDE_MODEL=claude-3-5-sonnet-20241022
  NODE_ENV=production
  LOG_LEVEL=info
  ```

7. **Deploy**
- Clica **Create App**
- Espera ~5 minutos

8. **Obter URL**
- Dashboard mostra URL pública
- Exemplo: `https://alexa-claude-abc123.ondigitalocean.app`

9. **Configurar no Alexa**
- Endpoints → HTTPS
- URL: `https://alexa-claude-abc123.ondigitalocean.app/alexa/intent`

### Custo
- $12/mês (sempre)
- Escalável conforme demanda

---

## ☁️ AWS Lambda (Avançado)

Para máxima escalabilidade.

### Pré-requisitos
- Conta AWS
- AWS CLI instalado (`aws configure`)
- Serverless Framework

### Instalação

```bash
npm install -g serverless
serverless login
```

### Criar `serverless.yml`

```yaml
service: alexa-claude

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    CLAUDE_API_KEY: ${env:CLAUDE_API_KEY}
    ALEXA_SKILL_ID: ${env:ALEXA_SKILL_ID}

functions:
  alexa:
    handler: src/handlers/alexa.handler
    events:
      - http:
          path: alexa/intent
          method: post
          cors: true

plugins:
  - serverless-offline

package:
  individually: true
```

### Deploy

```bash
export CLAUDE_API_KEY=sk-ant-xxxxx
export ALEXA_SKILL_ID=amzn1.ask.skill.xxxxx

serverless deploy
```

Obterá URL como: `https://abc123.execute-api.us-east-1.amazonaws.com/dev/alexa/intent`

### Custo
- Grátis até 1M requisições/mês
- Depois $0.20 por 1M requisições

---

## 🏠 Deploy Próprio (VPS)

Se preferir controle total.

### Opções de VPS
- **Linode**: $5-10/mês
- **Vultr**: $2.50-5/mês
- **DigitalOcean Droplet**: $6+/mês
- **Hetzner**: €3-5/mês

### Passos Gerais

1. **Criar VPS com Ubuntu 22.04**

2. **Instalar Node.js**
```bash
curl -sL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs
```

3. **Instalar Nginx**
```bash
sudo apt-get install -y nginx
```

4. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/alexa-claude.git
cd alexa-claude
npm install
```

5. **Configurar Variáveis de Ambiente**
```bash
cp .env.example .env
nano .env
# Preenche com suas credenciais
```

6. **Usar PM2 para gerenciar processo**
```bash
sudo npm install -g pm2
pm2 start server.js --name "alexa-claude"
pm2 startup
pm2 save
```

7. **Configurar Nginx (Reverse Proxy)**

```nginx
# /etc/nginx/sites-available/default

server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **SSL com Let's Encrypt**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d seu-dominio.com
```

9. **Configurar HTTPS no Nginx**
```nginx
listen 443 ssl;
ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
```

10. **Configurar no Alexa**
- Endpoints → HTTPS
- URL: `https://seu-dominio.com/alexa/intent`

---

## ✅ Checklist Pré-Deploy

- [ ] `.env` configurado corretamente
- [ ] `CLAUDE_API_KEY` testada
- [ ] `ALEXA_SKILL_ID` correto
- [ ] `NODE_ENV=production`
- [ ] Logs configurados
- [ ] HTTPS ativado
- [ ] Rate limiting ativo
- [ ] Health check respondendo (`/health`)

## 🔍 Verificar Deploy

Após publicar, teste:

```bash
# Health check
curl https://seu-url.com/health

# Teste com Alexa
# Vá para Alexa Developer Console → Test
# Digite: "ask Claude what is AI"
```

## 🆘 Troubleshooting

### "502 Bad Gateway"
- Backend pode estar down
- Verifica logs: `pm2 logs` ou Dashboard do Railway
- Verifica variáveis de ambiente

### "Timeout"
- Claude API demorando
- Aumenta timeout em loadbalancer
- Railway/DigitalOcean têm 30s de timeout

### "Authentication failed"
- CLAUDE_API_KEY incorreta
- Verifica se começa com `sk-ant-`
- Regenera em console.anthropic.com

### Logs em Produção

**Railway:** Dashboard → Logs
**DigitalOcean:** App Platform → Logs
**AWS:** CloudWatch Logs
**VPS próprio:** `pm2 logs` ou `tail -f logs/combined.log`

---

## 🔄 Auto-Update

Para atualizar código sem downtime:

### Railway
- Qualquer push em `main` redeploy automaticamente

### DigitalOcean
- Mesmo: push automático ao GitHub

### VPS
```bash
cd /path/to/alexa-claude
git pull
npm install
pm2 restart alexa-claude
```

---

## 💰 Comparação de Custos

| Plataforma | Grátis | Startup | Custo |
|-----------|--------|---------|-------|
| Railway | Sim (até $5) | $5-20 | Bom |
| DigitalOcean | Não | $12/mês | Fixo |
| AWS Lambda | Sim (1M req) | Variável | Barato (alto volume) |
| VPS | Não | $5-10/mês | Barato (fixo) |

**Recomendação:** Railway para começar, DigitalOcean quando crescer.
