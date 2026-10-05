<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import {
  viaje, dias, CATS, CATS_ROPA, CATS_SUELTAS, prendasDe, maleta, maletaDe, puesto,
  total, hechos, pct, chk, setChk, listosDe, enMaleta, esPuesta, toggleMaleta, sacarDeMaleta, meterEnMaleta,
  addPrenda, diasDePieza, recomendado, avisos, llevarTodasLasDePintas, textoLista
} from '../store.js'
import RegresoView from './RegresoView.vue'

const pesadas = ['Abajo', 'Zapatos', 'Abrigo']
const aviso = ref('')
const soloPendientes = ref(false)
const eligiendo = ref(maleta.value.length === 0) // si la maleta está vacía, abre el armario
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
function undo() {
  if (deshacer) deshacer()
  aviso.value = ''
  deshacer = null
}

function quitar(p) {
  sacarDeMaleta(p.id)
  avisar(p.nombre + ' salió de la maleta', () => meterEnMaleta(p.id))
}

async function copiar() {
  try {
    await navigator.clipboard.writeText(textoLista())
    avisar('Lista copiada')
  } catch (e) {
    avisar('No se pudo copiar desde este navegador')
  }
}

// Agregar algo nuevo al armario y a la maleta sin salir de aquí
const nueva = reactive({ cat: null, nombre: '' })
async function abrirNueva(cat) {
  nueva.cat = cat
  nueva.nombre = ''
  await nextTick()
  document.getElementById('nueva-m-' + cat)?.focus()
}
function guardarNueva() {
  const n = nueva.nombre.trim()
  if (n) meterEnMaleta(addPrenda(n, nueva.cat))
  nueva.cat = null
}

const porCat = computed(() => CATS.map((c) => ({ cat: c, items: maletaDe(c) })).filter((g) => g.items.length))
const ver = (items) => (soloPendientes.value ? items.filter((p) => !chk('p:' + p.id)) : items)
const faltan = computed(() => total.value - hechos.value)
const cuentaSuelta = (cat) => maletaDe(cat).length + puesto.value.filter((p) => p.cat === cat).length
const iconoAviso = { pintas: '+', falta: '!', exceso: '⇣' }
</script>

<template>
  <section aria-labelledby="t-maleta">
    <h2 id="t-maleta" class="sr-only">Maleta</h2>
    <div class="row" style="justify-content: space-between">
      <div class="seg" role="group" aria-label="Fase">
        <button type="button" :class="{ on: viaje.fase === 'ida' }" @click="viaje.fase = 'ida'">Empacar (ida)</button>
        <button type="button" :class="{ on: viaje.fase === 'vuelta' }" @click="viaje.fase = 'vuelta'">Checklist de regreso</button>
      </div>
      <button v-if="maleta.length" type="button" class="btn ghost" @click="copiar">Copiar lista</button>
    </div>

    <div class="progress" v-if="total">
      <div class="bar" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: pct + '%' }"></i></div>
      <div class="row" style="justify-content: space-between">
        <span class="count">
          <template v-if="faltan === 0">{{ viaje.fase === 'ida' ? '¡Maleta lista! Todo empacado.' : '¡Todo listo para volver! No se queda nada.' }}</template>
          <template v-else>{{ hechos }} de {{ total }} {{ viaje.fase === 'ida' ? 'empacadas' : 'listas para volver' }} · faltan {{ faltan }}</template>
        </span>
        <label class="toggle" for="solo-pend">
          <input id="solo-pend" type="checkbox" v-model="soloPendientes" />
          Ver solo pendientes
        </label>
      </div>
    </div>

    <p v-if="aviso" class="toast" role="status">
      {{ aviso }}
      <button v-if="deshacer" type="button" class="link" @click="undo">Deshacer</button>
    </p>

    <RegresoView v-if="viaje.fase === 'vuelta'" :solo-pendientes="soloPendientes" />

    <template v-else>
      <ul v-if="avisos.length" class="avisos" aria-label="Para revisar">
        <li v-for="(a, i) in avisos" :key="i" :class="a.tipo">
          <span class="ico" aria-hidden="true">{{ iconoAviso[a.tipo] }}</span>
          <span class="t">{{ a.texto }}</span>
          <button v-if="a.tipo === 'pintas'" type="button" class="link" @click="llevarTodasLasDePintas">Meterlas</button>
        </li>
      </ul>

      <!-- ¿Qué vas a llevar? Elegir del armario -->
      <div class="panel elegir">
        <button type="button" class="elegir-head" :aria-expanded="eligiendo" @click="eligiendo = !eligiendo">
          <span>
            <strong>¿Qué vas a llevar?</strong>
            <span class="hint">Toca en tu armario lo que llevas. Lo que no toques, se queda.</span>
          </span>
          <span class="chev" aria-hidden="true">{{ eligiendo ? '−' : '+' }}</span>
        </button>

        <template v-if="eligiendo">
          <div class="group" v-for="c in CATS" :key="c">
            <div class="ph">
              <h3>{{ c }}</h3>
              <span v-if="CATS_SUELTAS.includes(c)" class="gp" :class="{ full: cuentaSuelta(c) >= recomendado() }">
                {{ cuentaSuelta(c) }} de {{ recomendado() }} {{ c === 'Medias' ? 'pares' : 'piezas' }}
              </span>
            </div>
            <div class="chips">
              <button
                v-for="p in prendasDe(c)"
                :key="p.id"
                type="button"
                class="chip"
                :class="{ on: enMaleta(p.id) || esPuesta(p.id), fija: esPuesta(p.id) }"
                :aria-pressed="enMaleta(p.id) || esPuesta(p.id)"
                :disabled="esPuesta(p.id)"
                :title="esPuesta(p.id) ? 'La llevas puesta' : ''"
                @click="toggleMaleta(p.id)"
              >
                <span v-if="enMaleta(p.id)" aria-hidden="true">✓</span>
                {{ p.nombre }}
                <small v-if="esPuesta(p.id)">· puesta</small>
              </button>
              <form v-if="nueva.cat === c" class="chip-form" @submit.prevent="guardarNueva">
                <input
                  :id="'nueva-m-' + c"
                  v-model="nueva.nombre"
                  :placeholder="c === 'Ropa interior' ? 'Ej: Tanga negra, encaje a los lados solo al frente' : 'Describe la nueva…'"
                  :aria-label="'Nueva en ' + c"
                  autocomplete="off"
                  @keydown.esc="nueva.cat = null"
                />
                <button class="btn sm" type="submit">Agregar</button>
              </form>
              <button v-else type="button" class="chip add-chip" @click="abrirNueva(c)">+ Nueva</button>
            </div>
          </div>
          <button type="button" class="btn" @click="eligiendo = false">Listo, ver mi maleta</button>
        </template>
      </div>

      <!-- Lo que ya está en la maleta -->
      <div class="panel" v-if="maleta.length">
        <div class="ph">
          <h3>Tu maleta</h3>
          <span class="gp" :class="{ full: hechos === total }">{{ hechos }}/{{ total }}</span>
        </div>
        <template v-for="g in porCat" :key="g.cat">
          <h4 v-if="ver(g.items).length">
            {{ g.cat }}
            <small class="sub">{{ listosDe(g.items) }}/{{ g.items.length }}</small>
          </h4>
          <ul class="list">
            <li v-for="p in ver(g.items)" :key="p.id">
              <label>
                <input type="checkbox" :id="'chk-p-' + p.id" :checked="chk('p:' + p.id)" @change="setChk('p:' + p.id, $event.target.checked)" />
                <span :class="{ done: chk('p:' + p.id) }">{{ p.nombre }}</span>
              </label>
              <template v-if="CATS_ROPA.includes(p.cat)">
                <span v-if="diasDePieza(p.id).length > 1" class="meta good">{{ diasDePieza(p.id).length }} días</span>
                <span v-else-if="diasDePieza(p.id).length === 1 && pesadas.includes(p.cat)" class="meta warn" title="Ocupa espacio y solo la usas un día">solo {{ diasDePieza(p.id)[0] }}</span>
                <span v-else-if="diasDePieza(p.id).length === 1" class="meta">{{ diasDePieza(p.id)[0] }}</span>
              </template>
              <button type="button" class="del" @click="quitar(p)" :aria-label="'Sacar ' + p.nombre + ' de la maleta'">×</button>
            </li>
          </ul>
        </template>
        <p v-if="soloPendientes && hechos === total" class="empty" style="margin: 0">Todo está empacado.</p>
      </div>
      <div v-else-if="!eligiendo" class="panel vacio">
        <strong>Tu maleta está vacía</strong>
        <span class="hint">Elige de tu armario lo que vas a llevar.</span>
        <button type="button" class="btn" @click="eligiendo = true">Elegir del armario</button>
      </div>

      <div class="panel" v-if="puesto.length">
        <h3>Lo llevas puesto el {{ dias[0].largo.toLowerCase() }}</h3>
        <p style="margin: 0; font-size: 14px">{{ puesto.map((p) => p.nombre).join(' · ') }}</p>
        <p class="hint" style="margin: 0; font-size: 12px">No va en la maleta, pero sí aparece en el checklist de regreso.</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.ph {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
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
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--lav);
}
h4 .sub {
  color: var(--muted);
  font-weight: 500;
  margin-left: 4px;
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
.elegir {
  border-color: var(--lav);
}
.elegir-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
}
.elegir-head > span:first-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.elegir-head strong {
  font-size: 16px;
}
.elegir-head .hint {
  font-size: 12px;
}
.chev {
  flex: 0 0 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--lav-soft);
  color: var(--lav);
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 600;
}
.chip.fija {
  cursor: default;
  opacity: 0.85;
}
.chip small {
  font-size: 11px;
  opacity: 0.9;
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
.vacio {
  align-items: center;
  text-align: center;
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
  background: var(--warn-soft);
}
.avisos .pintas {
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
  color: var(--warn);
}
.avisos .pintas .ico {
  color: var(--lav);
}
</style>
