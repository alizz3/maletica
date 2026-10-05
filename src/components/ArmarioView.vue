<script setup>
import { reactive } from 'vue'
import { s, CATS, GRUPOS, prendasDe, usos, addPrenda, delPrenda, renombrarPrenda } from '../store.js'

const nueva = reactive({ nombre: '', cat: 'Arriba' })
function agregar() {
  const n = nueva.nombre.trim()
  if (!n) return
  addPrenda(n, nueva.cat)
  nueva.nombre = ''
}

// Básicos que se copian a cada viaje nuevo
const nuevoB = reactive({ nombre: '', grupo: 'Tecnología' })
function agregarBase() {
  const n = nuevoB.nombre.trim()
  if (!n) return
  s.plantilla.push({ id: 'b' + ++s.seq, nombre: n, grupo: nuevoB.grupo })
  nuevoB.nombre = ''
}
const baseDe = (g) => s.plantilla.filter((b) => b.grupo === g)
const borrarBase = (id) => (s.plantilla = s.plantilla.filter((b) => b.id !== id))
</script>

<template>
  <section aria-labelledby="t-armario">
    <div class="panel">
      <h2 id="t-armario">Tu armario</h2>
      <p class="hint" style="margin: 0">Toca el nombre de una prenda para corregirlo. Lo que agregues aquí aparece en las pintas de todos tus viajes.</p>
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
            <input
              class="inline"
              :id="'ren-' + p.id"
              :value="p.nombre"
              :aria-label="'Nombre de ' + p.nombre"
              @change="renombrarPrenda(p.id, $event.target.value)"
              @keydown.enter="$event.target.blur()"
            />
            <select class="cat" :id="'cat-' + p.id" v-model="p.cat" :aria-label="'Categoría de ' + p.nombre">
              <option v-for="c2 in CATS" :key="c2">{{ c2 }}</option>
            </select>
            <span class="meta">{{ usos[p.id] ? usos[p.id] + ' d' : '' }}</span>
            <button type="button" class="del" @click="delPrenda(p.id)" :aria-label="'Borrar ' + p.nombre + ' del armario'">×</button>
          </li>
          <li v-if="!prendasDe(c).length" class="empty">Vacío</li>
        </ul>
      </div>
    </div>

    <div class="panel">
      <h2>Básicos de cada viaje</h2>
      <p class="hint" style="margin: 0">Esta lista se copia a la maleta cada vez que creas un viaje. Los cambios aquí no tocan los viajes que ya existen.</p>
      <form class="add" @submit.prevent="agregarBase">
        <input id="nuevo-base" v-model="nuevoB.nombre" placeholder="Ej: Gafas de sol" aria-label="Nombre del básico" autocomplete="off" />
        <select id="nuevo-base-grupo" v-model="nuevoB.grupo" aria-label="Grupo">
          <option v-for="g in GRUPOS" :key="g">{{ g }}</option>
        </select>
        <button class="btn" type="submit">Agregar</button>
      </form>
      <template v-for="g in GRUPOS" :key="g">
        <div class="group" v-if="baseDe(g).length">
          <h3>{{ g }}</h3>
          <ul class="list">
            <li v-for="b in baseDe(g)" :key="b.id">
              <input class="inline" :id="'base-' + b.id" v-model.lazy="b.nombre" :aria-label="'Nombre de ' + b.nombre" @keydown.enter="$event.target.blur()" />
              <button type="button" class="del" @click="borrarBase(b.id)" :aria-label="'Quitar ' + b.nombre">×</button>
            </li>
          </ul>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.inline {
  flex: 1;
  min-width: 0;
  border: 1.5px solid transparent;
  background: transparent;
  border-radius: 8px;
  padding: 4px 6px;
  margin-left: -6px;
  font-size: 15px;
}
.inline:hover {
  border-color: var(--line);
}
.inline:focus {
  border-color: var(--lav);
  background: var(--surface);
  outline: none;
}
.cat {
  border: 0;
  background: var(--lav-soft);
  color: var(--lav);
  border-radius: 999px;
  padding: 3px 6px;
  font-size: 11px;
  font-weight: 600;
  max-width: 96px;
}
</style>
