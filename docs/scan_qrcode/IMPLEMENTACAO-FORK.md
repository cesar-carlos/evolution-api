# Implementação para Forks - Guia Prático

Este documento fornece um guia passo-a-passo para implementar o sistema de QR Code scanning do Evolution API em outros projetos/forks.

## 🎯 Objetivo

O objetivo desta documentação é permitir que qualquer desenvolvedor implemente uma interface de QR Code similar ao Evolution API em seu próprio projeto, com:

- ✅ Interface web responsiva
- ✅ Sistema de autenticação seguro
- ✅ Integração com WhatsApp via Baileys
- ✅ Logs em tempo real
- ✅ Gestão de perfil
- ✅ Sistema de rate limiting

## 📁 Arquivos Necessários

### **Frontend (Interface Web)**
```
/public/qrcode/index.html          # Interface principal
/public/qrcode/                    # Assets estáticos (CSS, JS, imagens)
```

### **Backend (API)**
```
/src/api/routes/qrcode.router.ts   # Rotas da API
/src/api/controllers/instance.controller.ts  # Controller de instâncias
/src/api/services/monitor.service.ts         # Monitor de conexões
```

### **Configurações**
```
/src/config/env.config.ts          # Configurações do sistema
/.env                              # Variáveis de ambiente
```

## 🚀 Implementação Passo-a-Passo

### **Passo 1: Configurar Frontend**

```html
<!-- 1. Criar pasta pública -->
mkdir -p public/qrcode

<!-- 2. Copiar interface HTML -->
cp /path/to/evolution-api/public/qrcode/index.html public/qrcode/

<!-- 3. Instalar dependências -->
npm install qrcode tailwindcss express
```

### **Passo 2: Configurar Backend**

```typescript
// 1. Criar arquivo de rotas
// src/routes/qrcode.router.ts
import { RouterBroker } from '@api/abstract/abstract.router';
import { InstanceDto } from '@api/dto/instance.dto';
import { ConfigService } from '@config/env.config';

export class QrcodeRouter extends RouterBroker {
  constructor(
    readonly configService: ConfigService,
    ...guards: RequestHandler[]
  ) {
    super();

    // Rota principal - serve interface HTML
    this.router.get('/', (req, res) => {
      const qrcodeHtmlPath = path.join(process.cwd(), 'public', 'qrcode', 'index.html');
      res.sendFile(qrcodeHtmlPath);
    });

    // Conectar WhatsApp
    this.router.get('/connect/:instanceName', ...guards, async (req, res) => {
      const response = await this.dataValidate<InstanceDto>({
        request: req,
        schema: null,
        ClassRef: InstanceDto,
        execute: () => instanceController.connectToWhatsapp({
          instanceName: req.params.instanceName
        }),
      });
      res.json(response);
    });
  }
}
```

### **Passo 3: Configurar Serviço WhatsApp**

```typescript
// Implementar métodos necessários
export class WhatsAppService {
  async connectToWhatsapp(instanceName: string) {
    // 1. Verificar se instância existe
    const instance = this.getInstance(instanceName);
    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    // 2. Iniciar conexão Baileys
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: instanceName }),
      puppeteer: { headless: true }
    });

    // 3. Gerar QR code
    client.on('qr', (qr) => {
      // Converter QR para base64
      qrcode.toDataURL(qr, (err, url) => {
        instance.qrCode = {
          code: qr,
          base64: url,
          count: (instance.qrCode?.count || 0) + 1
        };
      });
    });

    // 4. Monitorar conexão
    client.on('ready', () => {
      instance.connectionStatus = 'open';
    });

    await client.initialize();

    return instance.qrCode;
  }

  async getConnectionState(instanceName: string) {
    const instance = this.getInstance(instanceName);
    return {
      instance: {
        instanceName,
        state: instance?.connectionStatus || 'close'
      }
    };
  }
}
```

### **Passo 4: Configurar Autenticação**

```typescript
// Sistema de autenticação seguro
class AuthService {
  async validateApiKey(providedKey: string): Promise<boolean> {
    const validKey = process.env.AUTHENTICATION_API_KEY;
    return providedKey === validKey && validKey !== 'BQYHJGJHJ';
  }

  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  const apiKey = req.headers.apikey;

  if (!apiKey || !await authService.validateApiKey(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};
```

### **Passo 5: Configurar Rate Limiting**

```typescript
// Rate limiting por IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX = 10; // 10 tentativas

const rateLimitMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  let clientData = rateLimitMap.get(clientIP);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return next();
  }

  if (clientData.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }

  clientData.count++;
  next();
};
```

### **Passo 6: Configurar Banco de Dados**

```sql
-- PostgreSQL
CREATE TABLE instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  connection_status VARCHAR(50) DEFAULT 'close',
  profile_name VARCHAR(255),
  profile_pic_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MySQL
CREATE TABLE instances (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) UNIQUE NOT NULL,
  connection_status VARCHAR(50) DEFAULT 'close',
  profile_name VARCHAR(255),
  profile_pic_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Passo 7: Configurar Variáveis de Ambiente**

```env
# API
AUTHENTICATION_API_KEY=your-secure-api-key-here
SERVER_URL=http://localhost:8080

# Database
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_HOST=localhost
DATABASE_CONNECTION_PORT=5432
DATABASE_CONNECTION_DATABASE=evolution_api
DATABASE_CONNECTION_USERNAME=postgres
DATABASE_CONNECTION_PASSWORD=password

# QR Code
QRCODE_LIMIT=30
QRCODE_COLOR=#22c55e

# WhatsApp
CONFIG_SESSION_PHONE_CLIENT=MyApp
CONFIG_SESSION_PHONE_NAME=Chrome
```

## 🎨 Personalização da Interface

### **Alterar Cores**
```css
:root {
  --primary-color: #your-brand-color;
  --success-color: #10b981;
  --error-color: #ef4444;
}
```

### **Alterar Logo**
```html
<!-- Substituir logo -->
<img src="/your-logo.png" alt="Your Logo" class="logo">
```

### **Alterar Textos**
```javascript
// Personalizar mensagens
const MESSAGES = {
  title: "Conectar WhatsApp",
  subtitle: "Escaneie o QR Code",
  button: "Gerar QR Code",
  connected: "Conectado!",
  error: "Erro na conexão"
};
```

## 🔧 Testando a Implementação

### **1. Testar API**
```bash
# Verificar API key
curl http://localhost:8080/qrcode/api-key

# Testar conexão
curl -H "apikey: your-api-key" \
     http://localhost:8080/qrcode/connect/test-instance
```

### **2. Testar Interface**
```bash
# Abrir no navegador
open http://localhost:8080/qrcode/

# Verificar logs
tail -f logs/app.log | grep -i qrcode
```

### **3. Testar WhatsApp**
```bash
# Verificar status
curl -H "apikey: your-api-key" \
     http://localhost:8080/qrcode/connectionState/test-instance

# Fazer logout
curl -X DELETE -H "apikey: your-api-key" \
     http://localhost:8080/qrcode/logout/test-instance
```

## 🚨 Problemas Comuns

### **1. QR Code não aparece**
- Verificar se JavaScript carregou
- Checar console do navegador
- Verificar se qrcode.min.js está acessível

### **2. API Key inválida**
- Verificar variável AUTHENTICATION_API_KEY
- Checar se valor não é padrão "BQYHJGJHJ"
- Verificar headers da requisição

### **3. Instância não encontrada**
- Criar instância antes de conectar
- Verificar nome da instância
- Checar banco de dados

### **4. Rate limit**
- Aguardar 1 minuto entre tentativas
- Verificar configuração RATE_LIMIT_MAX
- Implementar retry com backoff

## 📊 Monitoramento

### **Logs Importantes**
```bash
# Logs de QR code
tail -f logs/app.log | grep -E "(qrcode|QR|connecting|open|close)"

# Logs de erro
tail -f logs/app.log | grep -i error

# Logs de performance
tail -f logs/app.log | grep -E "(memory|cpu|response)"
```

### **Métricas**
```typescript
// Endpoint de métricas
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    instances: getInstanceCount(),
    qrcodes: getQRCodesGenerated(),
    errors: getErrorCount()
  });
});
```

## 🎯 Próximos Passos

1. **Testar em produção** com SSL e domínio
2. **Implementar WebSocket** para updates em tempo real
3. **Adicionar cache Redis** para performance
4. **Configurar monitoring** e alertas
5. **Documentar APIs específicas** do projeto

## 📚 Referências

- [Documentação Completa](README.md)
- [Configurações](CONFIGURATION.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Casos de Uso](USE_CASES.md)

---

**Implementação para Forks** - Evolution API QR Code System
Data: 2025
