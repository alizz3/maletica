<script setup>
import { ref, onMounted } from 'vue'

const KEY = 'maletica-tema'
const oscuro = ref(false)

function temaActual() {
  const t = document.documentElement.getAttribute('data-theme')
  if (t) return t === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function cambiar() {
  oscuro.value = !oscuro.value
  const t = oscuro.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', t)
  try {
    localStorage.setItem(KEY, t)
  } catch (e) {}
}

onMounted(() => (oscuro.value = temaActual()))
</script>

<template>
  <button
    class="theme"
    type="button"
    @click="cambiar"
    :aria-label="oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :title="oscuro ? 'Modo claro' : 'Modo oscuro'"
  >
    <svg v-if="oscuro" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  </button>
</template>

<style scoped>
.theme {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--line);
  background: var(--lav-soft);
  color: var(--lav);
  display: grid;
  place-items: center;
  padding: 0;
  flex: 0 0 40px;
}
.theme:hover {
  border-color: var(--lav);
}
svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
