# Evolution API - QR Code Extension

Interface Vue.js para geração e exibição de QR codes do WhatsApp Evolution API.

## 📁 Estrutura

```
src/extensions/
├── package.json              # Dependências do projeto Vue.js
├── vite.config.js           # Configuração do Vite
├── tailwind.config.js       # Configuração do Tailwind CSS
├── index.html              # Template HTML principal
├── .gitignore              # Arquivos a ignorar
├── eslint.config.js        # Configuração ESLint
├── README.md               # Esta documentação
├── AUDIT.md                # Auditoria de implementação
├── CHECKLIST.md            # Checklist de 120 itens
├── FIXES.md                # Correções aplicadas (v1.0.1)
├── public/                 # Assets estáticos (servidos diretamente)
│   └── images/             # Imagens da aplicação (logos, backgrounds, favicon)
├── src/
│   ├── main.js             # Ponto de entrada da aplicação
│   ├── App.vue             # Componente principal
│   ├── style.css           # Estilos globais com Tailwind
│   ├── composables/        # Composables Vue (lógica reutilizável)
│   │   ├── useAuth.js      # Gerenciamento de autenticação
│   │   ├── useQRCode.js    # Gerenciamento de QR codes
│   │   └── useConnection.js # Gerenciamento de conexão
│   ├── components/         # Componentes Vue
│   │   ├── ConnectionForm.vue    # Formulário de conexão
│   │   ├── QRCodeDisplay.vue     # Exibição do QR code
│   │   ├── ConnectionStatus.vue  # Status da conexão
│   │   ├── LogViewer.vue         # Visualizador de logs
│   │   ├── ThemeToggle.vue       # Toggle tema dark/light
│   │   ├── ErrorDisplay.vue      # Exibição de erros
│   │   └── icons/                # Ícones SVG
│   │       ├── LoadingSpinner.vue
│   │       ├── QRCodeIcon.vue
│   │       ├── ErrorIcon.vue
│   │       ├── RefreshIcon.vue
│   │       ├── DisconnectIcon.vue
│   │       └── LogIcon.vue
│   └── views/              # Views/Pages (preparada para expansão futura)
│       └── HomeView.vue    # Placeholder para Vue Router
```

## 🚀 Como Usar

### 1. Instalar dependências

```bash
cd src/extensions
npm install
```

### 2. Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` por padrão.

### 3. Build para produção

```bash
npm run build
```

Os arquivos buildados serão gerados em `../../dist_extensions/`.

## 🔧 Configuração

### Vite

O `vite.config.js` está configurado para:
- Base path: `/qrcode/`
- Output: `../../dist_extensions/`
- Code splitting para Vue e QRCode vendors
- Proxy para API em desenvolvimento

### Tailwind CSS

O `tailwind.config.js` está configurado com:
- Tema customizado com cores da Evolution API
- Fontes Lato e Open Sans
- Suporte a dark mode

## 🎨 Componentes Principais

### ConnectionForm
Formulário para inserir o nome da instância com validação.

**Props:**
- `isLoading` (Boolean) - Estado de carregamento
- `isConnected` (Boolean) - Se já está conectado
- `initialInstance` (String) - Valor inicial do campo

**Events:**
- `generate` - Emitido quando o formulário é submetido

### QRCodeDisplay
Exibe o QR code com countdown e instruções.

**Props:**
- `qrCodeBase64` (String) - QR code em base64
- `isLoading` (Boolean) - Estado de carregamento
- `error` (String) - Mensagem de erro
- `countdown` (Number) - Contador regressivo

### ConnectionStatus
Exibe informações da conexão estabelecida.

**Props:**
- `connectionState` (String) - Estado da conexão
- `isConnected` (Boolean) - Se está conectado
- `profileInfo` (Object) - Informações do perfil
- `instanceName` (String) - Nome da instância

**Events:**
- `disconnect` - Desconectar instância
- `restart` - Reiniciar instância

## 🔄 Composables

### useAuth
Gerenciamento de autenticação com a API.

```javascript
import { useAuth } from './composables/useAuth.js'

const { isAuthenticated, initAuth, clearAuth } = useAuth()
```

### useQRCode
Gerenciamento de QR codes.

```javascript
import { useQRCode } from './composables/useQRCode.js'

const {
  generateQRCode,
  qrCodeBase64,
  isLoading,
  error
} = useQRCode()
```

### useConnection
Gerenciamento da conexão WhatsApp.

```javascript
import { useConnection } from './composables/useConnection.js'

const {
  connectionState,
  isConnected,
  disconnect,
  restart
} = useConnection()
```

## 🎯 Integração com a API

A aplicação se comunica com os endpoints da Evolution API:

- `GET /qrcode/api-key` - Verificar API key
- `POST /qrcode/exchange-token` - Trocar token por API key
- `GET /instance/connect/{instanceName}` - Gerar QR code
- `GET /instance/connectionState/{instanceName}` - Estado da conexão
- `DELETE /instance/logout/{instanceName}` - Desconectar
- `POST /instance/restart/{instanceName}` - Reiniciar
- `GET /instance/fetchInstances` - Informações da instância

## 🌐 URLs e Parâmetros

### Parâmetros de URL suportados:
- `instance` - Nome da instância para conectar automaticamente
- `autoConnect` ou `auto` - Conectar automaticamente

**Exemplos:**
- `/qrcode/?instance=minha-instancia`
- `/qrcode/?instance=minha-instancia&autoConnect=true`

## 📁 Pasta Public vs Src/Assets

### **📂 Public (Recomendado para assets estáticos)**
- ✅ **Servido diretamente** pelo Vite na raiz (`/images/`)
- ✅ **Não processado** pelo build (copiado como está)
- ✅ **Ideal para** imagens, favicons, robots.txt, etc.
- ✅ **Caminho único** em desenvolvimento e produção
- ✅ **Copiado automaticamente** para `dist_extensions/images/` via script npm

### **📂 Src/Assets (Para assets processados)**
- 🔄 **Processado pelo build** (otimizado, versionado)
- 🔄 **Ideal para** CSS, JS, fontes, etc.
- 🔄 **Caminhos diferentes** em dev vs produção

**🎯 Nossa escolha:** `public/images/` para assets estáticos da aplicação.

## 🎨 Temas

O sistema suporta tema dark/light com:
- Detecção automática da preferência do sistema
- Toggle manual no canto superior direito
- Persistência no localStorage
- Transições suaves

## 📄 Views/Pages

A pasta `src/views/` está **atualmente vazia** porque a aplicação usa uma arquitetura de componente único (SPA sem roteamento). O componente `App.vue` gerencia todos os estados internamente:

- ✅ **Formulário de conexão**
- ✅ **Exibição do QR Code**
- ✅ **Status da conexão**
- ✅ **Logs do sistema**

### 🔮 Preparação para Expansão

A pasta views está preparada para futuras expansões caso seja necessário:

1. **Adicionar Vue Router** para múltiplas páginas
2. **Separar funcionalidades** em views distintas
3. **Criar navegação** entre diferentes seções

**Exemplo de estrutura futura:**
```
src/views/
├── HomeView.vue      # Página inicial
├── SettingsView.vue  # Configurações
├── HistoryView.vue   # Histórico de conexões
└── HelpView.vue      # Ajuda e documentação
```

## 📱 Responsividade

Interface responsiva com:
- Design mobile-first
- Breakpoints do Tailwind CSS
- Layout flexível e adaptativo

## 🔒 Segurança

- Rate limiting integrado
- Validação de entrada
- Sanitização de dados
- Headers de segurança HTTP

## 🧪 Desenvolvimento

Para testar com a API local:

1. Configure as variáveis de ambiente da Evolution API
2. Inicie a API: `npm run dev:server`
3. Inicie a interface: `cd src/extensions && npm run dev`
4. Acesse `http://localhost:8080/qrcode`

## 📦 Build

O build gera os arquivos em `dist_extensions/` que são servidos pelo Express na rota `/qrcode`. Os arquivos incluem:

- `index.html` - Template principal
- `assets/` - JavaScript e CSS compilados
- `images/` - Imagens e assets estáticos

### 🖼️ Assets/Imagens

A aplicação inclui os seguintes assets visuais localizados na pasta `public/images/`:

#### **Logos da SE7E**
- `logo-se7e-light.png` (512x512) - Logo para tema claro
- `logo-se7e-dark.png` (512x512) - Logo para tema escuro

#### **Backgrounds**
- `backgrund light SE7E.png` (1440x750) - Fundo para tema claro
- `backgrund SE7E dark.png` (1440x750) - Fundo para tema escuro

#### **Favicon**
- `favicon.png` (16x16) - Ícone para navegador e dispositivos

**📍 Localização:** `src/extensions/public/images/`
**🔗 Caminhos:** `/images/` (servido diretamente pelo Vite)
**📦 Build:** Copiado por script personalizado para `dist_extensions/images/`

## 🤝 Contribuição

Para contribuir:

1. Faça as mudanças nos componentes Vue
2. Teste com `npm run dev`
3. Execute `npm run build` para gerar a versão de produção
4. Verifique se os arquivos em `dist_extensions/` estão corretos

## 📄 Licença

Este projeto segue a mesma licença da Evolution API.
