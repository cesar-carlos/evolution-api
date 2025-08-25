#!/bin/bash

# Script de instalação e configuração do Nginx para Evolution API
# Domínio: evo.se7esistemassinop.com.br
# Versão: 1.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
DOMAIN="evo.se7esistemassinop.com.br"
WWW_DOMAIN="www.evo.se7esistemassinop.com.br"
EMAIL="your-email@example.com"  # ALTERE ESTE EMAIL

echo -e "${GREEN}🚀 Iniciando instalação do Nginx para Evolution API${NC}"

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Este script deve ser executado como root${NC}"
   exit 1
fi

# Função para imprimir status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se o domínio aponta para este servidor
echo -e "${YELLOW}📋 Verificando se o domínio aponta para este servidor...${NC}"
SERVER_IP=$(curl -s http://checkip.amazonaws.com/)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    print_warning "O domínio $DOMAIN não aponta para este servidor ($SERVER_IP vs $DOMAIN_IP)"
    print_warning "Certifique-se de que o DNS esteja configurado corretamente antes de continuar"
    read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. Atualizar sistema
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y
print_status "Sistema atualizado"

# 2. Instalar Nginx
echo -e "${YELLOW}🌐 Instalando Nginx...${NC}"
apt install nginx -y
systemctl enable nginx
systemctl start nginx
print_status "Nginx instalado e iniciado"

# 3. Configurar firewall
echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
ufw allow 'Nginx Full'
ufw allow ssh
print_status "Firewall configurado"

# 4. Criar arquivo de configuração do Nginx
echo -e "${YELLOW}⚙️  Criando configuração do Nginx...${NC}"
cat > /etc/nginx/sites-available/$DOMAIN << EOF
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# Configuração HTTPS principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN $WWW_DOMAIN;

    # Certificados SSL (serão configurados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
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

    # Proxy principal para Evolution API (porta 8080)
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers para Evolution API
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,apikey' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 5. Ativar o site
echo -e "${YELLOW}🔗 Ativando configuração do site...${NC}"
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t
if [ $? -eq 0 ]; then
    print_status "Configuração do Nginx válida"
else
    print_error "Erro na configuração do Nginx"
    exit 1
fi

# 6. Instalar Certbot
echo -e "${YELLOW}🔒 Instalando Certbot...${NC}"
apt install certbot python3-certbot-nginx -y
print_status "Certbot instalado"

# 7. Recarregar Nginx
systemctl reload nginx
print_status "Nginx recarregado"

# 8. Obter certificados SSL
echo -e "${YELLOW}🔐 Obtendo certificados SSL...${NC}"
print_warning "IMPORTANTE: Altere o email no script para um email válido antes de executar o Certbot"

if [ "$EMAIL" == "your-email@example.com" ]; then
    print_error "Por favor, altere a variável EMAIL no início do script para um email válido"
    print_warning "Execute manualmente: certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
else
    certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email $EMAIL
    if [ $? -eq 0 ]; then
        print_status "Certificados SSL configurados"
    else
        print_error "Erro ao configurar certificados SSL"
        print_warning "Execute manualmente: certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
    fi
fi

# 9. Configurar renovação automática
echo -e "${YELLOW}🔄 Configurando renovação automática...${NC}"
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
print_status "Renovação automática configurada"

# 10. Verificar se Evolution API está rodando
echo -e "${YELLOW}🔍 Verificando Evolution API...${NC}"
if docker ps | grep -q evolution_api; then
    print_status "Evolution API está rodando"
else
    print_warning "Evolution API não está rodando. Inicie com: docker-compose up -d"
fi

# 11. Testar conectividade
echo -e "${YELLOW}🧪 Testando conectividade...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080 | grep -q "200\|404"; then
    print_status "Evolution API respondendo na porta 8080"
else
    print_warning "Evolution API não está respondendo na porta 8080"
fi

echo
echo -e "${GREEN}🎉 Instalação concluída!${NC}"
echo
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "1. Verifique se o Evolution API está rodando: docker ps"
echo "2. Acesse: https://$DOMAIN"
echo "3. Manager: https://$DOMAIN/manager"
echo "4. Documentação: https://$DOMAIN/docs"
echo
echo -e "${YELLOW}📁 Arquivos importantes:${NC}"
echo "- Configuração Nginx: /etc/nginx/sites-available/$DOMAIN"
echo "- Logs Nginx: /var/log/nginx/evolution-api-*.log"
echo "- Certificados SSL: /etc/letsencrypt/live/$DOMAIN/"
echo
echo -e "${YELLOW}🔧 Comandos úteis:${NC}"
echo "- Reiniciar Nginx: systemctl restart nginx"
echo "- Ver logs: tail -f /var/log/nginx/evolution-api-access.log"
echo "- Testar SSL: curl -I https://$DOMAIN"
echo
print_status "Configuração do Nginx para Evolution API concluída com sucesso!"
