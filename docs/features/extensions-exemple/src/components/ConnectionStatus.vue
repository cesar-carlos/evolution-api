<template>
  <div v-if="isConnected" class="mt-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Perfil Conectado</h3>
      <span
        class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      >
        <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
        Conectado
      </span>
    </div>

    <div class="flex items-center gap-4 mb-6">
      <div class="flex-shrink-0">
        <div
          v-if="profilePicUrl"
          class="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary-500"
        >
          <img :src="profilePicUrl" :alt="profileName" class="w-full h-full object-cover" />
        </div>
        <div
          v-else
          class="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold"
        >
          {{ (profileName || instanceName || 'U').charAt(0).toUpperCase() }}
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-lg font-medium text-gray-900 dark:text-white truncate">
          {{ profileName }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ instanceName }}
        </p>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="profileInfo && profileInfo._count" class="grid grid-cols-3 gap-4 mb-6">
      <div class="text-center">
        <p class="text-2xl font-bold text-primary-500">{{ profileInfo._count.Chat || 0 }}</p>
        <p class="text-xs text-gray-600 dark:text-gray-400">Conversas</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-bold text-primary-500">{{ profileInfo._count.Contact || 0 }}</p>
        <p class="text-xs text-gray-600 dark:text-gray-400">Contatos</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-bold text-primary-500">{{ profileInfo._count.Message || 0 }}</p>
        <p class="text-xs text-gray-600 dark:text-gray-400">Mensagens</p>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-3">
      <button
        class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        @click="handleRestart"
      >
        <RefreshIcon />
        Reiniciar
      </button>
      <button
        class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        @click="handleDisconnect"
      >
        <DisconnectIcon />
        Desconectar
      </button>
    </div>
  </div>

  <!-- Connecting state -->
  <div
    v-else-if="connectionState === 'connecting'"
    class="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 flex items-center gap-3"
  >
    <LoadingSpinner />
    <div>
      <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Conectando...</p>
      <p class="text-xs text-yellow-600 dark:text-yellow-400">Aguardando escaneamento do QR Code</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import DisconnectIcon from './DisconnectIcon.vue'
import RefreshIcon from './RefreshIcon.vue'

// Props
const props = defineProps({
  connectionState: {
    type: String,
    default: 'close',
  },
  isConnected: {
    type: Boolean,
    default: false,
  },
  profileInfo: {
    type: Object,
    default: null,
  },
  instanceName: {
    type: String,
    default: '',
  },
})

// Emits
const emit = defineEmits(['disconnect', 'restart'])

// Computed properties
const profileName = computed(() => {
  return props.profileInfo?.profileName || ''
})

const profilePicUrl = computed(() => {
  return props.profileInfo?.profilePicUrl || ''
})

// Functions
function handleDisconnect() {
  if (confirm('Tem certeza que deseja desconectar? Será necessário escanear novo QR Code.')) {
    emit('disconnect')
  }
}

function handleRestart() {
  if (confirm('Tem certeza que deseja reiniciar a instância? A conexão será reestabelecida.')) {
    emit('restart')
  }
}
</script>

<style scoped>
/* Estilos específicos do componente */
</style>
