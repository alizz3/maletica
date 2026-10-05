<script setup>
import { ref, reactive, computed } from 'vue'
import {
  viaje, dias, CATS, GRUPOS, ropaMaleta, puesto, seQueda, usos, basicosDe,
  total, hechos, pct, chk, setChk, addBasico, delBasico, sacarDeMaleta, textoLista,
  cantidad, avisos, descartarHuerfana, progresoGrupo,
  CATS_SUELTAS, prendasDe, llevoDe, llevaPieza, toggleLlevo, recomendado, addPrenda,
  piezasPuestas, diasDePieza, esDeRepuesto
} from '../store.js'
import RegresoView from './RegresoView.vue'

const pesadas = ['Abajo', 'Zapatos', 'Abrigo'] // ocupan espacio: avisar si solo se usan un día
const aviso = ref('')
const soloPendientes = ref(false)
const nuevo = reactive({ nombre: '', grupo: 'Arriba' })
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
  if (CATS.includes(nuevo.grupo)) {
    // Ropa: queda en el armario y en la maleta de este viaje
    toggleLlevo(addPrenda(n, nuevo.grupo))
  } else {
    addBasico(n, nuevo.grupo)
  }
  avisar(n + ' agregado a ' + nuevo.grupo)
  nuevo.nombre = ''
}

function quitarRopa(p) {
  const v = viaje.value
  const copia = JSON.parse(JSON.stringify(v.pintas))
  const copiaLlevo = [...(v.llevo || [])]
  sacarDeMaleta(p.id)
  avisar(p.nombre + ' quedó fuera de la maleta', () => {
    v.pintas = copia
    v.llevo = copiaLlevo
  })
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

// Ropa agrupada por categoría (Arriba, Abajo, Zapatos…)
const ropaPorCat = computed(() =>
  CATS.map((c) => ({ cat: c, items: ropaMaleta.value.filter((p) => p.cat === c) })).filter((g) => g.items.length)
)
const visibleRopa = (items) => (soloPendientes.value ? items.filter((p) => !chk('p:' + p.id)) : items)
const visibleBas = (items) => (soloPendientes.value ? items.filter((b) => !chk('b:' + b.id)) : items)
const progRopa = computed(() => progresoGrupo(ropaMaleta.value, 'p:'))
const faltan = computed(() => total.value - hechos.value)
// Ropa interior y medias: piezas concretas
const nuevaPieza = reactive({ cat: null, nombre: '' })
function agregarPieza(cat) {
  const n = nuevaPieza.nombre.trim()
  if (n) toggleLlevo(addPrenda(n, cat))
  nuevaPieza.cat = null
  nuevaPieza.nombre = ''
}
const esPuesta = (id) => puesto.value.some((p) => p.id === id)
const esFija = (id) => esPuesta(id) || (diasDePieza(id).length > 0 && !esDeRepuesto(id))
const piezasVisibles = (cat) => (soloPendientes.value ? llevoDe(cat).filter((p) => !chk('p:' + p.id)) : llevoDe(cat))

const iconoAviso = { falta: '!', sobra: '↩', exceso: '⇣', bien: '✓' }
</script>

<template>
  <section aria-labelledby="t-maleta">
    <h2 id="t-maleta" class="sr-only">Maleta</h2>
    <div class="row" style="justify-content: space-between">
      <div class="seg" role="group" aria-label="Fase">
        <button type="button" :class="{ on: viaje.fase === 'ida' }" @click="viaje.fase = 'ida'">Empacar (ida)</button>
        <button type="button" :class="{ on: viaje.fase === 'vuelta' }" @click="viaje.fase = 'vuelta'">Checklist de regreso</button>
      </div>
      <button type="button" class="btn ghost" @click="copiar">Copiar lista</button>
    </div>

    <div class="progress">
      <div class="bar" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: pct + '%' }"></i></div>
      <div class="row" style="justify-content: space-between">
        <span class="count">
          <template v-if="faltan === 0 && total">{{ viaje.fase === 'ida' ? '¡Maleta lista! Todo empacado.' : '¡Todo listo para volver! No se queda nada.' }}</template>
          <template v-else>{{ hechos }} de {{ total }} {{ viaje.fase === 'ida' ? 'en la maleta' : 'listas para volver' }} · faltan {{ faltan }}</template>
        </span>
        <label class="toggle" for="solo-pend">
          <input id="solo-pend" type="checkbox" v-model="soloPendientes" />
          Ver solo pendientes
        </label>
      </div>
    </div>

    <RegresoView v-if="viaje.fase === 'vuelta'" :solo-pendientes="soloPendientes" />

    <template v-else>
    <ul v-if="avisos.length && viaje.fase === 'ida'" class="avisos" aria-label="Para revisar">
      <li v-for="(a, i) in avisos" :key="i" :class="a.tipo">
        <span class="ico" aria-hidden="true">{{ iconoAviso[a.tipo] }}</span>
        <span class="t">{{ a.texto }}</span>
        <button v-if="a.tipo === 'sobra'" type="button" class="link" @click="descartarHuerfana(a.id)">Ya la saqué</button>
      </li>
    </ul>

    <form class="add-maleta" @submit.prevent="agregar">
      <label for="nuevo-item">Agregar algo a la maleta</label>
      <div class="add">
        <input id="nuevo-item" v-model="nuevo.nombre" placeholder="Ej: Sandalias, gafas de sol…" autocomplete="off" />
        <select id="nuevo-grupo" v-model="nuevo.grupo" aria-label="Grupo">
          <optgroup label="Ropa (también queda en tu armario)">
            <option v-for="cat in CATS" :key="cat">{{ cat }}</option>
          </optgroup>
          <optgroup label="Otras cosas">
            <option v-for="g in GRUPOS.filter((x) => x !== 'Ropa extra')" :key="g">{{ g }}</option>
          </optgroup>
        </select>
        <button class="btn" type="submit">Agregar</button>
      </div>
    </form>

    <p v-if="aviso" class="toast" role="status">
      {{ aviso }}
      <button v-if="deshacer" type="button" class="link" @click="undo">Deshacer</button>
    </p>

    <div class="panel">
      <div class="ph">
        <h3>Ropa</h3>
        <span class="gp" v-if="progRopa.total">{{ progRopa.listos }}/{{ progRopa.total }}</span>
      </div>
      <template v-for="g in ropaPorCat" :key="g.cat">
        <h4 v-if="visibleRopa(g.items).length">{{ g.cat }}</h4>
        <ul class="list">
          <li v-for="p in visibleRopa(g.items)" :key="p.id">
            <label>
              <input type="checkbox" :id="'chk-p-' + p.id" :checked="chk('p:' + p.id)" @change="setChk('p:' + p.id, $event.target.checked)" />
              <span :class="{ done: chk('p:' + p.id) }">{{ p.nombre }}</span>
            </label>
            <span v-if="!usos[p.id]" class="meta" title="La marcaste para llevar, pero no está en ninguna pinta">extra</span>
            <span v-else-if="usos[p.id] > 1" class="meta good">{{ usos[p.id] }} días</span>
            <span v-else-if="pesadas.includes(p.cat)" class="meta warn" title="Es de las que ocupan espacio. ¿La cambias por algo que ya llevas?">solo 1 vez</span>
            <button type="button" class="del" @click="quitarRopa(p)" :aria-label="'Quitar ' + p.nombre + ' de la maleta'">×</button>
          </li>
        </ul>
      </template>
      <p v-if="!ropaMaleta.length" class="empty" style="margin: 0">Arma las pintas o toca "+ Llevar" en el Armario y aquí aparece la ropa.</p>
      <p v-else-if="soloPendientes && progRopa.listos === progRopa.total" class="empty" style="margin: 0">Toda la ropa está empacada.</p>
    </div>

    <div class="panel">
      <div class="ph">
        <h3>Ropa interior y medias</h3>
      </div>
      <div v-for="cat in CATS_SUELTAS" :key="cat" class="suelta">
        <div class="ph">
          <h4>{{ cat }}</h4>
          <span class="gp" :class="{ full: llevoDe(cat).length + piezasPuestas(cat).length >= recomendado() }">
            {{ llevoDe(cat).length + piezasPuestas(cat).length }} de {{ recomendado() }} {{ cat === 'Medias' ? 'pares' : 'piezas' }}
          </span>
        </div>

        <p class="hint" style="margin: 0; font-size: 12px">
          {{ viaje.fase === 'ida' ? 'Las de tus pintas salen solas. Toca otras para llevarlas de repuesto:' : 'Márcalas mientras empacas para volver. La que quede sin marcar, se quedó.' }}
        </p>
        <p v-if="piezasPuestas(cat).length" class="puestas">
          Puesta el {{ dias[0].largo.toLowerCase() }}: {{ piezasPuestas(cat).map((p) => p.nombre).join(', ') }}
        </p>
        <div class="chips" v-if="viaje.fase === 'ida'">
          <button
            v-for="p in prendasDe(cat)"
            :key="p.id"
            type="button"
            class="chip"
            :class="{ on: llevaPieza(p.id) || esPuesta(p.id), fija: esFija(p.id) }"
            :aria-pressed="llevaPieza(p.id) || esPuesta(p.id)"
            :title="esPuesta(p.id) ? 'La llevas puesta' : diasDePieza(p.id).length ? 'Está en la pinta de ' + diasDePieza(p.id).join(', ') : ''"
            @click="esFija(p.id) ? null : toggleLlevo(p.id)"
          >{{ p.nombre }}</button>
          <form v-if="nuevaPieza.cat === cat" class="chip-form" @submit.prevent="agregarPieza(cat)">
            <input
              :id="'pieza-' + cat"
              v-model="nuevaPieza.nombre"
              :placeholder="cat === 'Medias' ? 'Ej: Medias tobilleras blancas' : 'Ej: Tanga negra, encaje a los lados solo al frente'"
              :aria-label="'Describe la pieza de ' + cat.toLowerCase()"
              autocomplete="off"
            />
            <button class="btn sm" type="submit">Agregar</button>
          </form>
          <button v-else type="button" class="chip add-chip" @click="nuevaPieza.cat = cat">+ Describir otra</button>
        </div>

        <ul class="list" v-if="llevoDe(cat).length">
          <li v-for="p in piezasVisibles(cat)" :key="p.id">
            <label>
              <input type="checkbox" :id="'chk-s-' + p.id" :checked="chk('p:' + p.id)" @change="setChk('p:' + p.id, $event.target.checked)" />
              <span :class="{ done: chk('p:' + p.id) }">{{ p.nombre }}</span>
            </label>
            <span v-if="diasDePieza(p.id).length" class="meta">{{ diasDePieza(p.id).join(', ') }}</span>
            <span v-else class="meta">repuesto</span>
            <button v-if="viaje.fase === 'ida' && esDeRepuesto(p.id)" type="button" class="del" @click="toggleLlevo(p.id)" :aria-label="'No llevar ' + p.nombre">×</button>
          </li>
        </ul>
      </div>
    </div>

    <template v-for="g in GRUPOS" :key="g">
      <div class="panel" v-if="basicosDe(g).length && (!soloPendientes || visibleBas(basicosDe(g)).length)">
        <div class="ph">
          <h3>{{ g }}</h3>
          <span class="gp" :class="{ full: progresoGrupo(basicosDe(g), 'b:').listos === basicosDe(g).length }">
            {{ progresoGrupo(basicosDe(g), 'b:').listos }}/{{ basicosDe(g).length }}
          </span>
        </div>
        <ul class="list">
          <li v-for="b in visibleBas(basicosDe(g))" :key="b.id">
            <label>
              <input type="checkbox" :id="'chk-b-' + b.id" :checked="chk('b:' + b.id)" @change="setChk('b:' + b.id, $event.target.checked)" />
              <span :class="{ done: chk('b:' + b.id) }">{{ b.nombre }}</span>
            </label>
            <span v-if="cantidad(b)" class="meta qty" :title="b.regla === 'dias+1' ? 'Días del viaje + 1 de repuesto' : 'Una cada 4 noches'">× {{ cantidad(b) }}</span>
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
    </template>
  </section>
</template>

<style scoped>
.suelta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}
.puestas {
  margin: 0;
  font-size: 12px;
  color: var(--pink);
}
.chip.fija {
  cursor: default;
}
.suelta + .suelta {
  border-top: 1px solid var(--line);
  padding-top: 12px;
}
.chip-form {
  display: flex;
  gap: 6px;
  flex: 1 1 100%;
}
.chip-form input {
  flex: 1;
  min-width: 0;
  border: 1.5px solid var(--lav);
  background: var(--surface);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
}
.add-chip {
  border-style: dashed;
  color: var(--lav);
  font-weight: 600;
}
.sm {
  padding: 6px 12px;
  font-size: 13px;
}
.ph {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.gp {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.gp.full {
  color: var(--ok);
}
h4 {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--lav);
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
}
.toggle input {
  accent-color: var(--lav);
}
.qty {
  color: var(--lav);
  font-weight: 600;
  font-size: 12px;
}
.avisos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.avisos li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  background: var(--lav-soft);
}
.avisos .t {
  flex: 1;
  min-width: 0;
}
.avisos .ico {
  flex: 0 0 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 12px;
  background: var(--surface);
  color: var(--lav);
}
.avisos .falta,
.avisos .sobra,
.avisos .exceso {
  background: var(--warn-soft);
}
.avisos .falta .ico,
.avisos .sobra .ico,
.avisos .exceso .ico {
  color: var(--warn);
}
.avisos .bien .ico {
  color: var(--ok);
}
</style>
