<script setup>
import { reactive } from 'vue'
import { s, viaje, CATS, CATS_SUELTAS, GRUPOS, prendasDe, addPrenda, delPrenda, renombrarPrenda, estadoEnViaje, toggleLlevo, diasDePieza } from '../store.js'

const nueva = reactive({ nombre: '', cat: 'Arriba' })
function agregar() {
  const n = nueva.nombre.trim()
  if (!n) return
  const id = addPrenda(n, nueva.cat)
  if (viaje.value) toggleLlevo(id) // lo nuevo entra directo a la maleta de este viaje
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
const etiqueta = (id) => {
  const e = estadoEnViaje(id)
  if (e === 'puesta') return 'Puesta'
  if (e === 'pinta') return 'En pinta · ' + diasDePieza(id).join(', ')
  if (e === 'extra') return '✓ En la maleta'
  return '+ Llevar'
}
const fija = (id) => ['puesta', 'pinta'].includes(estadoEnViaje(id))

const baseDe = (g) => s.plantilla.filter((b) => b.grupo === g)
const borrarBase = (id) => (s.plantilla = s.plantilla.filter((b) => b.id !== id))
</script>

<template>
  <section aria-labelledby="t-armario">
    <div class="panel">
      <h2 id="t-armario">Tu armario</h2>
      <p class="hint" style="margin: 0">
        Toca <b>+ Llevar</b> para meter una prenda en la maleta de {{ viaje?.destino || 'este viaje' }}. Lo que agregues nuevo entra a la maleta solo.
        Toca el nombre para corregirlo.
      </p>
      <form class="add" @submit.prevent="agregar">
        <input id="nueva-prenda" v-model="nueva.nombre" placeholder="Ej: Sandalias blancas, tanga negra de encaje…" aria-label="Nombre de la prenda" autocomplete="off" />
        <select id="nueva-cat" v-model="nueva.cat" aria-label="Categoría">
          <option v-for="c in CATS" :key="c">{{ c }}</option>
        </select>
        <button class="btn" type="submit">Agregar</button>
      </form>
      <div class="group" v-for="c in CATS" :key="c">
        <h3>{{ c }}</h3>
        <p v-if="CATS_SUELTAS.includes(c)" class="hint" style="margin: 0; font-size: 12px">
          Describe cada pieza para reconocerla (color, tipo, detalle). En la Maleta de cada viaje eliges cuáles llevas.
        </p>
        <ul class="list">
          <li v-for="p in prendasDe(c)" :key="p.id" class="pr">
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
            <button
              v-if="viaje"
              type="button"
              class="llevar"
              :class="estadoEnViaje(p.id) || 'no'"
              :disabled="fija(p.id)"
              :aria-pressed="!!estadoEnViaje(p.id)"
              :title="fija(p.id) ? 'Para sacarla, quítala de la pinta' : ''"
              @click="toggleLlevo(p.id)"
            >{{ etiqueta(p.id) }}</button>
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
.list li.pr {
  flex-wrap: wrap;
  row-gap: 4px;
}
.pr .inline {
  flex: 1 1 100%;
}
.llevar {
  margin-left: auto;
  border: 1.5px solid var(--lav);
  background: transparent;
  color: var(--lav);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.llevar.extra {
  background: var(--lav);
  color: var(--on-accent);
}
.llevar.pinta,
.llevar.puesta {
  border-color: transparent;
  background: var(--lav-soft);
  cursor: default;
  font-weight: 500;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
}
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
