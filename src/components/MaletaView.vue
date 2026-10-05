<script setup>
import { ref, reactive } from 'vue'
import {
  viaje, dias, GRUPOS, ropaMaleta, puesto, seQueda, usos, basicosDe,
  total, hechos, pct, chk, setChk, addBasico, delBasico, sacarDeMaleta, textoLista
} from '../store.js'

const pesadas = ['Abajo', 'Zapatos', 'Abrigo'] // ocupan espacio: avisar si solo se usan un día
const aviso = ref('')
const nuevo = reactive({ nombre: '', grupo: 'Ropa extra' })
let deshacer = null
let timer

function avisar(t, undo = null) {
  aviso.value = t
  deshacer = undo
  clearTimeout(timer)
  timer = setTimeout(() => {
    aviso.value = ''
    deshacer = null
  }, 5000)
}

function agregar() {
  const n = nuevo.nombre.trim()
  if (!n) return
  addBasico(n, nuevo.grupo)
  avisar(n + ' agregado a ' + nuevo.grupo)
  nuevo.nombre = ''
}

function quitarRopa(p) {
  const v = viaje.value
  const copia = JSON.parse(JSON.stringify(v.pintas))
  sacarDeMaleta(p.id)
  avisar(p.nombre + ' quedó fuera de la maleta y de las pintas', () => (v.pintas = copia))
}

function quitarBasico(b) {
  const v = viaje.value
  const copia = JSON.parse(JSON.stringify(v.basicos))
  delBasico(b.id)
  avisar(b.nombre + ' quitado', () => (v.basicos = copia))
}

function undo() {
  if (deshacer) deshacer()
  aviso.value = ''
  deshacer = null
}

async function copiar() {
  try {
    await navigator.clipboard.writeText(textoLista())
    avisar('Lista copiada')
  } catch (e) {
    avisar('No se pudo copiar desde este navegador')
  }
}
</script>

<template>
  <section aria-labelledby="t-maleta">
    <h2 id="t-maleta" class="sr-only">Maleta</h2>
    <div class="row" style="justify-content: space-between">
      <div class="seg" role="group" aria-label="Fase">
        <button type="button" :class="{ on: viaje.fase === 'ida' }" @click="viaje.fase = 'ida'">Empacar (ida)</button>
        <button type="button" :class="{ on: viaje.fase === 'vuelta' }" @click="viaje.fase = 'vuelta'">Regreso</button>
      </div>
      <button type="button" class="btn ghost" @click="copiar">Copiar lista</button>
    </div>

    <div class="progress">
      <div class="bar" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: pct + '%' }"></i></div>
      <span class="count">{{ hechos }} de {{ total }} {{ viaje.fase === 'ida' ? 'en la maleta' : 'recogidas para volver' }}</span>
    </div>

    <form class="add-maleta" @submit.prevent="agregar">
      <label for="nuevo-item">Agregar algo a la maleta</label>
      <div class="add">
        <input id="nuevo-item" v-model="nuevo.nombre" placeholder="Ej: Sandalias, gafas de sol…" autocomplete="off" />
        <select id="nuevo-grupo" v-model="nuevo.grupo" aria-label="Grupo">
          <option v-for="g in GRUPOS" :key="g">{{ g }}</option>
        </select>
        <button class="btn" type="submit">Agregar</button>
      </div>
    </form>

    <p v-if="aviso" class="toast" role="status">
      {{ aviso }}
      <button v-if="deshacer" type="button" class="link" @click="undo">Deshacer</button>
    </p>

    <div class="panel">
      <h3>Ropa de las pintas</h3>
      <ul class="list">
        <li v-for="p in ropaMaleta" :key="p.id">
          <label>
            <input type="checkbox" :id="'chk-p-' + p.id" :checked="chk('p:' + p.id)" @change="setChk('p:' + p.id, $event.target.checked)" />
            <span :class="{ done: chk('p:' + p.id) }">{{ p.nombre }}</span>
          </label>
          <span v-if="usos[p.id] > 1" class="meta good">{{ usos[p.id] }} días</span>
          <span v-else-if="pesadas.includes(p.cat)" class="meta warn" title="Es de las que ocupan espacio. ¿La cambias por algo que ya llevas?">solo 1 vez</span>
          <button type="button" class="del" @click="quitarRopa(p)" :aria-label="'Quitar ' + p.nombre + ' de la maleta'">×</button>
        </li>
        <li v-if="!ropaMaleta.length" class="empty">Arma las pintas y aquí aparece la ropa.</li>
      </ul>
    </div>

    <template v-for="g in GRUPOS" :key="g">
      <div class="panel" v-if="basicosDe(g).length">
        <h3>{{ g }}</h3>
        <ul class="list">
          <li v-for="b in basicosDe(g)" :key="b.id">
            <label>
              <input type="checkbox" :id="'chk-b-' + b.id" :checked="chk('b:' + b.id)" @change="setChk('b:' + b.id, $event.target.checked)" />
              <span :class="{ done: chk('b:' + b.id) }">{{ b.nombre }}</span>
            </label>
            <button type="button" class="del" @click="quitarBasico(b)" :aria-label="'Quitar ' + b.nombre">×</button>
          </li>
        </ul>
      </div>
    </template>

    <div class="panel">
      <h3>Lo llevas puesto el {{ dias[0] ? dias[0].largo.toLowerCase() : 'día de ida' }}</h3>
      <p style="margin: 0; font-size: 14px">{{ puesto.map((p) => p.nombre).join(' · ') || 'Sin definir' }}</p>
    </div>

    <div class="panel" v-if="seQueda.length">
      <h3>Se queda en casa</h3>
      <p style="margin: 0; font-size: 14px; color: var(--muted)">{{ seQueda.map((p) => p.nombre).join(' · ') }}</p>
    </div>
  </section>
</template>
