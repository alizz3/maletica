<script setup>
import { computed } from 'vue'
import { usuario, estadoNube, nubeDisponible, entrar, salir, errorLogin } from '../firebase.js'
import { ui } from '../store.js'
import ThemeToggle from './ThemeToggle.vue'

const textos = {
  local: 'Solo en este navegador',
  cargando: 'Trayendo tus datos…',
  guardando: 'Guardando…',
  guardado: 'Guardado en tu cuenta',
  error: 'No se pudo guardar',
  'sin-config': 'Solo en este navegador'
}
const texto = computed(() => textos[estadoNube.value])
const primerNombre = computed(() => (usuario.value?.nombre || '').split(' ')[0])

async function cerrar() {
  await salir()
  ui.sinCuenta = false
}
</script>

<template>
  <div class="topbar">
    <div class="who" aria-live="polite">
      <img v-if="usuario?.foto" :src="usuario.foto" :alt="'Foto de ' + usuario.nombre" width="34" height="34" referrerpolicy="no-referrer" />
      <div class="txt">
        <strong v-if="usuario">Hola, {{ primerNombre }}</strong>
        <strong v-else>Maletica</strong>
        <span :class="{ err: estadoNube === 'error' }">{{ texto }}</span>
      </div>
    </div>
    <button v-if="usuario" type="button" class="btn ghost sm" @click="cerrar">Salir</button>
    <button v-else-if="nubeDisponible" type="button" class="btn ghost sm" @click="entrar">Entrar</button>
    <ThemeToggle />
  </div>
  <p v-if="errorLogin && usuario" class="err-box" role="alert">{{ errorLogin }}</p>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.who {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
img {
  border-radius: 50%;
  flex: 0 0 34px;
}
.txt {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}
.txt strong {
  font-size: 14px;
}
.txt span {
  font-size: 12px;
  color: var(--muted);
}
.txt .err {
  color: var(--warn);
}
.sm {
  padding: 6px 12px;
  font-size: 13px;
}
.err-box {
  margin: 0;
  font-size: 13px;
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: 10px;
  padding: 10px 12px;
}
</style>
