import { ref, computed } from 'vue'
import QRCode from 'qrcode'
import { axiosInstance } from './useAuth.js'

// Configurações
const QR_REFRESH_INTERVAL = 30000 // 30 segundos

// Estado reativo
const qrCodeData = ref(null)
const isLoading = ref(false)
const error = ref(null)
const countdown = ref(30)

// Refs para timers
let refreshTimer = null
let countdownTimer = null

// Configurações do QR Code
const qrOptions = {
  margin: 3,
  scale: 4,
  errorCorrectionLevel: 'H',
  color: {
    light: '#ffffff',
    dark: '#22c55e', // Cor configurável
  },
}

// Função para validar nome da instância
function validateInstanceName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Nome da instância é obrigatório')
  }

  if (name.length < 3 || name.length > 50) {
    throw new Error('Nome da instância deve ter entre 3 e 50 caracteres')
  }

  if (!/^[a-zA-Z0-9\-_]+$/.test(name)) {
    throw new Error('Nome da instância contém caracteres inválidos')
  }
}

// Função para conectar e gerar QR Code
async function connect(instanceName) {
  validateInstanceName(instanceName)

  try {
    const response = await axiosInstance.get(`/instance/connect/${instanceName}`)

    if (response.error) {
      const errorMessage = typeof response.message === 'string' ? response.message : 'Erro ao conectar à instância'
      throw new Error(errorMessage)
    }

    // Verificar se já está conectado
    if (response.instance && typeof response.instance === 'object') {
      const instance = response.instance
      if (instance.state === 'open') {
        return {
          base64: '',
          code: '',
          isConnected: true,
          instanceName: String(instance.instanceName || ''),
          state: String(instance.state),
        }
      }
    }

    // Processar QR Code
    let qrData
    if (response.base64) {
      qrData = response
    } else if (response.qrcode || response.qrCode) {
      qrData = response.qrcode || response.qrCode
    } else {
      throw new Error('Não foi possível gerar QR Code. A instância pode não existir ou já estar conectada.')
    }

    if (!qrData.base64) {
      throw new Error('QR Code não contém imagem base64')
    }

    return qrData
  } catch (err) {
    // Tratamento especial para erro 404
    if (err.status === 404) {
      throw new Error(
        `Instância "${instanceName}" não encontrada. Verifique se o nome da instância está correto ou se ela já foi criada.`
      )
    }
    // Outros erros já têm mensagem formatada pelo interceptor
    throw err
  }
}

// Funções principais do composable
async function generateQRCode(instanceName) {
  try {
    isLoading.value = true
    error.value = null

    const response = await connect(instanceName)

    if (response.isConnected) {
      qrCodeData.value = response
      isLoading.value = false
      return
    }

    qrCodeData.value = response
    isLoading.value = false

    startCountdown()
    startAutoRefresh(instanceName)

    return response
  } catch (err) {
    isLoading.value = false
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    error.value = errorMessage
    throw err
  }
}

async function refreshQRCode(instanceName) {
  try {
    const response = await connect(instanceName)
    qrCodeData.value = response
    error.value = null

    startCountdown()
    startAutoRefresh(instanceName)

    return response
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    error.value = errorMessage
    throw err
  }
}

function clearQRCode() {
  qrCodeData.value = null
  error.value = null
  countdown.value = 30
  stopCountdown()
  stopAutoRefresh()
}

// Funções de controle de timers
function startCountdown() {
  stopCountdown()
  countdown.value = 30
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      stopCountdown()
    }
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function startAutoRefresh(instanceName) {
  stopAutoRefresh()
  refreshTimer = setTimeout(() => {
    refreshQRCode(instanceName)
  }, QR_REFRESH_INTERVAL)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

// Computed properties
const hasQRCode = computed(() => !!qrCodeData.value)
const qrCodeBase64 = computed(() => {
  return qrCodeData.value?.base64 || ''
})
const qrCodeCount = computed(() => {
  return qrCodeData.value?.count || 0
})
const isConnected = computed(() => {
  return qrCodeData.value?.isConnected || false
})

// Cleanup on unmount
function cleanup() {
  stopCountdown()
  stopAutoRefresh()
}

// Função para gerar QR Code usando a biblioteca qrcode
async function generateQRCodeFromText(text, options = qrOptions) {
  try {
    const base64 = await QRCode.toDataURL(text, options)
    return base64
  } catch (err) {
    console.error('Error generating QR code:', err)
    throw err
  }
}

// Exportar composable
export function useQRCode() {
  return {
    qrCodeData,
    isLoading,
    error,
    countdown,
    hasQRCode,
    qrCodeBase64,
    qrCodeCount,
    isConnected,
    generateQRCode,
    refreshQRCode,
    clearQRCode,
    generateQRCodeFromText,
    cleanup,
  }
}
