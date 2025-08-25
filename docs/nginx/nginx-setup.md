# Manual de Configuração do Nginx para Evolution API

## Visão Geral

Este manual fornece instruções passo a passo para configurar o Nginx como proxy reverso para a Evolution API no domínio `evo.se7esistemassinop.com.br`. Este guia permitirá que você reconfigure o servidor em caso de migração.

## Informações do Projeto

- **Domínio:** `evo.se7esistemassinop.com.br`
- **API Evolution:** Porta 8080 (Docker)
- **Versão atual:** 2.3.1
- **Manager:** Disponível em `/manager`
- **Documentação:** Disponível em `/docs`

## Pré-requisitos

- Servidor Ubuntu/Debian com Docker instalado
- Domínio apontando para o IP do servidor
- Docker e Docker Compose funcionando
- Acesso root ou sudo

## 1. Instalação do Nginx

```bash
# Atualizar repositórios
sudo apt update

# Instalar Nginx
sudo apt install nginx -y

# Verificar status
sudo systemctl status nginx

# Habilitar inicialização automática
sudo systemctl enable nginx
```

## 2. Configuração do Evolution API (Docker)

Certifique-se de que o docker-compose.yaml está configurado corretamente:

```yaml
services:
  api:
    container_name: evolution_api
    image: evoapicloud/evolution-api:latest
    restart: always
    ports:
      - "127.0.0.1:8080:8080"  # Bind apenas no localhost
    # ... outras configurações
```

**Importante:** Modifique o `docker-compose.yaml` para que a porta 8080 seja acessível apenas pelo localhost (`127.0.0.1:8080:8080`) por segurança.

## 3. Configuração do Nginx

### 3.1 Criar o arquivo de configuração

```bash
sudo nano /etc/nginx/sites-available/evo.se7esistemassinop.com.br
```

### 3.2 Configuração completa do site

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name evo.se7esistemassinop.com.br www.evo.se7esistemassinop.com.br;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

# Configuração HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name evo.se7esistemassinop.com.br www.evo.se7esistemassinop.com.br;

    # Configurações SSL (serão preenchidas pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/evo.se7esistemassinop.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/evo.se7esistemassinop.com.br/privkey.pem;
    
    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Configurações de upload e timeout
    client_max_body_size 100M;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;

    # Logs
    access_log /var/log/nginx/evolution-api-access.log;
    error_log /var/log/nginx/evolution-api-error.log;

    # Cabeçalhos de segurança
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy para Evolution API
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,apikey' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
    }

    # Configuração específica para WebSocket (se necessário)
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3.3 Ativar a configuração

```bash
# Habilitar o site
sudo ln -s /etc/nginx/sites-available/evo.se7esistemassinop.com.br /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## 4. Instalação e Configuração do SSL (Let's Encrypt)

### 4.1 Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 4.2 Obter certificados SSL

```bash
sudo certbot --nginx -d evo.se7esistemassinop.com.br -d www.evo.se7esistemassinop.com.br
```

**Responda às perguntas:**
- Email: Insira um email válido
- Termos: Aceite (Y)
- Compartilhar email: Opção sua (Y/N)

### 4.3 Configurar renovação automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Configurar cron para renovação automática
sudo crontab -e

# Adicionar linha (verificar renovação diariamente às 3h da manhã):
0 3 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

## 5. Configuração de Firewall

```bash
# Permitir tráfego HTTP e HTTPS
sudo ufw allow 'Nginx Full'

# Verificar status
sudo ufw status
```

## 6. Configurações da Evolution API (.env)

No arquivo `.env` da Evolution API, certifique-se de ter:

```env
# Configurações do servidor
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=https://evo.se7esistemassinop.com.br

# SSL (não necessário se usando nginx como proxy)
# SSL_CONF_PRIVKEY=
# SSL_CONF_FULLCHAIN=

# CORS
CORS_ORIGIN=https://evo.se7esistemassinop.com.br,https://www.evo.se7esistemassinop.com.br
CORS_METHODS=POST,GET,PUT,DELETE
CORS_CREDENTIALS=true
```

## 7. Comandos Úteis de Manutenção

### Verificar status dos serviços

```bash
# Status do Nginx
sudo systemctl status nginx

# Status do Docker
sudo docker ps

# Status da Evolution API
sudo docker logs evolution_api
```

### Reiniciar serviços

```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar Evolution API
sudo docker-compose restart

# Recarregar configuração Nginx (sem interrupção)
sudo nginx -s reload
```

### Logs e Monitoramento

```bash
# Ver logs do Nginx
sudo tail -f /var/log/nginx/evolution-api-access.log
sudo tail -f /var/log/nginx/evolution-api-error.log

# Ver logs da Evolution API
sudo docker logs -f evolution_api
```

## 8. Backup da Configuração

Sempre faça backup das configurações importantes:

```bash
# Criar diretório de backup
sudo mkdir -p /root/backup/nginx

# Backup da configuração do Nginx
sudo cp /etc/nginx/sites-available/evo.se7esistemassinop.com.br /root/backup/nginx/

# Backup do docker-compose
cp docker-compose.yaml /root/backup/

# Backup do .env (cuidado com dados sensíveis)
cp .env /root/backup/env.backup
```

## 9. Resolução de Problemas

### Erro 502 Bad Gateway

```bash
# Verificar se Evolution API está rodando
sudo docker ps

# Verificar logs
sudo docker logs evolution_api

# Reiniciar container
sudo docker-compose restart
```

### Erro de SSL

```bash
# Testar certificados
sudo certbot certificates

# Forçar renovação
sudo certbot renew --force-renewal
```

### Verificar conectividade

```bash
# Testar conexão local
curl -I http://127.0.0.1:8080

# Testar HTTPS
curl -I https://evo.se7esistemassinop.com.br
```

## 10. Segurança Adicional

### Limitar acesso por IP (opcional)

Adicione no bloco `server` do Nginx:

```nginx
# Permitir apenas IPs específicos
allow 192.168.1.0/24;
deny all;
```

### Rate Limiting

Adicione na configuração do Nginx:

```nginx
# No bloco http
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    # No bloco server
    server {
        limit_req zone=api burst=20 nodelay;
    }
}
```

## Contatos e Suporte

- **Site oficial:** https://doc.evolution-api.com
- **Repositório:** https://github.com/EvolutionAPI/evolution-api
- **Domínio atual:** https://evo.se7esistemassinop.com.br

---

**Nota:** Este manual foi criado especificamente para o domínio `evo.se7esistemassinop.com.br`. Adapte os nomes de domínio conforme necessário para sua instalação.

**Versão do manual:** 1.0  
**Data:** $(date)  
**Evolution API versão:** 2.3.1
