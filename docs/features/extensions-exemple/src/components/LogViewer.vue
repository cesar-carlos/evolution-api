<template>
  <div class="mt-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden">
    <div
      class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Logs do Sistema</h3>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ logs.length }} mensagens
          </span>
          <button
            v-if="logs.length > 0"
            class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            @click="handleClear"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>

    <div ref="logsContainer" class="h-48 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
      <!-- Empty state -->
      <div
        v-if="logs.length === 0"
        class="flex items-center justify-center h-full text-gray-400 dark:text-gray-500"
      >
        <p class="text-sm">Nenhum log ainda...</p>
      </div>

      <!-- Logs -->
      <div
        v-for="log in logs"
        :key="log.id"
        class="flex items-start gap-2 text-sm animate-fade-in"
        :class="getLogColor(log.type)"
      >
        <div class="flex-shrink-0 mt-0.5">
          <LogIcon :type="log.type" />
        </div>

        <div class="flex-1 min-w-0">
          <p class="break-words">{{ log.message }}</p>
          <p class="text-xs opacity-75 mt-0.5">{{ formatTime(log.timestamp) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import LogIcon from './LogIcon.vue'

// Props
const props = defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
})

// Emits
const emit = defineEmits(['clear'])

// Refs
const logsContainer = ref(null)

// Funções para cores dos logs
function getLogColor(type) {
  const colors = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
  }

  return colors[type] || colors.info
}

// Função para formatar timestamp
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Função para limpar logs
function handleClear() {
  emit('clear')
}

// Auto-scroll para o final quando novos logs são adicionados
watch(
  () => props.logs.length,
  async () => {
    await nextTick()
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  }
)
</script>

<style scoped>
/* Estilos específicos do componente */
</style>
