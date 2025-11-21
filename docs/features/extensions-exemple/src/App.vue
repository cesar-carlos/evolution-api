<template>
  <div
    id="webcrumbs"
    class="bg-gradient-to-br from-primary-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center font-sans p-4 relative"
  >
    <!-- Botão de tema no canto superior direito -->
    <ThemeToggle class="absolute top-4 right-4 z-10" />

    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 transition-all duration-300 transform hover:shadow-primary-200/50"
    >
      <header class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <img :src="logoLight" alt="SE7E Sistemas" class="h-16 w-auto dark:hidden" />
          <img :src="logoDark" alt="SE7E Sistemas" class="h-16 w-auto hidden dark:block" />
        </div>
        <h1 class="text-2xl font-bold dark:text-white font-title">Evolution API</h1>
        <p class="text-gray-600 dark:text-gray-300 text-sm font-body">QR Code Scanner</p>
        <div class="mt-4 w-16 h-1 bg-primary-500 mx-auto rounded-full"></div>
      </header>

      <!-- Modal de configuração da API Key -->
      <div
        v-if="needsApiKey"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="() => {}"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 m-4">
          <h2 class="text-xl font-bold dark:text-white mb-4">Configurar API Key</h2>
          <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Para usar esta aplicação, você precisa da API key do Evolution API.
          </p>
          <div
            class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6"
          >
            <p class="text-blue-800 dark:text-blue-200 text-xs">
              <strong>Onde encontrar:</strong><br />
              • Variável <code>AUTHENTICATION_API_KEY</code> no arquivo .env<br />
              • Ou a API key global configurada no servidor Evolution API
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <input
              v-model="apiKeyInput"
              type="password"
              placeholder="Digite sua API key..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              @keyup.enter="saveApiKey"
            />
          </div>
          <div class="flex gap-3">
            <button
              @click="saveApiKey"
              :disabled="!apiKeyInput.trim()"
              class="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>

      <!-- Mensagem de erro -->
      <ErrorDisplay v-if="error" :message="error" @close="error = ''" />

      <!-- Formulário de conexão -->
      <ConnectionForm
        v-if="!isConnected && !qrCodeData"
        :is-loading="isLoading"
        :is-connected="isConnected"
        :initial-instance="instanceName"
        @generate="generateQRCodeHandler"
      />

      <!-- Display do QR Code -->
      <QRCodeDisplay
        v-if="qrCodeData && !isConnected && connectionState !== 'open'"
        :qr-code-base64="qrCodeBase64"
        :is-loading="isLoading"
        :error="error"
        :countdown="countdown"
      />

      <!-- Status de conexão -->
      <ConnectionStatus
        v-if="connectionState === 'open' || isConnected"
        :connection-state="connectionState"
        :is-connected="isConnected"
        :profile-info="profileInfo"
        :instance-name="instanceName"
        @disconnect="disconnectHandler"
        @restart="restartHandler"
      />

      <!-- Logs do sistema -->
      <LogViewer :logs="logs" @clear="clearLogs" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ConnectionForm from './components/ConnectionForm.vue'
import QRCodeDisplay from './components/QRCodeDisplay.vue'
import ConnectionStatus from './components/ConnectionStatus.vue'
import LogViewer from './components/LogViewer.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import ErrorDisplay from './components/ErrorDisplay.vue'
import { useAuth } from './composables/useAuth.js'
import { useQRCode } from './composables/useQRCode.js'
import { useConnection } from './composables/useConnection.js'

// Composables
const { initAuth, isAuthenticated, needsApiKey, setApiKey } = useAuth()
const {
  isLoading,
  error,
  countdown,
  qrCodeBase64,
  qrCodeData,
  isConnected,
  generateQRCode,
  clearQRCode,
} = useQRCode()
const {
  connectionState,
  profileInfo,
  startPolling,
  stopPolling,
  disconnect,
  restart,
  checkConnectionState,
} = useConnection()

// Estado local
const instanceName = ref('')
const logs = ref([])
const apiKeyInput = ref('')

// Computed properties para logos
// Detectar se está em produção ou desenvolvimento
const isProduction = computed(() => {
  // Em produção, o base href é /qrcode/
  return window.location.pathname.startsWith('/qrcode')
})

const logoLight = computed(() =>
  isProduction.value ? '/qrcode/images/logo-se7e-light.png' : '/images/logo-se7e-light.png'
)
const logoDark = computed(() =>
  isProduction.value ? '/qrcode/images/logo-se7e-dark.png' : '/images/logo-se7e-dark.png'
)

// Funções de logging
const addLog = (type, message) => {
  logs.value.push({
    id: Date.now().toString() + Math.random(),
    type,
    message,
    timestamp: new Date(),
  })
}

const clearLogs = () => {
  logs.value = []
}

// Função para salvar API Key
const saveApiKey = async () => {
  try {
    const key = apiKeyInput.value.trim()
    if (!key) {
      error.value = 'API Key não pode estar vazia'
      return
    }

    setApiKey(key)
    apiKeyInput.value = ''
    addLog('success', 'API Key configurada com sucesso!')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao configurar API Key'
    error.value = errorMessage
    addLog('error', errorMessage)
  }
}

// Funções de conexão
const generateQRCodeHandler = async (name) => {
  try {
    error.value = ''
    instanceName.value = name
    addLog('info', `Gerando QR Code para instância: ${name}`)

    if (!isAuthenticated.value) {
      addLog('info', 'Autenticando...')
      await initAuth()
      addLog('success', 'Autenticado com sucesso!')
    }

    await generateQRCode(name)

    if (isConnected.value) {
      addLog('info', 'Instância já conectada! Buscando informações...')
      // Definir connectionState como 'open' para mostrar ConnectionStatus
      await checkConnectionState(name)
      addLog('success', 'Detalhes da instância carregados!')
    } else {
      addLog('success', 'QR Code gerado com sucesso!')
      startPolling(name)
      addLog('info', 'Aguardando escaneamento do QR Code')
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    error.value = errorMessage
    addLog('error', errorMessage)
    console.error('[App] Error generating QR code:', err)
  }
}

const disconnectHandler = async () => {
  try {
    error.value = ''
    addLog('info', `Desconectando instância: ${instanceName.value}`)
    await disconnect(instanceName.value)
    addLog('success', 'Desconectado com sucesso!')
    clearQRCode()
    instanceName.value = ''
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    error.value = errorMessage
    addLog('error', errorMessage)
    console.error('[App] Error disconnecting:', err)
  }
}

const restartHandler = async () => {
  try {
    error.value = ''
    addLog('info', `Reiniciando instância: ${instanceName.value}`)
    await restart(instanceName.value)
    addLog('success', 'Instância reiniciada com sucesso!')
    clearQRCode()
    addLog('info', 'Aguardando reconexão...')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    error.value = errorMessage
    addLog('error', errorMessage)
    console.error('[App] Error restarting:', err)
  }
}

// Watchers
watch(isConnected, (connected) => {
  if (connected) {
    addLog('success', 'WhatsApp conectado com sucesso!')
    stopPolling()
  }
})

// Lifecycle
onMounted(async () => {
  addLog('info', 'Aplicação iniciada')

  // Tentar inicializar autenticação automaticamente
  try {
    await initAuth()
  } catch (error) {
    // O modal será mostrado automaticamente se necessário
  }

  // Verificar parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search)
  const instanceParam = urlParams.get('instance')

  if (instanceParam) {
    addLog('info', `Parâmetro de instância detectado: ${instanceParam}`)

    if (
      /^[a-zA-Z0-9\-_]+$/.test(instanceParam) &&
      instanceParam.length >= 3 &&
      instanceParam.length <= 50
    ) {
      instanceName.value = instanceParam
      addLog('success', `Instância ${instanceParam} configurada!`)

      // Verificar se está autenticado antes de conectar automaticamente
      if (!isAuthenticated.value) {
        addLog('warning', 'Autenticação necessária. Aguarde a inicialização.')
        return // Não tenta conectar sem autenticação
      }

      // Verifica se autoConnect foi explicitamente definido como false
      const disableAuto = urlParams.get('autoConnect') === 'false'

      if (!disableAuto) {
        addLog('info', 'Gerando QR Code automaticamente...')
        setTimeout(() => {
          generateQRCodeHandler(instanceParam)
        }, 500)
      } else {
        addLog('info', 'Instância preenchida. Clique em "Gerar QR Code" para conectar.')
      }
    } else {
      addLog('error', 'Nome de instância inválido no parâmetro da URL')
      error.value = 'Nome de instância inválido no parâmetro da URL'
    }
  }
})
</script>

<style scoped>
/* Estilos específicos do componente principal */
</style>
