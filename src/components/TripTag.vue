<script setup>
import { s, rango } from '../store.js'
import ThemeToggle from './ThemeToggle.vue'
</script>

<template>
  <header class="tag">
    <div class="tag-top">
      <div>
        <span class="brand">Maletica</span>
        <h1>Villavicencio</h1>
      </div>
      <ThemeToggle />
    </div>
    <div class="route">
      <span><b>BOG → VVC</b></span>
      <span>{{ rango }}</span>
      <span>De visita · clima caliente, ropa fresca</span>
    </div>
    <div class="row" style="margin-top: 4px">
      <span class="hint">Regreso:</span>
      <div class="seg" role="group" aria-label="Día de regreso">
        <button type="button" :class="{ on: s.regreso === 'jue' }" @click="s.regreso = 'jue'">Jue 8</button>
        <button type="button" :class="{ on: s.regreso === 'vie' }" @click="s.regreso = 'vie'">Vie 9</button>
      </div>
    </div>
  </header>
</template>
