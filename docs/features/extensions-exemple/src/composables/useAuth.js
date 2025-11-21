import { ref, computed } from 'vue'
import axios from 'axios'

// Configurações da API
const API_BASE_URL = ''
const STORAGE_KEYS = {
  API_KEY: 'qrcode-api-key',
  SESSION_TOKEN: 'qrcode-session-token',
  THEME: 'qrcode-theme',
}

// Estado reativo
const isAuthenticated = ref(false)
const sessionToken = ref(null)
const apiKey = ref(null)
const needsApiKey = ref(false)

// Instância do axios
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Configurar interceptors
axiosInstance.interceptors.request.use(
  (config) => {
    const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY)
    const currentApiKey = apiKey.value || savedApiKey

    if (currentApiKey && config.headers) {
      config.headers.apikey = currentApiKey
    }
    return config
  },
  (error) => Promise.reject(handleError(error))
)

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(handleError(error))
)

// Função para tratar erros
function handleError(error) {
  const errorInfo = {
    message: 'Erro desconhecido',
    status: 0,
  }

  if (error.response) {
    errorInfo.status = error.response.status
    errorInfo.message = getErrorMessage(error.response.status)
    errorInfo.details = error.response.data
  } else if (error.request) {
    errorInfo.message = 'Erro de conexão com o servidor'
    errorInfo.code = 'NETWORK_ERROR'
  } else {
    errorInfo.message = error.message || 'Erro ao processar requisição'
    errorInfo.code = 'REQUEST_ERROR'
  }

  // Logging removido para produção
  return errorInfo
}

// Função para obter mensagem de erro baseada no status HTTP
function getErrorMessage(status) {
  const messages = {
    400: 'Requisição inválida',
    401: 'Não autorizado. Verifique a API key',
    403: 'Acesso negado',
    404: 'Recurso não encontrado',
    429: 'Muitas requisições. Aguarde alguns segundos',
    500: 'Erro interno do servidor',
  }

  return messages[status] || `Erro ${status}`
}

// Funções de autenticação
function setApiKey(key) {
  if (!key || typeof key !== 'string') {
    throw new Error('API Key inválida')
  }

  apiKey.value = key
  isAuthenticated.value = true
  needsApiKey.value = false

  axiosInstance.defaults.headers.apikey = key
  localStorage.setItem(STORAGE_KEYS.API_KEY, key)

  return true
}

function checkApiKeyRequired() {
  needsApiKey.value = !apiKey.value
  return !needsApiKey.value
}

function restoreApiKey() {
  const key = localStorage.getItem(STORAGE_KEYS.API_KEY)

  if (key) {
    apiKey.value = key
    isAuthenticated.value = true
    needsApiKey.value = false
    axiosInstance.defaults.headers.apikey = key
    return true
  }

  needsApiKey.value = true
  return false
}

function clearAuth() {
  isAuthenticated.value = false
  sessionToken.value = null
  apiKey.value = null
  needsApiKey.value = true

  axiosInstance.defaults.headers.apikey = null

  localStorage.removeItem(STORAGE_KEYS.API_KEY)
  localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)
}

async function initAuth() {
  if (restoreApiKey()) {
    return true
  }

  // Tentar obter API key via sistema de token temporário
  try {
    const response = await axiosInstance.get('/qrcode/api-key')

    if (response && response.configured && response.sessionToken) {
      // Trocar token temporário pela API key real
      const exchangeResponse = await axiosInstance.post('/qrcode/exchange-token', {
        sessionToken: response.sessionToken,
      })

      if (exchangeResponse && exchangeResponse.apiKey) {
        setApiKey(exchangeResponse.apiKey)
        return true
      }
    }

    // Se não conseguir obter API key, solicitar ao usuário
    needsApiKey.value = true
    throw new Error('API Key necessária. Por favor, configure sua API key.')
  } catch (error) {
    // Se o servidor não tiver API key configurada, solicitar ao usuário
    needsApiKey.value = true
    throw new Error('API Key necessária. Por favor, configure sua API key.')
  }
}

// Computed properties
const hasApiKey = computed(() => !!apiKey.value)

// Exportar composable
export function useAuth() {
  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    needsApiKey: computed(() => needsApiKey.value),
    hasApiKey,
    setApiKey,
    checkApiKeyRequired,
    restoreApiKey,
    clearAuth,
    initAuth,
  }
}

// Exportar axios instance para outros módulos
export { axiosInstance }
