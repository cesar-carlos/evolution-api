# QR Code Scanning - Troubleshooting

Este documento fornece soluções para problemas comuns encontrados na implementação do sistema de QR Code scanning do Evolution API.

## 📋 Sumário

1. [Problemas de Conexão](#problemas-de-conexão)
2. [QR Code não é Gerado](#qr-code-não-é-gerado)
3. [Problemas de Autenticação](#problemas-de-autenticação)
4. [Rate Limiting](#rate-limiting)
5. [Problemas de Interface](#problemas-de-interface)
6. [WhatsApp Connection Issues](#whatsapp-connection-issues)
7. [Database Problems](#database-problems)
8. [Logs e Debug](#logs-e-debug)
9. [Performance Issues](#performance-issues)
10. [Common Error Codes](#common-error-codes)

## 🚨 Problemas de Conexão

### **Erro: "Instance does not exist"**

**Sintoma:** Ao tentar conectar, recebe erro de instância não encontrada.

**Causas possíveis:**
- Nome da instância incorreto
- Instância ainda não foi criada
- Problema no banco de dados

**Soluções:**

1. **Verificar nome da instância:**
   ```bash
   # Listar instâncias existentes
   curl -H "apikey: YOUR_API_KEY" http://localhost:8080/instance/fetchInstances
   ```

2. **Criar instância se necessário:**
   ```bash
   curl -X POST http://localhost:8080/instance/create \
     -H "apikey: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "instanceName": "minha-instancia",
       "integration": "WHATSAPP-BAILEYS"
     }'
   ```

3. **Verificar banco de dados:**
   ```sql
   -- PostgreSQL
   SELECT * FROM "Instance" WHERE name = 'minha-instancia';

   -- MySQL
   SELECT * FROM `Instance` WHERE name = 'minha-instancia';
   ```

### **Erro: "Connection timeout"**

**Sintoma:** QR code é gerado mas expira sem conexão.

**Causas possíveis:**
- Problemas de rede
- Firewall bloqueando conexão
- WhatsApp Web detectou atividade suspeita

**Soluções:**

1. **Verificar conectividade:**
   ```bash
   # Testar conexão com WhatsApp servers
   ping web.whatsapp.com
   curl -I https://web.whatsapp.com/
   ```

2. **Ajustar timeout:**
   ```typescript
   // Em whatsapp.baileys.service.ts
   connectTimeoutMs: 60_000,  // Aumentar para 60s
   qrTimeout: 60_000,         // Aumentar para 60s
   ```

3. **Verificar proxy (se usando):**
   ```bash
   # Testar proxy
   curl -x http://your-proxy:port https://web.whatsapp.com/
   ```

## 📱 QR Code não é Gerado

### **Erro: "QR Code not available"**

**Sintoma:** Interface mostra "QR Code não disponível no momento".

**Causas possíveis:**
- Instância em estado incorreto
- Problema na geração do QR code
- Limite de QR codes excedido

**Soluções:**

1. **Verificar estado da instância:**
   ```bash
   curl -H "apikey: YOUR_API_KEY" \
        http://localhost:8080/qrcode/connectionState/minha-instancia
   ```

2. **Reiniciar instância:**
   ```bash
   # Fazer logout primeiro
   curl -X DELETE -H "apikey: YOUR_API_KEY" \
        http://localhost:8080/qrcode/logout/minha-instancia

   # Tentar conectar novamente
   curl -H "apikey: YOUR_API_KEY" \
        http://localhost:8080/qrcode/connect/minha-instancia
   ```

3. **Verificar limite de QR codes:**
   ```typescript
   // Verificar configuração
   QRCODE_LIMIT: 30  // Padrão

   // Resetar contador se necessário
   instance.qrcode.count = 0;
   ```

### **Erro: "Invalid QR code generated"**

**Sintoma:** QR code gerado mas inválido.

**Causas possíveis:**
- Problema na biblioteca qrcode
- Configurações incorretas do QR code

**Soluções:**

1. **Verificar instalação do qrcode:**
   ```bash
   npm list qrcode
   # Deve mostrar versão 1.5.1 ou superior
   ```

2. **Verificar configurações do QR code:**
   ```typescript
   const optsQrcode = {
     margin: 3,
     scale: 4,
     errorCorrectionLevel: 'H',  // Nível alto de correção
     color: {
       light: '#ffffff',
       dark: '#198754'  // Cor configurável
     }
   };
   ```

## 🔐 Problemas de Autenticação

### **Erro: "API Key not configured"**

**Sintoma:** Interface mostra erro de API key não configurada.

**Causas possíveis:**
- Variável de ambiente não definida
- API key com valor padrão incorreto

**Soluções:**

1. **Verificar variável de ambiente:**
   ```bash
   # Verificar se está definida
   echo $AUTHENTICATION_API_KEY

   # Configurar se necessário
   export AUTHENTICATION_API_KEY="your-secure-api-key"
   ```

2. **Atualizar arquivo .env:**
   ```env
   AUTHENTICATION_API_KEY=your-secure-api-key-here
   AUTHENTICATION_TYPE=apikey
   ```

3. **Verificar valor padrão incorreto:**
   ```typescript
   // Não usar valor padrão inseguro
   API_KEY: process.env.AUTHENTICATION_API_KEY || 'BQYHJGJHJ'
   ```

### **Erro: "Rate limit exceeded"**

**Sintoma:** Muitas tentativas resultam em bloqueio temporário.

**Causas possíveis:**
- Muitas tentativas de conexão
- Rate limiting muito restritivo

**Soluções:**

1. **Aguardar reset do rate limit:**
   ```bash
   # Aguardar 1 minuto (padrão)
   sleep 60
   ```

2. **Ajustar rate limiting:**
   ```typescript
   const RATE_LIMIT_WINDOW = 60000;     // 1 minuto
   const RATE_LIMIT_MAX_REQUESTS = 10;  // 10 tentativas
   ```

3. **Implementar exponential backoff:**
   ```javascript
   function exponentialBackoff(attempt) {
     const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
     return new Promise(resolve => setTimeout(resolve, delay));
   }
   ```

## 🎨 Problemas de Interface

### **Erro: "Error loading QR code page"**

**Sintoma:** Página não carrega ou mostra erro 500.

**Causas possíveis:**
- Arquivo HTML não encontrado
- Problemas de permissões
- Headers de segurança incorretos

**Soluções:**

1. **Verificar se arquivo existe:**
   ```bash
   ls -la public/qrcode/index.html
   ```

2. **Verificar permissões:**
   ```bash
   chmod 644 public/qrcode/index.html
   chown www-data:www-data public/qrcode/index.html  # Se usando Apache
   ```

3. **Verificar headers de segurança:**
   ```typescript
   res.setHeader('Content-Type', 'text/html; charset=utf-8');
   res.setHeader('X-Content-Type-Options', 'nosniff');
   res.setHeader('X-Frame-Options', 'DENY');
   ```

### **Erro: "QR Code not displaying"**

**Sintoma:** Container do QR code aparece mas não mostra a imagem.

**Causas possíveis:**
- JavaScript não carregou
- Problema na geração do canvas
- CSS ocultando o elemento

**Soluções:**

1. **Verificar se bibliotecas carregaram:**
   ```html
   <script src="https://cdn.tailwindcss.com"></script>
   <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
   ```

2. **Verificar CSS do canvas:**
   ```css
   #qrcodeCanvas {
     display: block !important;
     max-width: 100%;
     height: auto;
   }
   ```

3. **Debug JavaScript:**
   ```javascript
   console.log('QRCode library loaded:', typeof QRCode);
   console.log('Canvas element:', document.getElementById('qrcodeCanvas'));
   ```

## 📶 WhatsApp Connection Issues

### **Erro: "QR code expired"**

**Sintoma:** QR code expira antes da leitura.

**Causas possíveis:**
- Conexão lenta
- QR code muito complexo
- Problemas no WhatsApp Web

**Soluções:**

1. **Aumentar timeout:**
   ```typescript
   qrTimeout: 60_000,  // 60 segundos
   ```

2. **Simplificar QR code:**
   ```typescript
   const optsQrcode = {
     margin: 2,  // Reduzir margem
     scale: 3,   // Reduzir escala
     errorCorrectionLevel: 'M'  // Nível médio (ao invés de H)
   };
   ```

3. **Verificar conectividade:**
   ```bash
   # Testar latência para WhatsApp
   curl -w "@curl-format.txt" -o /dev/null -s "https://web.whatsapp.com/"
   ```

### **Erro: "Phone number already connected"**

**Sintoma:** WhatsApp já está conectado em outro lugar.

**Causas possíveis:**
- Múltiplas sessões ativas
- WhatsApp Web aberto em outro navegador

**Soluções:**

1. **Logout de outras sessões:**
   - Abrir WhatsApp no celular
   - Configurações > Aparelhos conectados
   - Desconectar outras sessões

2. **Limpar cache local:**
   ```bash
   # Limpar cache do Baileys
   rm -rf .wwebjs_cache/
   rm -rf .wwebjs_auth/
   ```

3. **Forçar nova autenticação:**
   ```javascript
   // No código
   await instance.logoutInstance();
   await instance.connectToWhatsapp();
   ```

## 💾 Database Problems

### **Erro: "Database connection failed"**

**Sintoma:** Erro ao conectar com banco de dados.

**Causas possíveis:**
- Configurações incorretas
- Banco não disponível
- Problemas de autenticação

**Soluções:**

1. **Verificar configurações:**
   ```env
   # PostgreSQL
   DATABASE_PROVIDER=postgresql
   DATABASE_CONNECTION_HOST=localhost
   DATABASE_CONNECTION_PORT=5432
   DATABASE_CONNECTION_DATABASE=evolution_api
   DATABASE_CONNECTION_USERNAME=postgres
   DATABASE_CONNECTION_PASSWORD=password

   # MySQL
   DATABASE_PROVIDER=mysql
   DATABASE_CONNECTION_HOST=localhost
   DATABASE_CONNECTION_PORT=3306
   DATABASE_CONNECTION_DATABASE=evolution_api
   DATABASE_CONNECTION_USERNAME=root
   DATABASE_CONNECTION_PASSWORD=password
   ```

2. **Testar conexão:**
   ```bash
   # PostgreSQL
   psql -h localhost -U postgres -d evolution_api

   # MySQL
   mysql -h localhost -u root -p evolution_api
   ```

3. **Verificar se banco está rodando:**
   ```bash
   # Docker
   docker ps | grep postgres
   docker ps | grep mysql

   # Sistema
   systemctl status postgresql
   systemctl status mysql
   ```

### **Erro: "Migration failed"**

**Sintoma:** Falha ao executar migrações.

**Soluções:**

1. **Resetar migrações:**
   ```bash
   # PostgreSQL
   npm run db:migrate:reset:postgresql

   # MySQL
   npm run db:migrate:reset:mysql
   ```

2. **Limpar dados de teste:**
   ```sql
   -- PostgreSQL
   TRUNCATE TABLE "Instance" CASCADE;

   -- MySQL
   TRUNCATE TABLE `Instance`;
   ```

## 📝 Logs e Debug

### **Como habilitar logs detalhados:**

1. **Configurar nível de log:**
   ```env
   LOG_LEVEL=debug
   LOG_BAILEYS=debug
   ```

2. **Verificar logs do sistema:**
   ```bash
   # Logs da aplicação
   tail -f logs/evolution-api.log

   # Logs específicos de QR code
   tail -f logs/evolution-api.log | grep -i qrcode

   # Logs do sistema
   journalctl -u evolution-api -f
   ```

3. **Logs específicos do Baileys:**
   ```bash
   # Logs de conexão WhatsApp
   tail -f logs/evolution-api.log | grep -E "(connecting|open|close|qr)"
   ```

### **Debug JavaScript:**

```javascript
// Adicionar logs de debug
console.log('QR Code data:', qrCodeData);
console.log('Canvas element:', canvas);
console.log('QRCode library version:', QRCode.version);

// Debug de API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('API Call:', args[0], args[1]);
  return originalFetch.apply(this, args);
};
```

## ⚡ Performance Issues

### **QR Code lento para gerar:**

1. **Otimizar configurações:**
   ```typescript
   const optsQrcode = {
     margin: 2,        // Reduzir de 3 para 2
     scale: 3,         // Reduzir de 4 para 3
     errorCorrectionLevel: 'M'  // Médio ao invés de Alto
   };
   ```

2. **Usar cache:**
   ```javascript
   // Cache para QR codes
   const qrCache = new Map();

   function getCachedQRCode(data) {
     if (qrCache.has(data)) {
       return qrCache.get(data);
     }
     // Gerar e armazenar
   }
   ```

### **Interface travando:**

1. **Otimizar JavaScript:**
   ```javascript
   // Usar requestAnimationFrame para updates
   function updateQRCode() {
     requestAnimationFrame(() => {
       // Atualizar interface
     });
   }

   // Debounce para inputs
   const debounce = (func, wait) => {
     let timeout;
     return function executedFunction(...args) {
       const later = () => {
         clearTimeout(timeout);
         func(...args);
       };
       clearTimeout(timeout);
       timeout = setTimeout(later, wait);
     };
   };
   ```

## 📊 Common Error Codes

### **HTTP Status Codes:**

- **400 Bad Request:** Dados inválidos ou instância incorreta
- **401 Unauthorized:** API key inválida ou token expirado
- **404 Not Found:** Instância não existe ou endpoint errado
- **429 Too Many Requests:** Rate limit excedido
- **500 Internal Server Error:** Erro interno do servidor

### **Códigos de erro específicos:**

```typescript
// Códigos do WhatsApp Baileys
enum DisconnectReason {
  connectionClosed = 428,
  connectionLost = 408,
  connectionReplaced = 440,
  loggedOut = 401,
  badSession = 500,
  forbidden = 403,
  unreachable = 408,
}

// Tratamento de códigos
switch (disconnectCode) {
  case DisconnectReason.loggedOut:
    console.log('Usuário fez logout');
    break;
  case DisconnectReason.forbidden:
    console.log('Número banido pelo WhatsApp');
    break;
  default:
    console.log('Código de desconexão:', disconnectCode);
}
```

## 🔧 Scripts de Troubleshooting

### **Script de diagnóstico:**

```bash
#!/bin/bash
# diagnostic.sh - Script de diagnóstico do QR Code

echo "=== Diagnóstico QR Code System ==="

# 1. Verificar API Key
echo -n "1. API Key configurada: "
if [ -n "$AUTHENTICATION_API_KEY" ] && [ "$AUTHENTICATION_API_KEY" != "BQYHJGJHJ" ]; then
    echo "✅ OK"
else
    echo "❌ NÃO CONFIGURADA"
fi

# 2. Verificar instância
echo -n "2. Instância existe: "
INSTANCE_COUNT=$(curl -s -H "apikey: $AUTHENTICATION_API_KEY" http://localhost:8080/instance/fetchInstances | jq '. | length')
echo "$INSTANCE_COUNT instâncias"

# 3. Verificar conexão
echo -n "3. Status da conexão: "
STATUS=$(curl -s -H "apikey: $AUTHENTICATION_API_KEY" http://localhost:8080/qrcode/connectionState/minha-instancia | jq -r '.instance.state')
echo "$STATUS"

# 4. Verificar banco
echo -n "4. Banco de dados: "
if pg_isready -h localhost -p 5432 2>/dev/null; then
    echo "✅ PostgreSQL OK"
elif mysqladmin ping -h localhost --silent; then
    echo "✅ MySQL OK"
else
    echo "❌ OFFLINE"
fi

# 5. Verificar logs
echo "5. Últimos logs de erro:"
tail -n 10 logs/evolution-api.log | grep -i error || echo "Nenhum erro recente"

echo "=== Fim do diagnóstico ==="
```

### **Script de reset:**

```bash
#!/bin/bash
# reset-qr.sh - Reset do sistema QR Code

echo "=== Reset QR Code System ==="

# 1. Parar serviço
echo "1. Parando serviço..."
sudo systemctl stop evolution-api

# 2. Limpar cache
echo "2. Limpando cache..."
rm -rf .wwebjs_cache/
rm -rf .wwebjs_auth/
rm -rf cache/

# 3. Resetar banco (opcional)
read -p "3. Resetar banco de dados? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:migrate:reset
fi

# 4. Reiniciar serviço
echo "4. Reiniciando serviço..."
sudo systemctl start evolution-api

# 5. Verificar status
echo "5. Verificando status..."
sleep 5
curl -H "apikey: $AUTHENTICATION_API_KEY" http://localhost:8080/qrcode/api-key

echo "=== Reset concluído ==="
```

## 📞 Suporte e Ajuda

### **Como reportar bugs:**

1. **Informações necessárias:**
   - Versão do Evolution API
   - Versão do Node.js
   - Sistema operacional
   - Logs completos do erro
   - Passos para reproduzir

2. **Template de bug report:**
   ```markdown
   ## Descrição do Problema
   [Descreva o problema]

   ## Passos para Reproduzir
   1. [Passo 1]
   2. [Passo 2]

   ## Comportamento Esperado
   [O que deveria acontecer]

   ## Comportamento Atual
   [O que está acontecendo]

   ## Logs
   [Logs relevantes]

   ## Configuração
   - OS: [Sistema]
   - Node.js: [Versão]
   - Evolution API: [Versão]
   ```

### **Comunidade:**

- **GitHub Issues:** [Link para issues]
- **Discord:** [Link do Discord]
- **Documentação:** [Link da documentação]

---

**Evolution API** - QR Code Troubleshooting
Versão: 2.0.0
Data: 2025
