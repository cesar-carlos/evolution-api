<template>
  <div class="space-y-6">
    <div>
      <label for="instance" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Nome da Instância
      </label>
      <input
        id="instance"
        v-model="instanceName"
        type="text"
        class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder="minha-instancia-whatsapp"
        :pattern="instancePattern"
        maxlength="50"
        :disabled="isLoading || isConnected"
        @keyup.enter="handleSubmit"
      />
      <p v-if="errorMessage" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errorMessage }}
      </p>
      <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Apenas letras, números, hífens e underscores são permitidos
      </p>
    </div>

    <button
      :disabled="!isValid || isLoading || isConnected"
      class="w-full bg-primary-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 transform hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="handleSubmit"
    >
      <LoadingSpinner v-if="isLoading" />
      <QRCodeIcon v-else />
      <span>{{ buttonText }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import QRCodeIcon from './QRCodeIcon.vue'

// Props
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  isConnected: {
    type: Boolean,
    default: false,
  },
  initialInstance: {
    type: String,
    default: '',
  },
})

// Emits
const emit = defineEmits(['generate'])

// Estado reativo
const instanceName = ref(props.initialInstance || '')

// Configurações de validação
const INSTANCE_PATTERN = /^[a-zA-Z0-9\-_]+$/
const MIN_LENGTH = 3
const MAX_LENGTH = 50

// Computed properties
const isValid = computed(() => {
  const trimmed = instanceName.value.trim()

  if (!trimmed) return false
  if (trimmed.length < MIN_LENGTH) return false
  if (trimmed.length > MAX_LENGTH) return false
  if (!INSTANCE_PATTERN.test(trimmed)) return false

  return true
})

// Computed para mensagem de erro
const errorMessage = computed(() => {
  if (!isValid.value && instanceName.value.trim()) {
    const trimmed = instanceName.value.trim()
    if (trimmed.length < MIN_LENGTH) return `Mínimo de ${MIN_LENGTH} caracteres`
    if (trimmed.length > MAX_LENGTH) return `Máximo de ${MAX_LENGTH} caracteres`
    if (!INSTANCE_PATTERN.test(trimmed))
      return 'Apenas letras, números, hífens e underscores são permitidos'
  }
  return ''
})

const instancePattern = computed(() => INSTANCE_PATTERN.source)
const buttonText = computed(() => {
  if (props.isLoading) return 'Gerando...'
  if (props.isConnected) return 'Conectado'
  return 'Gerar QR Code'
})

// Funções
function handleSubmit() {
  if (!isValid.value || props.isLoading || props.isConnected) return

  const trimmedName = instanceName.value.trim()
  localStorage.setItem('qrcode-last-instance', trimmedName)
  emit('generate', trimmedName)
}

// Watchers
// Salvar no localStorage quando o valor mudar
watch(instanceName, (newValue) => {
  if (newValue) {
    localStorage.setItem('qrcode-last-instance', newValue)
  }
})
</script>

<style scoped>
/* Estilos específicos do componente */
</style>
