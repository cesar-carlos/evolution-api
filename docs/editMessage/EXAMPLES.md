# 📝 Exemplos Práticos - Edição de Mensagens

## 🎯 Cenários de Uso

### 1. Corrigir Erro de Digitação

```bash
# Situação: Enviou "Oláa" por engano e quer corrigir para "Olá"

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
    "text": "Olá"
  }'
```

### 2. Adicionar Informação em Mensagem Anterior

```bash
# Situação: Enviou preço de produto e precisa adicionar detalhes

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
    "text": "Produto: R$ 100,00\nTamanho: P, M, G\nCor: Preto, Branco"
  }'
```

### 3. Corrigir Caption de Produto

```bash
# Situação: Enviou imagem de produto com caption errado

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
    "text": "🎯 Promoção Especial!\n\nCamiseta: R$ 49,90\nFrete Grátis!"
  }'
```

### 4. Atualizar Status de Pedido

```bash
# Situação: Status do pedido mudou e precisa atualizar mensagem

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
    "text": "✅ Pedido #12345\n📦 Status: Enviado\n🚚 Previsão: 2-3 dias úteis"
  }'
```

## 💻 Exemplos por Linguagem

### Node.js/JavaScript

```javascript
const axios = require('axios');

async function editMessage(apikey, instanceName, messageData) {
  try {
    const response = await axios.post(
      `http://localhost:8080/chat/updateMessage`,
      {
        number: messageData.number,
        key: {
          id: messageData.keyId,
          remoteJid: messageData.remoteJid,
          fromMe: true
        },
        text: messageData.newText
      },
      {
        headers: {
          'apikey': apikey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Mensagem editada com sucesso!', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao editar mensagem:', error.response?.data || error.message);
    throw error;
  }
}

// Exemplo de uso
editMessage('SUA_CHAVE_API', 'minha-instancia', {
  number: '5511999999999',
  keyId: 'BAE5xxxxxxxxxxx',
  remoteJid: '5511999999999@s.whatsapp.net',
  newText: 'Mensagem editada!'
});
```

### Python

```python
import requests
from typing import Dict

def edit_message(apikey: str, instance_name: str, data: Dict) -> Dict:
    """
    Edita uma mensagem no WhatsApp.
    
    Args:
        apikey: Chave de API do Evolution
        instance_name: Nome da instância
        data: Dados da mensagem
        
    Returns:
        Dict com resposta da API
    """
    url = f"http://localhost:8080/chat/updateMessage"
    headers = {
        "apikey": apikey,
        "Content-Type": "application/json"
    }
    
    payload = {
        "number": data["number"],
        "key": {
            "id": data["key"]["id"],
            "remoteJid": data["key"]["remoteJid"],
            "fromMe": True
        },
        "text": data["text"]
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        print("✅ Mensagem editada com sucesso!")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao editar mensagem: {e}")
        raise

# Exemplo de uso
result = edit_message(
    apikey='SUA_CHAVE_API',
    instance_name='minha-instancia',
    data={
        'number': '5511999999999',
        'key': {
            'id': 'BAE5xxxxxxxxxxx',
            'remoteJid': '5511999999999@s.whatsapp.net'
        },
        'text': 'Mensagem editada com sucesso!'
    }
)

print(result)
```

### PHP

```php
<?php
class MessageEditor {
    private $baseUrl;
    private $apikey;
    
    public function __construct(string $baseUrl, string $apikey) {
        $this->baseUrl = $baseUrl;
        $this->apikey = $apikey;
    }
    
    /**
     * Edita uma mensagem no WhatsApp
     */
    public function editMessage(array $data): array {
        $url = $this->baseUrl . '/chat/updateMessage';
        
        $payload = [
            'number' => $data['number'],
            'key' => [
                'id' => $data['key']['id'],
                'remoteJid' => $data['key']['remoteJid'],
                'fromMe' => true
            ],
            'text' => $data['text']
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->apikey,
            'Content-Type: application/json',
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("Erro ao editar mensagem: HTTP $httpCode");
        }
        
        return json_decode($response, true);
    }
}

// Exemplo de uso
$editor = new MessageEditor('http://localhost:8080', 'SUA_CHAVE_API');

try {
    $result = $editor->editMessage([
        'number' => '5511999999999',
        'key' => [
            'id' => 'BAE5xxxxxxxxxxx',
            'remoteJid' => '5511999999999@s.whatsapp.net'
        ],
        'text' => 'Mensagem editada com sucesso!'
    ]);
    
    echo "✅ Mensagem editada com sucesso!\n";
    print_r($result);
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
?>
```

### cURL

```bash
#!/bin/bash

# Configurações
APIKEY="SUA_CHAVE_API"
BASE_URL="http://localhost:8080"
NUMBER="5511999999999"
KEY_ID="BAE5xxxxxxxxxxx"
REMOTE_JID="5511999999999@s.whatsapp.net"
NEW_TEXT="Mensagem editada com sucesso!"

# Função para editar mensagem
edit_message() {
  curl -X POST "${BASE_URL}/chat/updateMessage" \
    -H "apikey: ${APIKEY}" \
    -H "Content-Type: application/json" \
    -d '{
      "number": "'"${NUMBER}"'",
      "key": {
        "id": "'"${KEY_ID}"'",
        "remoteJid": "'"${REMOTE_JID}"'",
        "fromMe": true
      },
      "text": "'"${NEW_TEXT}"'"
    }'
}

# Executar
echo "📝 Editando mensagem..."
RESPONSE=$(edit_message)
echo "Resposta: ${RESPONSE}"
```

## 🔄 Fluxo Completo

### Buscar → Editar → Verificar

```javascript
// 1. Buscar mensagens recentes
const findMessages = async (apikey, number) => {
  const response = await axios.post(
    'http://localhost:8080/chat/findMessages',
    {
      where: {
        fromMe: true,
        remoteJid: `${number}@s.whatsapp.net`
      },
      limit: 1
    },
    { headers: { apikey } }
  );
  
  return response.data.messages[0];
};

// 2. Editar mensagem
const editMessage = async (apikey, number, keyId, newText) => {
  const response = await axios.post(
    'http://localhost:8080/chat/updateMessage',
    {
      number,
      key: {
        id: keyId,
        remoteJid: `${number}@s.whatsapp.net`,
        fromMe: true
      },
      text: newText
    },
    { headers: { apikey } }
  );
  
  return response.data;
};

// 3. Fluxo completo
(async () => {
  try {
    const apikey = 'SUA_CHAVE_API';
    const number = '5511999999999';
    
    console.log('1️⃣ Buscando mensagem...');
    const message = await findMessages(apikey, number);
    
    console.log('2️⃣ Editando mensagem...');
    const result = await editMessage(
      apikey,
      number,
      message.key.id,
      'Mensagem editada!'
    );
    
    console.log('✅ Sucesso!', result);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
})();
```

## 🚨 Tratamento de Erros

```javascript
const editWithErrorHandling = async (data) => {
  try {
    // Validar dados
    if (!data.number || !data.key || !data.text) {
      throw new Error('Dados incompletos');
    }
    
    // Verificar timestamp (15 minutos)
    const messageAge = Date.now() - (data.messageTimestamp * 1000);
    if (messageAge > 15 * 60 * 1000) {
      throw new Error('Mensagem muito antiga (limite: 15 minutos)');
    }
    
    // Tentar editar
    const response = await editMessage(data);
    return response;
    
  } catch (error) {
    // Tratar erros específicos
    if (error.response?.status === 404) {
      console.error('❌ Mensagem não encontrada');
    } else if (error.response?.status === 400) {
      console.error('❌ Dados inválidos:', error.response.data);
    } else if (error.message.includes('15 minutos')) {
      console.error('⏰ Mensagem muito antiga para editar');
    } else {
      console.error('❌ Erro desconhecido:', error.message);
    }
    throw error;
  }
};
```

## 📊 Monitoramento

```javascript
const editWithMonitoring = async (data) => {
  const startTime = Date.now();
  
  try {
    console.log('📝 Iniciando edição...');
    const result = await editMessage(data);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Editada em ${duration}ms`);
    
    // Log para análise
    console.log({
      timestamp: new Date().toISOString(),
      duration,
      success: true,
      messageId: result.key?.id
    });
    
    return result;
  } catch (error) {
    console.log({
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      success: false,
      error: error.message
    });
    throw error;
  }
};
```

## 🎯 Integração com Webhook

```javascript
// Listener para eventos de edição
app.post('/webhook', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'send.message.update') {
    console.log('📝 Mensagem editada:', {
      messageId: data.key.id,
      newContent: data.editedMessage.conversation,
      timestamp: new Date()
    });
    
    // Atualizar base de dados
    // Notificar cliente
    // Registrar auditoria
  }
  
  res.status(200).send('OK');
});
```

---

**Veja também:**
- [📖 README Completo](./README.md)
- [🔧 Troubleshooting](./TROUBLESHOOTING.md)
