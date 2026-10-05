<script setup>
import { entrar, entrando, errorLogin } from '../firebase.js'
import { ui } from '../store.js'
import ThemeToggle from './ThemeToggle.vue'
</script>

<template>
  <main class="login">
    <div class="login-top"><ThemeToggle /></div>

    <div class="login-card">
      <svg class="suitcase" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="22" y="8" width="20" height="12" rx="5" fill="none" stroke="currentColor" stroke-width="5" />
        <rect x="8" y="18" width="48" height="38" rx="10" fill="currentColor" />
        <rect x="8" y="33" width="48" height="6" class="strap" />
        <circle cx="32" cy="36" r="4" class="lock" />
      </svg>
      <span class="brand">Maletica</span>
      <h1>La pinta de cada día y la maleta que se arma sola</h1>
      <p class="hint">Entra con tu cuenta de Google para que tus viajes y tu armario se guarden y los veas en el celular y en el computador.</p>

      <button type="button" class="btn google big" :disabled="entrando" @click="entrar">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
        {{ entrando ? 'Abriendo Google…' : 'Entrar con Google' }}
      </button>

      <p v-if="errorLogin" class="error" role="alert">{{ errorLogin }}</p>

      <button type="button" class="link" @click="ui.sinCuenta = true">Usar sin cuenta (solo en este navegador)</button>
    </div>

    <p class="foot"><a href="/privacidad.html">Privacidad</a> · <a href="/terminos.html">Términos</a></p>
  </main>
</template>

<style scoped>
.login {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-block: 8px 24px;
}
.login-top {
  display: flex;
  justify-content: flex-end;
}
.login-card {
  background: var(--surface);
  border: 1.5px solid var(--line);
  border-radius: 22px;
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
.suitcase {
  width: 56px;
  height: 56px;
  color: var(--lav);
}
.suitcase .strap {
  fill: var(--pink);
}
.suitcase .lock {
  fill: var(--surface);
}
.brand {
  font-family: var(--f-hand);
  font-size: 28px;
  color: var(--pink);
  line-height: 1;
}
h1 {
  margin: 0;
  font-size: clamp(22px, 6vw, 28px);
  line-height: 1.2;
  text-wrap: balance;
}
.hint {
  margin: 0;
  max-width: 42ch;
}
.big {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 13px 18px;
  font-size: 15px;
  margin-top: 6px;
}
.google {
  background: var(--surface);
  color: var(--ink);
  border: 1.5px solid var(--line);
}
.google:hover {
  border-color: var(--lav);
}
.google:disabled {
  opacity: 0.7;
  cursor: wait;
}
.google svg {
  width: 20px;
  height: 20px;
}
.error {
  margin: 0;
  font-size: 13px;
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: 10px;
  padding: 10px 12px;
}
.link {
  align-self: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}
</style>
