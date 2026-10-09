<script setup>
import { ui } from '../store.js'
</script>

<template>
  <div class="agrupar" role="group" aria-label="Ver la maleta por">
    <span>Ver por</span>
    <div class="seg mini">
      <button type="button" :class="{ on: ui.agrupar === 'tipo' }" @click="ui.agrupar = 'tipo'">Tipo</button>
      <button type="button" :class="{ on: ui.agrupar === 'bolso' }" @click="ui.agrupar = 'bolso'">Bolso</button>
    </div>
  </div>
</template>

<style scoped>
.agrupar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--muted);
}
.mini button {
  padding: 4px 12px;
  font-size: 12px;
}
</style>
