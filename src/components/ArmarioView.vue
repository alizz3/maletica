<script setup>
import { reactive } from 'vue'
import {
  viaje, CATS, CATS_ROPA, CATS_COSAS, CATS_SUELTAS, prendasDe, addPrenda, delPrenda, renombrarPrenda,
  enMaleta, esPuesta, toggleMaleta, diasDePieza
} from '../store.js'

const nueva = reactive({ nombre: '', cat: 'Arriba' })
function agregar() {
  const n = nueva.nombre.trim()
  if (!n) return
  addPrenda(n, nueva.cat)
  nueva.nombre = ''
}

const secciones = [
  { titulo: 'Ropa', cats: CATS_ROPA },
  { titulo: 'Cosas', cats: CATS_COSAS }
]
</script>

<template>
  <section aria-labelledby="t-armario">
    <div class="panel">
      <h2 id="t-armario">Tu armario</h2>
      <p class="hint" style="margin: 0">
        Todo lo que tienes, ropa y cosas. Toca <b>+ Llevar</b> para meter algo en la maleta de {{ viaje?.destino || 'este viaje' }}.
        Toca el nombre para corregirlo.
      </p>
      <form class="add" @submit.prevent="agregar">
        <input id="nueva-prenda" v-model="nueva.nombre" placeholder="Ej: Sandalias blancas, gafas de sol…" aria-label="Nombre" autocomplete="off" />
        <select id="nueva-cat" v-model="nueva.cat" aria-label="Categoría">
          <optgroup v-for="sec in secciones" :key="sec.titulo" :label="sec.titulo">
            <option v-for="c in sec.cats" :key="c">{{ c }}</option>
          </optgroup>
        </select>
        <button class="btn" type="submit">Agregar</button>
      </form>
    </div>

    <div class="panel" v-for="sec in secciones" :key="sec.titulo">
      <h2>{{ sec.titulo }}</h2>
      <div class="group" v-for="c in sec.cats" :key="c">
        <h3>{{ c }}</h3>
        <p v-if="CATS_SUELTAS.includes(c)" class="hint" style="margin: 0; font-size: 12px">
          Describe cada pieza para reconocerla (color, tipo, detalle).
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
            <span v-if="viaje && diasDePieza(p.id).length" class="meta">{{ diasDePieza(p.id).join(', ') }}</span>
            <template v-if="viaje">
              <span v-if="esPuesta(p.id)" class="llevar puesta">Puesta</span>
              <button
                v-else
                type="button"
                class="llevar"
                :class="{ on: enMaleta(p.id) }"
                :aria-pressed="enMaleta(p.id)"
                @click="toggleMaleta(p.id)"
              >{{ enMaleta(p.id) ? '✓ En la maleta' : '+ Llevar' }}</button>
            </template>
            <button type="button" class="del" @click="delPrenda(p.id)" :aria-label="'Borrar ' + p.nombre + ' del armario'">×</button>
          </li>
          <li v-if="!prendasDe(c).length" class="empty">Vacío</li>
        </ul>
      </div>
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
.pr .meta {
  margin-left: auto;
}
.llevar {
  border: 1.5px solid var(--lav);
  background: transparent;
  color: var(--lav);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.pr .cat + .llevar,
.pr .cat + .meta + .llevar {
  margin-left: auto;
}
.pr .meta + .llevar {
  margin-left: 0;
}
.llevar.on {
  background: var(--lav);
  color: var(--on-accent);
}
.llevar.puesta {
  border-color: transparent;
  background: var(--pink-soft);
  color: var(--pink);
  font-weight: 500;
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
  max-width: 110px;
}
</style>
