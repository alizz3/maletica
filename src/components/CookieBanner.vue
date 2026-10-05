<script setup>
// Banner de cookies: Google Analytics NO se carga hasta que aceptes.
// El login y el guardado usan almacenamiento esencial, que no requiere consentimiento.
import { ref, onMounted } from 'vue'

const KEY = 'maletica-cookies'
const GA_ID = import.meta.env.VITE_GA_ID
const visible = ref(false)

function cargarAnalytics() {
  if (!GA_ID || window.gtag) return
  const sc = document.createElement('script')
  sc.async = true
  sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID
  document.head.appendChild(sc)
  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { anonymize_ip: true })
}

function responder(acepta) {
  try {
    localStorage.setItem(KEY, acepta ? 'si' : 'no')
  } catch (e) {}
  visible.value = false
  if (acepta) cargarAnalytics()
}

onMounted(() => {
  if (!GA_ID) return
  let r = null
  try {
    r = localStorage.getItem(KEY)
  } catch (e) {}
  if (r === 'si') cargarAnalytics()
  else if (r !== 'no') visible.value = true
})
</script>

<template>
  <div v-if="visible" class="cookies" role="dialog" aria-labelledby="ck-t" aria-describedby="ck-d">
    <strong id="ck-t">¿Aceptas cookies de analítica?</strong>
    <p id="ck-d">
      Usamos Google Analytics solo para saber cuántas personas usan Maletica. No se activa hasta que aceptes.
      <a href="/privacidad.html">Política de privacidad</a>
    </p>
    <div class="row">
      <button type="button" class="btn" @click="responder(true)">Aceptar</button>
      <button type="button" class="btn ghost" @click="responder(false)">Rechazar</button>
    </div>
  </div>
</template>

<style scoped>
.cookies {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  max-width: 520px;
  margin: 0 auto;
  background: var(--surface);
  border: 1.5px solid var(--lav);
  border-radius: var(--r);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 20;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}
p {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
a {
  color: var(--lav);
}
</style>
