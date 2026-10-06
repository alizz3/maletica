<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  viaje, CATS, SECCIONES, prendasDe, addPrenda, delPrenda, renombrarPrenda,
  enMaleta, esPuesta, toggleMaleta, diasDePieza, plano
} from '../store.js'

// ----- Buscar y agregar en el mismo campo -----
const q = ref('')
const cat = ref('Arriba')
const buscando = computed(() => plano(q.value).length > 0)
const coincide = (p) => !buscando.value || plano(p.nombre).includes(plano(q.value))
const itemsDe = (c) => prendasDe(c).filter(coincide)
const totalCoincidencias = computed(() => CATS.reduce((n, c) => n + itemsDe(c).length, 0))
const existeExacta = computed(() => CATS.some((c) => prendasDe(c).some((p) => plano(p.nombre) === plano(q.value))))
const ultima = ref('')

function agregar() {
  const n = q.value.trim()
  if (!n) return
  addPrenda(n, cat.value)
  ultima.value = n + ' quedó en ' + cat.value
  q.value = ''
  cerradas.delete(cat.value)
  cerradas.delete('sec:' + seccionDe(cat.value))
}
const seccionDe = (c) => SECCIONES.find((s) => s.cats.includes(c))?.titulo

// ----- Secciones plegables (se recuerdan en este navegador) -----
const KEY = 'maletica-armario-cerradas'
let guardadas = []
try {
  guardadas = JSON.parse(localStorage.getItem(KEY) || '[]')
} catch (e) {}
const cerradas = reactive(new Set(guardadas))
watch(
  () => [...cerradas],
  (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch (e) {}
  }
)
const abierta = (key) => buscando.value || !cerradas.has(key)
const alternar = (key) => (cerradas.has(key) ? cerradas.delete(key) : cerradas.add(key))
function todo(abrir) {
  const keys = [...SECCIONES.map((s) => 'sec:' + s.titulo), ...CATS]
  keys.forEach((k) => (abrir ? cerradas.delete(k) : cerradas.add(k)))
}
const cuentaSeccion = (sec) => sec.cats.reduce((n, c) => n + itemsDe(c).length, 0)
</script>

<template>
  <section aria-labelledby="t-armario">
    <div class="panel buscador">
      <h2 id="t-armario">Tu armario</h2>
      <form class="add" role="search" @submit.prevent="agregar">
        <input
          id="buscar-armario"
          v-model="q"
          type="search"
          placeholder="Buscar o agregar: sandalias, gafas…"
          aria-label="Buscar en el armario o agregar algo nuevo"
          autocomplete="off"
        />
        <select id="nueva-cat" v-model="cat" aria-label="Categoría para lo nuevo">
          <optgroup v-for="sec in SECCIONES" :key="sec.titulo" :label="sec.titulo">
            <option v-for="c in sec.cats" :key="c">{{ c }}</option>
          </optgroup>
        </select>
        <button class="btn" type="submit" :disabled="!q.trim()">Agregar</button>
      </form>
      <p v-if="buscando && !totalCoincidencias" class="nada">
        «{{ q.trim() }}» no está en tu armario. Elige la categoría y toca <b>Agregar</b>.
      </p>
      <p v-else-if="buscando" class="hint" style="margin: 0">
        {{ totalCoincidencias }} {{ totalCoincidencias === 1 ? 'resultado' : 'resultados' }}<template v-if="!existeExacta"> · ¿No es ninguna? Toca <b>Agregar</b>.</template>
      </p>
      <p v-else-if="ultima" class="toast" role="status" style="margin: 0">{{ ultima }}</p>
      <p v-else class="hint" style="margin: 0">
        Toca <b>+ Llevar</b> para meter algo en la maleta de {{ viaje?.destino || 'este viaje' }}. Toca un nombre para corregirlo.
      </p>
      <div class="row global" v-if="!buscando">
        <button type="button" class="link" @click="todo(false)">Contraer todo</button>
        <span aria-hidden="true">·</span>
        <button type="button" class="link" @click="todo(true)">Desplegar todo</button>
      </div>
    </div>

    <template v-for="sec in SECCIONES" :key="sec.titulo">
      <div class="panel seccion" v-if="!buscando || cuentaSeccion(sec)">
        <button
          type="button"
          class="sec-head"
          :aria-expanded="abierta('sec:' + sec.titulo)"
          @click="alternar('sec:' + sec.titulo)"
        >
          <h2>{{ sec.titulo }}</h2>
          <span class="n">{{ cuentaSeccion(sec) }}</span>
          <span class="chev" aria-hidden="true">{{ abierta('sec:' + sec.titulo) ? '−' : '+' }}</span>
        </button>

        <template v-if="abierta('sec:' + sec.titulo)">
          <template v-for="c in sec.cats" :key="c">
            <div class="cat-blk" v-if="!buscando || itemsDe(c).length">
              <button type="button" class="cat-head" :aria-expanded="abierta(c)" @click="alternar(c)">
                <span class="tri" :class="{ open: abierta(c) }" aria-hidden="true">▸</span>
                <h3>{{ c }}</h3>
                <span class="n">{{ itemsDe(c).length }}</span>
              </button>
              <ul class="list" v-if="abierta(c)">
                <li v-for="p in itemsDe(c)" :key="p.id" class="pr">
                  <input
                    class="inline"
                    :id="'ren-' + p.id"
                    :value="p.nombre"
                    :aria-label="'Nombre de ' + p.nombre"
                    @change="renombrarPrenda(p.id, $event.target.value)"
                    @keydown.enter="$event.target.blur()"
                  />
                  <select class="cat" :id="'cat-' + p.id" v-model="p.cat" :aria-label="'Categoría de ' + p.nombre">
                    <optgroup v-for="s2 in SECCIONES" :key="s2.titulo" :label="s2.titulo">
                      <option v-for="c2 in s2.cats" :key="c2">{{ c2 }}</option>
                    </optgroup>
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
                <li v-if="!itemsDe(c).length" class="empty">Vacío</li>
              </ul>
            </div>
          </template>
        </template>
      </div>
    </template>
  </section>
</template>

<style scoped>
.buscador .add input {
  font-size: 15px;
}
.buscador .btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.nada {
  margin: 0;
  font-size: 13px;
  background: var(--pink-soft);
  border-radius: 10px;
  padding: 8px 12px;
}
.global {
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}
.global .link {
  padding: 0;
  font-size: 13px;
}

/* Secciones y categorías plegables */
.sec-head,
.cat-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  color: inherit;
}
.sec-head h2 {
  margin: 0;
  flex: 0 1 auto;
}
.sec-head .chev {
  margin-left: auto;
  flex: 0 0 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--lav-soft);
  color: var(--lav);
  display: grid;
  place-items: center;
  font-size: 17px;
  font-weight: 600;
}
.n {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  background: var(--bg);
  border-radius: 999px;
  padding: 1px 8px;
  font-variant-numeric: tabular-nums;
}
.cat-blk {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.cat-head {
  padding-bottom: 4px;
}
.cat-head h3 {
  margin: 0;
}
.tri {
  color: var(--lav);
  font-size: 13px;
  width: 12px;
  transition: transform 0.15s;
}
.tri.open {
  transform: rotate(90deg);
}
@media (prefers-reduced-motion: reduce) {
  .tri {
    transition: none;
  }
}

/* Prendas */
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
.pr .cat + .llevar {
  margin-left: auto;
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
  max-width: 120px;
}
</style>
