# 📝 Edição de Mensagens - Evolution API

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Requisitos](#requisitos)
- [Funcionalidades](#funcionalidades)
- [Como Usar](#como-usar)
- [Exemplos Práticos](#exemplos-práticos)
- [Limitações](#limitações)
- [Integração com Chatwoot](#integração-com-chatwoot)
- [Troubleshooting](#troubleshooting)

## Visão Geral

O Evolution API permite **editar mensagens** enviadas através do WhatsApp, incluindo texto, captions de imagens e vídeos.

### ✅ Tipos de Mensagens Suportadas

- ✅ **Texto simples** (`conversation`)
- ✅ **Texto estendido** (`extendedTextMessage`)
- ✅ **Imagens** (mantém mídia, edita caption)
- ✅ **Vídeos** (mantém mídia, edita caption)

### ❌ Não Suportado

- ❌ Mensagens de áudio/voz
- ❌ Mensagens de documentos
- ❌ Mensagens de contato
- ❌ Mensagens de localização
- ❌ Mensagens de outros usuários (apenas suas próprias)

## Requisitos

### Ambiente

- ✅ **Canal:** WhatsApp Baileys (único canal suportado)
- ✅ **Node.js:** 18+ (para ESM)
- ✅ **Banco de dados:** Configurado e rodando
- ✅ **Instância:** Conectada e ativa

### Configurações

```env
# .env - Configurações necessárias
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_DATA_MESSAGE_UPDATE=true
CHATWOOT_ENABLED=true  # Opcional, para integração
```

### Autenticação

```bash
# Header obrigatório em todas as requisições
apikey: SUA_CHAVE_API
```

## Funcionalidades

### 1. Editar Mensagem de Texto

Edita mensagens de texto simples ou texto estendido.

```bash
POST /chat/updateMessage
```

### 2. Editar Caption de Mídia

Edita o caption (legenda) de imagens e vídeos, mantendo a mídia original.

```bash
POST /chat/updateMessage
```

### 3. Validações Automáticas

- ✅ Verifica se a mensagem existe no banco
- ✅ Valida se é sua própria mensagem (`fromMe: true`)
- ✅ Verifica limite de tempo (15 minutos após envio)
- ✅ Valida formato da chave da mensagem
- ✅ Impede edição de mensagens deletadas

### 4. Webhooks

Dispara evento `SEND_MESSAGE_UPDATE` quando mensagem é editada.

### 5. Histórico

Salva histórico de edições na tabela `MessageUpdate` com status "EDITED".

## Como Usar

### Passo 1: Buscar Mensagens

```bash
curl -X POST "http://localhost:8080/chat/findMessages" \
  -H "apikey: SUA_CHAVE_API" \
  -H "Content-Type: application/json" \
  -d '{
    "where": {
      "fromMe": true,
      "remoteJid": "5511999999999@s.whatsapp.net"
    },
    "limit": 10
  }'
```

### Passo 2: Editar Mensagem

```bash
curl -X POST "http://localhost:8080/chat/updateMessage" \
  -H "apikey: SUA_CHAVE_API" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "key": {
      "id": "BAE5xxxxxxxxxxx",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": true
    },
    "text": "Nova mensagem editada"
  }'
```

## Exemplos Práticos

### Exemplo 1: Editar Mensagem de Texto

```bash
# 1. Buscar mensagem para editar
curl -X POST "http://localhost:8080/chat/findMessages" \
  -H "apikey: SUA_CHAVE_API" \
  -H "Content-Type: application/json" \
  -d '{
    "where": {
      "fromMe": true,
      "messageType": "conversation"
    },
    "limit": 1
  }'

# Resposta:
# {
#   "messages": [{
#     "key": {
#       "id": "BAE5xxxxxxxxxxx",
#       "remoteJid": "5511999999999@s.whatsapp.net",
#       "fromMe": true
#     },
#     "message": {
#       "conversation": "Mensagem original"
#     }
#   }]
# }

# 2. Editar mensagem
curl -X POST "http://localhost:8080/chat/updateMessage" \
  -H "apikey: SUA_CHAVE_API" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "key": {
      "id": "BAE5xxxxxxxxxxx",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": true
    },
    "text": "Mensagem editada com sucesso"
  }'
```

### Exemplo 2: Editar Caption de Imagem

```bash
# 1. Buscar imagem enviada
curl -X POST "http://localhost:8080/chat/findMessages" \
  -H "apikey: SUA_CHAVE_API" \
  -H "Content-Type: application/json" \
  -d '{
    "where": {
      "fromMe": true,
      "messageType": "imageMessage"
    },
    "limit": 1
  }'

# 2. Editar caption da imagem
curl -X POST "http://localhost:8080/chat/updateMessage" \
  -H "apikey: SUA_CHAVE_API" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "key": {
      "id": "BAE5xxxxxxxxxxx",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": true
    },
    "text": "Nova legenda da imagem!"
  }'
```

### Exemplo 3: Editar Caption de Vídeo

```bash
curl -X POST "http://localhost:8080/chat/updateMessage" \
  -H "apikey: SUA_CHAVE_API" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "key": {
      "id": "BAE5xxxxxxxxxxx",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": true
    },
    "text": "Nova legenda do vídeo!"
  }'
```

## Limitações

### Limite de Tempo

⚠️ **15 minutos:** Mensagens só podem ser editadas até 15 minutos após o envio original.

### Permissões

- ✅ Só pode editar suas próprias mensagens
- ❌ Não pode editar mensagens de outros usuários
- ❌ Não pode editar mensagens deletadas

### Canais Suportados

- ✅ **WhatsApp Baileys** - Totalmente suportado
- ❌ **WhatsApp Business API** - Não suportado
- ❌ **Evolution Channel** - Não suportado

### Tipos de Mídia

- ✅ Texto (qualquer tipo)
- ✅ Imagem (caption)
- ✅ Vídeo (caption)
- ❌ Áudio/Voz
- ❌ Documentos
- ❌ Localização
- ❌ Contatos

## Integração com Chatwoot

### Evento Disparado

```json
{
  "event": "send.message.update",
  "instanceName": "minha-instancia",
  "instanceId": "inst_123",
  "data": {
    "key": {
      "id": "BAE5xxxxxxxxxxx",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": true
    },
    "editedMessage": {
      "conversation": "Nova mensagem editada"
    }
  }
}
```

### Comportamento no Chatwoot

Quando uma mensagem é editada, o Chatwoot recebe:

1. **Notificação automática** com o novo conteúdo
2. **Indicador visual** de mensagem editada
3. **Texto formatado:**
   ```
   Mensagem editada:
   
   [Novo conteúdo da mensagem]
   ```

### Configuração

```env
# .env
CHATWOOT_ENABLED=true
CHATWOOT_URL=https://seu-chatwoot.com
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_TOKEN=seu_token_aqui
```

## Troubleshooting

### Erro: "Message not found"

**Causa:** Mensagem não existe no banco de dados ou não foi enviada por você.

**Solução:**
- Verificar se `DATABASE_SAVE_DATA_NEW_MESSAGE=true`
- Confirmar que `key.fromMe: true`
- Verificar se a mensagem existe no banco

### Erro: "Message is older than 15 minutes"

**Causa:** Tentativa de editar mensagem enviada há mais de 15 minutos.

**Solução:**
- ⏰ Editar apenas mensagens recentes (últimos 15 minutos)
- Verificar timestamp da mensagem antes de editar

### Erro: "Message not compatible"

**Causa:** Tipo de mensagem não suportado para edição.

**Solução:**
- ✅ Usar apenas: texto, imagem ou vídeo
- ❌ Não tentar editar: áudio, documento, localização

### Erro: "RemoteJid does not match"

**Causa:** `key.remoteJid` não corresponde ao `number` informado.

**Solução:**
- Verificar se `remoteJid` está correto
- Usar formato JID completo: `5511999999999@s.whatsapp.net`

### Erro: "You cannot edit others messages"

**Causa:** Tentativa de editar mensagem de outro usuário.

**Solução:**
- Verificar se `key.fromMe: true`
- Editar apenas suas próprias mensagens

## Exemplos de Código

### JavaScript/TypeScript

```typescript
async function editMessage(apikey: string, instanceName: string, data: {
  number: string;
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  text: string;
}) {
  const response = await fetch(`http://localhost:8080/chat/updateMessage`, {
    method: 'POST',
    headers: {
      'apikey': apikey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Uso
await editMessage('SUA_CHAVE_API', 'minha-instancia', {
  number: '5511999999999',
  key: {
    id: 'BAE5xxxxxxxxxxx',
    remoteJid: '5511999999999@s.whatsapp.net',
    fromMe: true,
  },
  text: 'Mensagem editada com sucesso!',
});
```

### Python

```python
import requests

def edit_message(apikey: str, data: dict) -> dict:
    url = "http://localhost:8080/chat/updateMessage"
    headers = {
        "apikey": apikey,
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=data, headers=headers)
    response.raise_for_status()
    return response.json()

# Uso
result = edit_message('SUA_CHAVE_API', {
    'number': '5511999999999',
    'key': {
        'id': 'BAE5xxxxxxxxxxx',
        'remoteJid': '5511999999999@s.whatsapp.net',
        'fromMe': True,
    },
    'text': 'Mensagem editada com sucesso!',
})

print(result)
```

### PHP

```php
<?php
function editMessage($apikey, $data) {
    $url = "http://localhost:8080/chat/updateMessage";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $apikey,
        'Content-Type: application/json',
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Uso
$result = editMessage('SUA_CHAVE_API', [
    'number' => '5511999999999',
    'key' => [
        'id' => 'BAE5xxxxxxxxxxx',
        'remoteJid' => '5511999999999@s.whatsapp.net',
        'fromMe' => true,
    ],
    'text' => 'Mensagem editada com sucesso!',
]);

var_dump($result);
?>
```

## Documentação Relacionada

- [📄 Análise Completa](../ANALISE_EDICAO_MENSAGENS.md)
- [🔗 API de Chat](../api-reference.md)
- [🤖 Integração Chatwoot](../chatwoot-integration.md)
- [📊 Webhooks](../webhooks.md)

## Suporte

Para mais informações ou suporte:

- 📧 Email: contato@evolution-api.com
- 💬 Discord: [Evolution API Community](https://discord.gg/evolution-api)
- 📚 Documentação: https://doc.evolution-api.com

---

**Versão:** 2.3.6  
**Última Atualização:** Outubro 2025  
**Autor:** Evolution API Team
