import { ref, computed } from 'vue'
import { axiosInstance } from './useAuth.js'

// Configurações
const CONNECTION_CHECK_INTERVAL = 3000 // 3 segundos

// Estado reativo
const connectionState = ref('close')
const profileInfo = ref(null)
const isPolling = ref(false)

// Refs para timers
let pollingTimer = null

// Estados possíveis da conexão
const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSE: 'close',
}

// Função para verificar estado da conexão
async function checkConnectionState(instanceName) {
  try {
    const response = await axiosInstance.get(`/instance/connectionState/${instanceName}`)

    if (!response || !('instance' in response)) {
      throw new Error('Erro ao verificar estado da conexão')
    }

    const state = response.instance.state
    connectionState.value = state

    // Se conectado, buscar informações do perfil
    if (state === CONNECTION_STATES.OPEN) {
      await fetchProfileInfo(instanceName)
      stopPolling()
    }

    return state
  } catch (error) {
    console.error('[useConnection] Error checking connection state:', error)
    connectionState.value = CONNECTION_STATES.CLOSE
    throw error
  }
}

// Função para buscar informações do perfil
async function fetchProfileInfo(instanceName) {
  try {
    const info = await axiosInstance.get('/instance/fetchInstances')

    if (Array.isArray(info)) {
      const instanceInfo = info.find((instance) => instance.instanceName === instanceName)
      profileInfo.value = instanceInfo || null
    } else {
      profileInfo.value = info || null
    }

    return profileInfo.value
  } catch (error) {
    console.error('[useConnection] Error fetching profile info:', error)
    return null
  }
}

// Funções de controle de polling
function startPolling(instanceName) {
  if (isPolling.value) return

  isPolling.value = true
  checkConnectionState(instanceName)

  pollingTimer = setInterval(() => {
    checkConnectionState(instanceName)
  }, CONNECTION_CHECK_INTERVAL)
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
  isPolling.value = false
}

// Funções de controle da instância
async function disconnect(instanceName) {
  try {
    await axiosInstance.delete(`/instance/logout/${instanceName}`)
    connectionState.value = CONNECTION_STATES.CLOSE
    isConnected.value = false
    profileInfo.value = null
    stopPolling()
  } catch (error) {
    console.error('[useConnection] Error disconnecting:', error)
    throw error
  }
}

async function restart(instanceName) {
  try {
    await axiosInstance.post(`/instance/restart/${instanceName}`, {})
    connectionState.value = CONNECTION_STATES.CONNECTING
    isConnected.value = false
    profileInfo.value = null
    startPolling(instanceName)
  } catch (error) {
    console.error('[useConnection] Error restarting:', error)
    throw error
  }
}

// Funções de atualização do perfil
async function updateProfileName({ instanceName, name }) {
  try {
    await axiosInstance.post('/instance/updateProfileName', {
      instanceName,
      name,
    })

    if (profileInfo.value) {
      profileInfo.value.profileName = name
    }
  } catch (error) {
    console.error('[useConnection] Error updating profile name:', error)
    throw error
  }
}

async function updateProfileStatus({ instanceName, status }) {
  try {
    await axiosInstance.post('/instance/updateProfileStatus', {
      instanceName,
      status,
    })
  } catch (error) {
    console.error('[useConnection] Error updating profile status:', error)
    throw error
  }
}

async function updateProfilePicture({ instanceName, picture }) {
  try {
    await axiosInstance.post('/instance/updateProfilePicture', {
      instanceName,
      picture,
    })
  } catch (error) {
    console.error('[useConnection] Error updating profile picture:', error)
    throw error
  }
}

// Função para resetar conexão
function resetConnection() {
  connectionState.value = CONNECTION_STATES.CLOSE
  profileInfo.value = null
  stopPolling()
}

// Computed properties
const isConnected = computed(() => connectionState.value === CONNECTION_STATES.OPEN)
const isConnecting = computed(() => connectionState.value === CONNECTION_STATES.CONNECTING)
const profileName = computed(() => {
  return profileInfo.value?.profileName || ''
})
const profilePicUrl = computed(() => {
  return profileInfo.value?.profilePicUrl || ''
})

// Cleanup on unmount
function cleanup() {
  stopPolling()
}

// Exportar composable
export function useConnection() {
  return {
    connectionState,
    isConnected,
    isConnecting,
    profileInfo,
    profileName,
    profilePicUrl,
    isPolling,
    checkConnectionState,
    fetchProfileInfo,
    startPolling,
    stopPolling,
    disconnect,
    restart,
    updateProfileName,
    updateProfileStatus,
    updateProfilePicture,
    resetConnection,
    cleanup,
  }
}
