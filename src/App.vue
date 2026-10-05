<script setup>
import { ref } from 'vue'
import { hechos, total } from './store.js'
import TripTag from './components/TripTag.vue'
import AccountBar from './components/AccountBar.vue'
import PintasView from './components/PintasView.vue'
import MaletaView from './components/MaletaView.vue'
import ArmarioView from './components/ArmarioView.vue'
import CookieBanner from './components/CookieBanner.vue'

const tab = ref('pintas')
</script>

<template>
  <a class="skip" href="#contenido">Saltar al contenido</a>
  <div class="wrap">
    <TripTag />
    <AccountBar />

    <nav class="tabs" aria-label="Secciones">
      <button type="button" :class="{ on: tab === 'pintas' }" :aria-current="tab === 'pintas' ? 'page' : null" @click="tab = 'pintas'">Pintas</button>
      <button type="button" :class="{ on: tab === 'maleta' }" :aria-current="tab === 'maleta' ? 'page' : null" @click="tab = 'maleta'">
        Maleta <small>{{ hechos }}/{{ total }}</small>
      </button>
      <button type="button" :class="{ on: tab === 'armario' }" :aria-current="tab === 'armario' ? 'page' : null" @click="tab = 'armario'">Armario</button>
    </nav>

    <main id="contenido">
      <PintasView v-if="tab === 'pintas'" />
      <MaletaView v-else-if="tab === 'maleta'" />
      <ArmarioView v-else />
    </main>

    <footer class="foot">
      <a href="/privacidad.html">Privacidad</a> · <a href="/terminos.html">Términos</a> · Hecho por Aliz Mejía
    </footer>
  </div>
  <CookieBanner />
</template>
