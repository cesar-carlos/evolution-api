### Instalação da Evolution API no Ubuntu 24.04 com NVM (Node 20)

Este guia orienta a instalar e configurar a Evolution API no Ubuntu 24.04 usando NVM (Node 20), com passos opcionais para PostgreSQL, Redis e PM2.

### 1) Atualize o sistema
```bash
sudo apt update && sudo apt -y upgrade
```

### 2) (Opcional) Instalar PostgreSQL 16
```bash
sudo apt -y install postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres psql <<'SQL'
CREATE USER evolutionv2 WITH PASSWORD 'TroqueEstaSenha';
ALTER USER evolutionv2 CREATEDB;
CREATE DATABASE evolution OWNER evolutionv2;
SQL
```
Anote a connection string (exemplo):
```
postgresql://evolutionv2:TroqueEstaSenha@localhost:5432/evolution?schema=public
```

### 3) (Opcional) Instalar Redis
```bash
sudo apt -y install redis-server
sudo systemctl enable --now redis-server
redis-cli ping  # deve retornar PONG
```

### 4) Instalar NVM e Node 20
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \ . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \ . "$NVM_DIR/bash_completion"

nvm install 20
nvm use 20
nvm alias default 20
node -v
```

### 5) Clonar o repositório
```bash
cd ~
git clone https://github.com/cesar-carlos/evolution-api.git
cd evolution-api
```

### 6) Instalar dependências e configurar ambiente
```bash
nvm use
npm ci

# Copiar exemplo de env (ajuste conforme sua necessidade)
cp .env.example .env 2>/dev/null || true
```

Abra o `.env` e ajuste, por exemplo:
```
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=http://localhost:8080
AUTHENTICATION_API_KEY=troque-esta-chave

# Se for usar PostgreSQL
# DATABASE_CONNECTION_URI="postgresql://evolutionv2:TroqueEstaSenha@localhost:5432/evolution?schema=public"
# DATABASE_PROVIDER=postgresql

# Cache
CACHE_REDIS_ENABLED=false
CACHE_LOCAL_ENABLED=true
```

### 7) Banco de dados (se usar Prisma/PostgreSQL)
```bash
npm run db:generate
npm run db:deploy
```

### 8) Build e start de produção
```bash
npm run build
npm run start:prod
# Logs devem indicar: HTTP - ON: 8080
```

### 9) (Opcional) Gerenciar com PM2
```bash
sudo npm -g install pm2
pm2 start "npm run start:prod" --name evolution-api
pm2 save
pm2 startup
```

### 10) Testar
```bash
curl -i http://localhost:8080/
```

### Dicas
- Para alterar a porta: `SERVER_PORT=3000 npm run start:prod` ou ajuste no `.env`.
- Dentro do projeto com `.nvmrc`, `nvm use` seleciona automaticamente o Node recomendado.
- Se usar Redis/Postgres, garanta que serviços estão ativos e credenciais corretas no `.env`.


