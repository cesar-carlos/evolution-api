<template>
  <div class="mt-8 text-center">
    <div class="bg-white dark:bg-gray-700 rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 space-y-4">
        <div
          class="bg-white dark:bg-gray-800 w-64 h-64 mx-auto flex items-center justify-center rounded-xl shadow-inner"
        >
          <!-- Loading spinner -->
          <div v-if="isLoading" class="flex flex-col items-center gap-3">
            <LoadingSpinner />
            <p class="text-sm text-gray-600 dark:text-gray-400">Gerando QR Code...</p>
          </div>

          <!-- QR Code image -->
          <img
            v-else-if="qrCodeBase64"
            :src="qrCodeBase64"
            alt="QR Code"
            class="max-w-full max-h-full rounded-lg"
          />

          <!-- Error display -->
          <div v-else-if="error" class="flex flex-col items-center gap-3 p-4">
            <ErrorIcon />
            <p class="text-sm text-red-600 dark:text-red-400 text-center">{{ error }}</p>
          </div>
        </div>

        <!-- Countdown -->
        <div v-if="!isLoading && qrCodeBase64" class="flex items-center justify-center gap-2">
          <RefreshIcon />
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Atualiza em {{ countdown }}s
          </span>
        </div>

        <!-- Instructions -->
        <div v-if="!isLoading && qrCodeBase64" class="text-sm text-gray-600 dark:text-gray-400">
          <p class="font-medium mb-2">Escaneie o QR Code com seu WhatsApp:</p>
          <ol class="text-left space-y-1 list-decimal list-inside">
            <li>Abra o WhatsApp no celular</li>
            <li>Vá em <strong>Configurações > Aparelhos conectados</strong></li>
            <li>Toque em <strong>Parear dispositivo</strong></li>
            <li>Aponte a câmera para o QR Code</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import LoadingSpinner from './LoadingSpinner.vue'
import ErrorIcon from './ErrorIcon.vue'
import RefreshIcon from './RefreshIcon.vue'

defineProps({
  qrCodeBase64: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
  countdown: {
    type: Number,
    default: 30,
  },
})
</script>

<style scoped>
/* Estilos específicos do componente */
</style>
