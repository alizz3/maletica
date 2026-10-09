<script setup>
// La maleta agrupada por bolsos (neceser, bolsa del computador…).
// Sirve para la ida y para el regreso: recibe la lista de cosas a mostrar.
import { ref, computed, nextTick } from 'vue'
import {
  s, chk, setChk, listosDe, cantidad, bolsoDe, setBolso, crearBolso, renombrarBolso, borrarBolso,
  BOLSOS_SUGERIDOS, esTraigo, esPuesta, plano
} from '../store.js'

const props = defineProps({
  items: { type: Array, required: true },
  soloPendientes: Boolean,
  regreso: Boolean
})

const bolsos = computed(() => s.bolsos || [])
const grupos = computed(() => [
  ...bolsos.value.map((b) => ({ id: b.id, nombre: b.nombre, items: props.items.filter((p) => bolsoDe(p.id) === b.id) })),
  { id: null, nombre: 'Suelto en la maleta', items: props.items.filter((p) => !bolsos.value.some((b) => b.id === bolsoDe(p.id))) }
])
const ver = (items) => (props.soloPendientes ? items.filter((p) => !chk('p:' + p.id)) : items)
const sugeridos = computed(() => BOLSOS_SUGERIDOS.filter((n) => !bolsos.value.some((b) => plano(b.nombre) === plano(n))))

// Crear bolso
const nuevo = ref('')
function crear(nombre) {
  crearBolso(nombre ?? nuevo.value)
  nuevo.value = ''
}

// Mover con el select de cada fila
const pidiendoNombre = ref(null) // id de la cosa que espera un bolso nuevo
const nombreNuevoBolso = ref('')
async function mover(p, e) {
  const val = e.target.value
  if (val === '__nuevo') {
    e.target.value = bolsoDe(p.id) || ''
    pidiendoNombre.value = p.id
    nombreNuevoBolso.value = ''
    await nextTick()
    document.getElementById('nb-' + p.id)?.focus()
    return
  }
  setBolso(p.id, val || null)
}
function crearYMover(p) {
  const id = crearBolso(nombreNuevoBolso.value)
  if (id) setBolso(p.id, id)
  pidiendoNombre.value = null
}

// Meter varias cosas en un bolso
const llenando = ref(null)
const fuera = (g) => props.items.filter((p) => bolsoDe(p.id) !== g.id)

// Renombrar / borrar
const editando = ref(null)
const borrando = ref(null)
</script>

<template>
  <div class="bolsos">
    <!-- Crear bolsos -->
    <div class="crear">
      <span class="lbl">{{ bolsos.length ? 'Nuevo bolso:' : 'Crea los bolsos que van dentro de tu maleta:' }}</span>
      <div class="chips">
        <button v-for="n in sugeridos" :key="n" type="button" class="chip sug" @click="crear(n)">+ {{ n }}</button>
      </div>
      <form class="add" @submit.prevent="crear()">
        <input id="nuevo-bolso" v-model="nuevo" placeholder="Otro: bolsa de zapatos, cartuchera…" aria-label="Nombre del bolso nuevo" autocomplete="off" />
        <button class="btn sm" type="submit" :disabled="!nuevo.trim()">Crear</button>
      </form>
    </div>

    <template v-for="g in grupos" :key="g.id || 'suelto'">
      <div class="bolso" v-if="g.id || g.items.length" :class="{ suelto: !g.id }">
        <div class="bh">
          <svg v-if="g.id" class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
          <input
            v-if="g.id && editando === g.id"
            :id="'rb-' + g.id"
            class="ren"
            :value="g.nombre"
            aria-label="Nombre del bolso"
            v-fuera="() => (editando = null)"
            @change="renombrarBolso(g.id, $event.target.value)"
            @keydown.enter="editando = null"
          />
          <button v-else-if="g.id" type="button" class="nom" title="Cambiar nombre" @click="editando = g.id">{{ g.nombre }}</button>
          <span v-else class="nom suelto-nom">{{ g.nombre }}</span>
          <small class="sub" v-if="g.items.length">{{ listosDe(g.items) }}/{{ g.items.length }}</small>
          <template v-if="g.id">
            <template v-if="borrando === g.id">
              <button type="button" class="link peligro" @click="borrarBolso(g.id); borrando = null">Borrar</button>
              <button type="button" class="link" @click="borrando = null">No</button>
            </template>
            <button v-else type="button" class="del" :aria-label="'Borrar el bolso ' + g.nombre" @click="borrando = g.id">×</button>
          </template>
        </div>

        <ul class="list">
          <li v-for="p in ver(g.items)" :key="p.id">
            <label>
              <input type="checkbox" :id="'bo-' + p.id" :checked="chk('p:' + p.id)" @change="setChk('p:' + p.id, $event.target.checked)" />
              <span :class="{ done: chk('p:' + p.id) }">{{ p.nombre }}</span>
            </label>
            <span v-if="cantidad(p.id) > 1" class="meta qty">×{{ cantidad(p.id) }}</span>
            <span v-if="regreso && esTraigo(p.id)" class="meta nuevo">nuevo</span>
            <span v-if="regreso && esPuesta(p.id)" class="meta puesta">puesta en la ida</span>
            <form v-if="pidiendoNombre === p.id" class="nb" v-fuera="() => (pidiendoNombre = null)" @submit.prevent="crearYMover(p)">
              <input :id="'nb-' + p.id" v-model="nombreNuevoBolso" placeholder="Nombre del bolso" aria-label="Nombre del bolso nuevo" />
              <button class="btn sm" type="submit">OK</button>
            </form>
            <select
              v-else-if="bolsos.length"
              :id="'mv-' + p.id"
              class="mover"
              :value="bolsoDe(p.id) || ''"
              :aria-label="'Mover ' + p.nombre + ' a otro bolso'"
              :title="'Mover a otro bolso'"
              @change="mover(p, $event)"
            >
              <option value="">Suelto</option>
              <option v-for="b in bolsos" :key="b.id" :value="b.id">{{ b.nombre }}</option>
              <option value="__nuevo">+ Nuevo bolso…</option>
            </select>
          </li>
          <li v-if="g.id && !g.items.length" class="empty">Vacío. Mete cosas con el botón de abajo.</li>
        </ul>

        <template v-if="g.id">
          <div v-if="llenando === g.id" class="llenar" v-fuera="(e) => !e.target.closest('.meter') && (llenando = null)">
            <span class="lbl">Toca lo que va en {{ g.nombre }}:</span>
            <div class="chips">
              <button v-for="p in fuera(g)" :key="p.id" type="button" class="chip" @click="setBolso(p.id, g.id)">
                {{ p.nombre }}
              </button>
              <span v-if="!fuera(g).length" class="empty">Ya está todo aquí.</span>
            </div>
            <button type="button" class="btn sm" @click="llenando = null">Listo</button>
          </div>
          <button v-else type="button" class="meter" @click="llenando = g.id">+ Meter cosas en {{ g.nombre.toLowerCase() }}</button>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bolsos {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.crear {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg);
  border-radius: 12px;
  padding: 10px 12px;
}
.lbl {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}
.chip.sug {
  border-style: dashed;
  color: var(--lav);
  font-weight: 500;
}
.add input {
  font-size: 15px;
}
.sm {
  padding: 5px 12px;
  font-size: 13px;
}
.btn:disabled {
  opacity: 0.5;
}
.bolso {
  border: 1.5px solid var(--line);
  border-radius: 14px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bolso.suelto {
  border-style: dashed;
}
.bh {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ico {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  fill: none;
  stroke: var(--pink);
  stroke-width: 2;
  stroke-linejoin: round;
}
.nom {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  text-align: left;
  min-width: 0;
}
.suelto-nom {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}
.ren {
  flex: 1;
  min-width: 0;
  border: 1.5px solid var(--lav);
  border-radius: 8px;
  padding: 3px 8px;
  font-size: 15px;
  font-weight: 600;
  background: var(--surface);
}
.sub {
  color: var(--muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.bh .del,
.bh .link {
  margin-left: auto;
}
.bh .link + .link {
  margin-left: 0;
}
.link {
  padding: 0;
  font-size: 13px;
}
.peligro {
  color: var(--warn);
}
.list li {
  flex-wrap: wrap;
  row-gap: 4px;
}
.list li label {
  flex: 1 0 calc(100% - 84px);
  min-width: 0;
}
/* Select con ícono de bolso: compacto, la lista sale al tocarlo */
.mover {
  appearance: none;
  -webkit-appearance: none;
  width: 32px;
  height: 28px;
  flex: 0 0 32px;
  border: 0;
  border-radius: 999px;
  color: transparent;
  cursor: pointer;
  background: var(--lav-soft)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237254BE' stroke-width='2' stroke-linejoin='round'%3E%3Cpath d='M5 8h14l-1 12H6L5 8Z'/%3E%3Cpath d='M9 8V6a3 3 0 0 1 6 0v2'/%3E%3C/svg%3E")
    center / 16px no-repeat;
}
.mover option {
  color: var(--ink);
  background: var(--surface);
}
.qty {
  color: var(--lav);
  font-weight: 700;
}
.nuevo {
  color: var(--ok);
  font-weight: 700;
}
.puesta {
  color: var(--pink);
}
.nb {
  display: flex;
  gap: 6px;
  flex: 1 1 100%;
}
.nb input {
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  border: 1.5px solid var(--lav);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 16px;
  background: var(--surface);
}
.meter {
  align-self: flex-start;
  border: 0;
  background: transparent;
  color: var(--lav);
  font-weight: 600;
  font-size: 13px;
  padding: 4px 0;
}
.llenar {
  background: var(--lav-soft);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.llenar .btn {
  align-self: flex-start;
}
.empty {
  font-size: 13px;
}
</style>
