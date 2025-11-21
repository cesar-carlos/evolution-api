<template>
  <div
    class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
  >
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 mt-0.5">
        <svg
          class="w-5 h-5 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Erro</h3>
        <p class="text-sm text-red-700 dark:text-red-300">
          {{ message }}
        </p>
      </div>

      <button
        class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
        @click="handleClose"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
})

// Emits
const emit = defineEmits(['close'])

// Functions
function handleClose() {
  emit('close')
}
</script>

<style scoped>
/* Estilos específicos do componente */
</style>
