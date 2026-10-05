<script setup>
import { reactive } from 'vue'
import { CATS, prendasDe, usos, addPrenda, delPrenda } from '../store.js'

const nueva = reactive({ nombre: '', cat: 'Arriba' })
function agregar() {
  const n = nueva.nombre.trim()
  if (!n) return
  addPrenda(n, nueva.cat)
  nueva.nombre = ''
}
</script>

<template>
  <section aria-labelledby="t-armario">
    <div class="panel">
      <h2 id="t-armario">Tu armario</h2>
      <p class="hint" style="margin: 0">Las prendas que agregues aquí aparecen para armar las pintas de cada día.</p>
      <form class="add" @submit.prevent="agregar">
        <input id="nueva-prenda" v-model="nueva.nombre" placeholder="Ej: Sandalias blancas" aria-label="Nombre de la prenda" autocomplete="off" />
        <select id="nueva-cat" v-model="nueva.cat" aria-label="Categoría">
          <option v-for="c in CATS" :key="c">{{ c }}</option>
        </select>
        <button class="btn" type="submit">Agregar</button>
      </form>
      <div class="group" v-for="c in CATS" :key="c">
        <h3>{{ c }}</h3>
        <ul class="list">
          <li v-for="p in prendasDe(c)" :key="p.id">
            <span style="flex: 1; min-width: 0">{{ p.nombre }}</span>
            <span class="meta">{{ usos[p.id] ? usos[p.id] + ' días' : 'sin usar' }}</span>
            <button type="button" class="del" @click="delPrenda(p.id)" :aria-label="'Borrar ' + p.nombre + ' del armario'">×</button>
          </li>
          <li v-if="!prendasDe(c).length" class="empty">Vacío</li>
        </ul>
      </div>
    </div>
  </section>
</template>
