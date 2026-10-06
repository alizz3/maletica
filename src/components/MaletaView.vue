<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  viaje, dias, CATS, CATS_ROPA, CATS_SUELTAS, maleta, maletaDe, puesto,
  total, hechos, pct, chk, setChk, listosDe, sacarDeMaleta, meterEnMaleta,
  diasDePieza, recomendado, avisos, llevarTodasLasDePintas, textoLista, addComprar, delComprar, comprado,
  cantidad, setCantidad
} from '../store.js'
import RegresoView from './RegresoView.vue'
import PickerArmario from './PickerArmario.vue'
import ImportarLista from './ImportarLista.vue'

const pesadas = ['Abajo', 'Zapatos', 'Abrigo']
const aviso = ref('')
const soloPendientes = ref(false)
const abierta = ref(null) // categoría con el armario desplegado
const importando = ref(false)
const nuevaCompra = ref('')
function agregarCompra() {
  if (nuevaCompra.value.trim()) addComprar(nuevaCompra.value)
  nuevaCompra.value = ''
}
function marcarComprado(it) {
  comprado(it.id)
  avisar(it.nombre + ' pasó a la maleta')
}
function terminoImportar(msg) {
  importando.value = false
  avisar(msg)
}
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

const puestoDe = (c) => puesto.value.filter((p) => p.cat === c)
const porCat = computed(() =>
  CATS.map((c) => ({ cat: c, items: maletaDe(c), puestas: puestoDe(c) })).filter((g) => g.items.length || g.puestas.length)
)
const mostrarComprar = ref(false)
const otrasCats = computed(() => CATS.filter((c) => !maletaDe(c).length && !puestoDe(c).length))

// Categorías plegables (se recuerdan en este navegador)
const KEY = 'maletica-maleta-cerradas'
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
const alternar = (c) => (cerradas.has(c) ? cerradas.delete(c) : cerradas.add(c))
const todo = (abrir) => CATS.forEach((c) => (abrir ? cerradas.delete(c) : cerradas.add(c)))

// Cantidad: toca ×1 para cambiarla
const editandoCant = ref(null)
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
      <div class="row acciones" v-if="viaje.fase === 'ida'">
        <button type="button" class="btn ghost" @click="importando = !importando">Importar lista</button>
        <button v-if="maleta.length" type="button" class="btn ghost" @click="copiar">Copiar lista</button>
      </div>
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
      <ImportarLista v-if="importando" @cerrar="importando = false" @listo="terminoImportar" />

      <ul v-if="avisos.length" class="avisos" aria-label="Para revisar">
        <li v-for="(a, i) in avisos" :key="i" :class="a.tipo">
          <span class="ico" aria-hidden="true">{{ iconoAviso[a.tipo] }}</span>
          <span class="t">{{ a.texto }}</span>
          <button v-if="a.tipo === 'pintas'" type="button" class="link" @click="llevarTodasLasDePintas">Meterlas</button>
        </li>
      </ul>

      <!-- Tu maleta: categorías plegables, cada una con su "+" para traer cosas del armario -->
      <div class="panel">
        <div class="ph">
          <h3>Tu maleta</h3>
          <span v-if="maleta.length" class="gp" :class="{ full: hechos === total }">{{ hechos }}/{{ total }}</span>
        </div>
        <p v-if="!maleta.length && !puesto.length" class="hint" style="margin: 0">
          Está vacía. ¿Qué vas a llevar? Elige una categoría y trae lo que necesitas de tu armario.
        </p>
        <div class="row global" v-if="porCat.length > 1">
          <button type="button" class="link" @click="todo(false)">Contraer todo</button>
          <span aria-hidden="true">·</span>
          <button type="button" class="link" @click="todo(true)">Desplegar todo</button>
          <span class="leyenda"><i aria-hidden="true"></i> puesta en la ida</span>
        </div>

        <div v-for="g in porCat" :key="g.cat" class="sec">
          <button type="button" class="cat-head" :aria-expanded="!cerradas.has(g.cat)" @click="alternar(g.cat)">
            <span class="tri" :class="{ open: !cerradas.has(g.cat) }" aria-hidden="true">▸</span>
            <span class="cat-nom">{{ g.cat }}</span>
            <small class="sub" v-if="g.items.length">{{ listosDe(g.items) }}/{{ g.items.length }}</small>
            <small v-if="CATS_SUELTAS.includes(g.cat)" class="sub" :class="{ ok: cuentaSuelta(g.cat) >= recomendado() }">
              · {{ cuentaSuelta(g.cat) }} de {{ recomendado() }}
            </small>
          </button>

          <template v-if="!cerradas.has(g.cat)">
            <ul class="list">
              <!-- Lo que llevas puesto: se ve, pero no se empaca -->
              <template v-if="!soloPendientes">
                <li v-for="p in g.puestas" :key="'pu-' + p.id" class="puesta">
                  <span class="dot" aria-hidden="true"></span>
                  <span class="nom">{{ p.nombre }}</span>
                  <span class="meta tag-puesta">Puesta · Ida</span>
                </li>
              </template>
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
                <span v-if="editandoCant === p.id" class="stepper" v-fuera="() => (editandoCant = null)">
                  <button type="button" :disabled="cantidad(p.id) <= 1" :aria-label="'Una menos de ' + p.nombre" @click="setCantidad(p.id, cantidad(p.id) - 1)">−</button>
                  <output :for="'chk-p-' + p.id">{{ cantidad(p.id) }}</output>
                  <button type="button" :aria-label="'Una más de ' + p.nombre" @click="setCantidad(p.id, cantidad(p.id) + 1)">+</button>
                </span>
                <button
                  v-else
                  type="button"
                  class="qty"
                  :class="{ uno: cantidad(p.id) === 1 }"
                  :aria-label="'Cantidad de ' + p.nombre + ': ' + cantidad(p.id) + '. Cambiar'"
                  @click="editandoCant = p.id"
                >×{{ cantidad(p.id) }}</button>
                <button type="button" class="del" @click="quitar(p)" :aria-label="'Sacar ' + p.nombre + ' de la maleta'">×</button>
              </li>
            </ul>
            <PickerArmario v-if="abierta === g.cat" :cat="g.cat" @cerrar="abierta = null" />
            <button v-else type="button" class="mas" @click="abierta = g.cat">+ Agregar en {{ g.cat.toLowerCase() }}</button>
          </template>
        </div>
        <p v-if="soloPendientes && maleta.length && hechos === total" class="empty" style="margin: 0">Todo está empacado.</p>

        <!-- Categorías que todavía no tienen nada -->
        <div v-if="otrasCats.length" class="otras">
          <span class="otras-lbl">{{ maleta.length ? 'Agregar de otra categoría:' : 'Categorías:' }}</span>
          <div class="chips">
            <button
              v-for="c in otrasCats"
              :key="c"
              type="button"
              class="chip"
              :class="{ on: abierta === c }"
              @click="abierta = abierta === c ? null : c"
            >+ {{ c }}</button>
          </div>
          <div v-if="abierta && otrasCats.includes(abierta)" class="nueva-sec">
            <h4>{{ abierta }}</h4>
            <PickerArmario :cat="abierta" @cerrar="abierta = null" />
          </div>
        </div>
      </div>

      <!-- Por comprar (al final) -->
      <div class="panel comprar" v-if="(viaje.comprar || []).length || mostrarComprar">
        <div class="ph">
          <h3>Por comprar</h3>
          <span class="gp">{{ (viaje.comprar || []).length }}</span>
        </div>
        <ul class="list">
          <li v-for="it in viaje.comprar || []" :key="it.id">
            <span style="flex: 1; min-width: 0">{{ it.nombre }}</span>
            <button type="button" class="btn sm" @click="marcarComprado(it)">Ya lo compré</button>
            <button type="button" class="del" :aria-label="'Quitar ' + it.nombre" @click="delComprar(it.id)">×</button>
          </li>
        </ul>
        <form class="add" @submit.prevent="agregarCompra">
          <input id="nueva-compra" v-model="nuevaCompra" placeholder="Agregar algo por comprar" aria-label="Algo por comprar" autocomplete="off" />
          <button class="btn sm" type="submit">Agregar</button>
        </form>
      </div>
      <button v-else type="button" class="link porcomprar" @click="mostrarComprar = true">+ Anotar algo por comprar</button>
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
.acciones {
  gap: 6px;
}
.acciones .btn {
  padding: 7px 12px;
  font-size: 13px;
}
.comprar {
  border-color: var(--pink);
}
.comprar .btn.sm {
  padding: 4px 10px;
  font-size: 12px;
  background: var(--pink);
}
.porcomprar {
  align-self: flex-start;
  padding: 0;
  font-size: 13px;
  color: var(--pink);
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
.leyenda {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--pink);
}
.leyenda i,
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--pink);
  flex: 0 0 10px;
}
.cat-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 10px 0 2px;
  text-align: left;
  color: inherit;
}
.cat-nom {
  font-size: 12px;
  font-weight: 600;
  color: var(--lav);
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
.list li.puesta {
  gap: 10px;
}
.list li.puesta .dot {
  margin: 0 6px;
}
.list li.puesta .nom {
  flex: 1;
  min-width: 0;
}
.tag-puesta {
  color: var(--pink);
  background: var(--pink-soft);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.qty {
  border: 1.5px solid var(--lav);
  background: var(--lav-soft);
  color: var(--lav);
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.qty.uno {
  border-color: transparent;
  background: transparent;
  color: var(--muted);
  font-weight: 500;
  opacity: 0.7;
}
.stepper {
  display: inline-flex;
  align-items: center;
  border: 1.5px solid var(--lav);
  border-radius: 999px;
  overflow: hidden;
}
.stepper button {
  border: 0;
  background: var(--lav-soft);
  color: var(--lav);
  width: 28px;
  height: 26px;
  font-size: 16px;
  font-weight: 700;
}
.stepper button:disabled {
  opacity: 0.4;
}
.stepper output {
  min-width: 24px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.sec {
  display: flex;
  flex-direction: column;
}
.sec + .sec {
  border-top: 1px solid var(--line);
  margin-top: 4px;
}
.sub.ok {
  color: var(--ok);
}
.mas {
  align-self: flex-start;
  border: 0;
  background: transparent;
  color: var(--lav);
  font-weight: 600;
  font-size: 13px;
  padding: 6px 0 10px;
}
.mas:hover {
  text-decoration: underline;
}
.otras {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px dashed var(--line);
  padding-top: 12px;
}
.otras-lbl {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}
.otras .chip {
  border-style: dashed;
  color: var(--lav);
  font-weight: 500;
}
.otras .chip.on {
  border-style: solid;
  color: var(--on-accent);
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
