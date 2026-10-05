<script setup>
import { computed } from 'vue'
import { usuario, estadoNube, nubeDisponible, entrar, salir } from '../firebase.js'

const textos = {
  local: 'Guardado solo en este navegador',
  cargando: 'Trayendo tus datos…',
  guardando: 'Guardando…',
  guardado: 'Guardado en tu cuenta',
  error: 'No se pudo guardar en la nube. Revisa tu conexión.',
  'sin-config': 'Guardado solo en este navegador'
}
const texto = computed(() => textos[estadoNube.value])
</script>

<template>
  <div class="cuenta" aria-live="polite">
    <template v-if="usuario">
      <img v-if="usuario.foto" :src="usuario.foto" :alt="'Foto de ' + usuario.nombre" width="32" height="32" referrerpolicy="no-referrer" />
      <div class="txt">
        <strong>{{ usuario.nombre }}</strong>
        <span :class="{ err: estadoNube === 'error' }">{{ texto }}</span>
      </div>
      <button type="button" class="btn ghost sm" @click="salir">Cerrar sesión</button>
    </template>
    <template v-else>
      <div class="txt">
        <span>{{ texto }}</span>
        <span v-if="nubeDisponible" class="sub">Entra con Google para no perder tus listas.</span>
      </div>
      <button v-if="nubeDisponible" type="button" class="btn google" @click="entrar">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
        Entrar con Google
      </button>
    </template>
  </div>
</template>

<style scoped>
.cuenta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: var(--surface);
  border: 1.5px solid var(--line);
  border-radius: var(--r);
  padding: 10px 12px;
}
img {
  border-radius: 50%;
  flex: 0 0 32px;
}
.txt {
  display: flex;
  flex-direction: column;
  flex: 1 1 160px;
  min-width: 0;
  font-size: 13px;
  line-height: 1.35;
}
.txt span {
  color: var(--muted);
}
.txt .sub {
  font-size: 12px;
}
.txt .err {
  color: var(--warn);
}
.sm {
  padding: 6px 12px;
  font-size: 13px;
}
.google {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  color: var(--ink);
  border: 1.5px solid var(--line);
}
.google svg {
  width: 18px;
  height: 18px;
}
</style>
