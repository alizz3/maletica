<script setup>
import { computed } from 'vue'
import { ui, viaje, hechos, total } from './store.js'
import { nubeDisponible, authListo, usuario, estadoNube } from './firebase.js'
import LoginView from './components/LoginView.vue'
import TopBar from './components/TopBar.vue'
import ViajesView from './components/ViajesView.vue'
import TripTag from './components/TripTag.vue'
import OutfitsView from './components/OutfitsView.vue'
import MaletaView from './components/MaletaView.vue'
import ArmarioView from './components/ArmarioView.vue'
import CookieBanner from './components/CookieBanner.vue'

// Orden: login → Mis viajes → el viaje (outfits, maleta, armario)
const pantalla = computed(() => {
  if (nubeDisponible && !authListo.value) return 'cargando'
  if (nubeDisponible && !usuario.value && !ui.sinCuenta) return 'login'
  if (estadoNube.value === 'cargando') return 'cargando'
  if (ui.pantalla === 'viaje' && viaje.value) return 'viaje'
  return 'viajes'
})
</script>

<template>
  <a class="skip" href="#contenido">Saltar al contenido</a>
  <div class="wrap">
    <div v-if="pantalla === 'cargando'" class="splash" role="status">
      <span class="brand-big">Maletica</span>
      <span class="hint">{{ usuario ? 'Trayendo tus viajes…' : 'Cargando…' }}</span>
    </div>

    <LoginView v-else-if="pantalla === 'login'" />

    <template v-else>
      <TopBar />

      <ViajesView v-if="pantalla === 'viajes'" />

      <template v-else>
        <TripTag />
        <nav class="tabs" aria-label="Secciones del viaje">
          <button type="button" :class="{ on: ui.tab === 'pintas' }" :aria-current="ui.tab === 'pintas' ? 'page' : null" @click="ui.tab = 'pintas'">Outfits</button>
          <button type="button" :class="{ on: ui.tab === 'maleta' }" :aria-current="ui.tab === 'maleta' ? 'page' : null" @click="ui.tab = 'maleta'">
            Maleta <small>{{ hechos }}/{{ total }}</small>
          </button>
          <button type="button" :class="{ on: ui.tab === 'armario' }" :aria-current="ui.tab === 'armario' ? 'page' : null" @click="ui.tab = 'armario'">Armario</button>
        </nav>
        <main id="contenido">
          <OutfitsView v-if="ui.tab === 'pintas'" />
          <MaletaView v-else-if="ui.tab === 'maleta'" />
          <ArmarioView v-else />
        </main>
      </template>

      <footer class="foot">
        <a href="/privacidad.html">Privacidad</a> · <a href="/terminos.html">Términos</a> · Hecho por Aliz Mejía
      </footer>
    </template>
  </div>
  <CookieBanner />
</template>
