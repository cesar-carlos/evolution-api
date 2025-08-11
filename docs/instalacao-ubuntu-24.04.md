## Guia de instalação — Ubuntu 24.04 (Noble)

Este passo a passo instala e configura o Evolution API como serviço no Ubuntu 24.04, utilizando Node.js 20 via nvm, com build de produção e serviço systemd.

### 1) Pré‑requisitos
- Acesso sudo ao servidor Ubuntu 24.04
- Porta de aplicação liberada (padrão 8080) ou um proxy reverso (ex.: NGINX)

### 2) Atualize o sistema e instale dependências
```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install build-essential git curl ffmpeg redis-server

# (Opcional) PostgreSQL 16, caso vá persistir dados com banco
# sudo apt -y install postgresql postgresql-contrib
```

Ative o Redis (opcional, caso use cache/instâncias em Redis):
```bash
sudo systemctl enable --now redis-server
sudo systemctl status redis-server --no-pager
```

### 3) Instale o nvm e Node.js 20
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \ . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \ . "$NVM_DIR/bash_completion"

nvm install 20
nvm alias default 20
node -v
```

### 4) Obtenha o código-fonte
```bash
cd ~
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api
```

### 5) Configure variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto (ajuste conforme sua necessidade). Exemplo mínimo:
```bash
cat > .env << 'EOF'
# Servidor
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=http://localhost:8080

# Autenticação (chave global de API)
AUTHENTICATION_API_KEY=troque-esta-chave

# Cache Redis (opcional)
CACHE_REDIS_ENABLED=false
CACHE_LOCAL_ENABLED=true

# Banco de dados (opcional)
# DATABASE_CONNECTION_URI="postgresql://usuario:senha@localhost:5432/evolution?schema=public"
# DATABASE_PROVIDER=postgresql
# DATABASE_SAVE_DATA_INSTANCE=false

# WebSocket (opcional)
WEBSOCKET_ENABLED=false
WEBSOCKET_GLOBAL_EVENTS=false
EOF
```

Se for usar PostgreSQL, crie o banco/usuário e defina `DATABASE_CONNECTION_URI` adequadamente.

### 6) Instale dependências e gere build de produção
```bash
nvm use 20
npm ci
npm run build
```

### 7) Teste localmente
```bash
npm run start:prod
# Logs devem indicar: HTTP - ON: 8080
# Em outro terminal: curl -i http://localhost:8080
```

### 8) (Opcional) Proxy reverso com NGINX
```bash
sudo apt -y install nginx
sudo tee /etc/nginx/sites-available/evolution-api >/dev/null <<'NGINX'
server {
    listen 80;
    server_name SEU_DOMINIO_AQUI;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
sudo ln -s /etc/nginx/sites-available/evolution-api /etc/nginx/sites-enabled/evolution-api
sudo nginx -t && sudo systemctl reload nginx
```

### 9) Rodar como serviço (systemd)
Crie um serviço systemd que carrega o nvm e inicia o `start:prod`:
```bash
sudo tee /etc/systemd/system/evolution-api.service >/dev/null <<'UNIT'
[Unit]
Description=Evolution API (Node 20 via nvm)
After=network.target

[Service]
Type=simple
User=%i
WorkingDirectory=/home/%i/evolution-api
Environment=PORT=8080
Environment=NODE_ENV=PROD
EnvironmentFile=-/etc/default/evolution-api
ExecStart=/bin/bash -lc 'source ~/.nvm/nvm.sh && cd /home/%i/evolution-api && nvm use 20 && npm run start:prod'
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

# Arquivo de variáveis (opcional)
sudo tee /etc/default/evolution-api >/dev/null <<'ENV'
# Exemplo: sobrepor/definir variáveis adicionais
# SERVER_PORT=8080
# AUTHENTICATION_API_KEY=troque-esta-chave
ENV

# Habilite e inicie o serviço para o usuário atual
sudo systemctl daemon-reload
sudo systemctl enable evolution-api@$USER
sudo systemctl start evolution-api@$USER
sudo systemctl status evolution-api@$USER --no-pager
```

Logs do serviço:
```bash
journalctl -u evolution-api@$USER -f --no-pager
```

### 10) Firewall (UFW)
Se estiver expondo direto na porta 8080:
```bash
sudo ufw allow 8080/tcp
```
Se usa NGINX com HTTP (80) / HTTPS (443):
```bash
sudo ufw allow 'Nginx Full'
```

### 11) Atualização do servidor
```bash
cd ~/evolution-api
git pull
nvm use 20
npm ci
npm run build
sudo systemctl restart evolution-api@$USER
```

### 12) Dicas e solução de problemas
- Porta padrão: 8080. Para alterar, defina `SERVER_PORT` no `.env` ou no systemd.
- Caso falte dependências do Node: verifique `nvm use 20` e reinstale com `npm ci`.
- Redis/PostgreSQL são opcionais; habilite e configure conforme sua necessidade.
- Para expor via domínio/HTTPS, use NGINX + Certbot (LetsEncrypt).


