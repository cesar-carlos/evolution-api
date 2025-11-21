<template>
  <button
    class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
    :aria-label="isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
    @click="toggleTheme"
  >
    <!-- Sun icon (light theme) -->
    <svg
      v-if="isDark"
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
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>

    <!-- Moon icon (dark theme) -->
    <svg
      v-else
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
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Constants
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}

const STORAGE_KEY = 'qrcode-theme'

// Estado reativo
const isDark = ref(false)

// Funções do tema
function setTheme(theme) {
  isDark.value = theme === THEMES.DARK

  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  localStorage.setItem(STORAGE_KEY, theme)
}

function toggleTheme() {
  const newTheme = isDark.value ? THEMES.LIGHT : THEMES.DARK
  setTheme(newTheme)
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY)

  if (savedTheme) {
    setTheme(savedTheme)
  } else {
    // Detectar preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? THEMES.DARK : THEMES.LIGHT)
  }
}

// Lifecycle
onMounted(() => {
  initTheme()

  // Listener para mudanças na preferência do sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT)
    }
  })
})
</script>

<style scoped>
/* Estilos específicos do componente */
</style>
