<script setup>
import { reactive, ref, computed } from 'vue'
import { s, crearViaje, borrarViaje, abrirViaje, rangoTexto, resumenViaje } from '../store.js'

const hoy = new Date()
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const masDias = (n) => iso(new Date(hoy.getTime() + n * 86400000))

const nuevo = reactive({ destino: '', ida: iso(hoy), vuelta: masDias(2) })
const abierto = ref(s.viajes.length === 0)
const error = ref('')
const borrando = ref(null)

const hoyISO = iso(hoy)
const estado = (v) => (v.vuelta < hoyISO ? 'Ya fue' : v.ida <= hoyISO ? 'En curso' : 'Próximo')

const ordenados = computed(() =>
  [...s.viajes].sort((a, b) => {
    const pa = a.vuelta < hoyISO ? 1 : 0
    const pb = b.vuelta < hoyISO ? 1 : 0
    return pa - pb || a.ida.localeCompare(b.ida)
  })
)

function crear() {
  error.value = ''
  const destino = nuevo.destino.trim()
  if (!destino) return (error.value = 'Escribe para dónde vas.')
  if (!nuevo.ida || !nuevo.vuelta) return (error.value = 'Elige la fecha de ida y la de regreso.')
  if (nuevo.vuelta < nuevo.ida) return (error.value = 'El regreso no puede ser antes de la ida.')
  const id = crearViaje({ destino, ida: nuevo.ida, vuelta: nuevo.vuelta })
  nuevo.destino = ''
  abrirViaje(id)
}

function confirmarBorrar(id) {
  borrarViaje(id)
  borrando.value = null
}
</script>

<template>
  <main id="contenido" class="viajes">
    <h1>¿Para dónde vas?</h1>

    <ul class="cards" v-if="s.viajes.length">
      <li v-for="v in ordenados" :key="v.id" class="trip" :class="{ pasado: estado(v) === 'Ya fue' }">
        <button type="button" class="trip-main" @click="abrirViaje(v.id)">
          <span class="estado" :class="estado(v) === 'En curso' ? 'now' : ''">{{ estado(v) }}</span>
          <strong>{{ v.destino }}</strong>
          <span class="fechas">{{ rangoTexto(v) }} · {{ resumenViaje(v).dias }} días</span>
          <span class="mini">
            {{ resumenViaje(v).conPinta }}/{{ resumenViaje(v).dias }} pintas ·
            {{ resumenViaje(v).listos }}/{{ resumenViaje(v).total }} en la maleta
          </span>
        </button>
        <div class="trip-act">
          <template v-if="borrando === v.id">
            <span class="q">¿Borrar este viaje?</span>
            <button type="button" class="btn sm danger" @click="confirmarBorrar(v.id)">Borrar</button>
            <button type="button" class="btn ghost sm" @click="borrando = null">Cancelar</button>
          </template>
          <button v-else type="button" class="del" :aria-label="'Borrar viaje a ' + v.destino" @click="borrando = v.id">×</button>
        </div>
      </li>
    </ul>

    <div class="panel">
      <button v-if="!abierto" type="button" class="btn" @click="abierto = true">+ Nuevo viaje</button>
      <form v-else class="nuevo" @submit.prevent="crear">
        <h2>Nuevo viaje</h2>
        <label for="nv-destino">Destino</label>
        <input id="nv-destino" v-model="nuevo.destino" placeholder="Ej: Cartagena, casa de mi tía…" autocomplete="off" />
        <div class="fechas-row">
          <div>
            <label for="nv-ida">Ida</label>
            <input id="nv-ida" type="date" v-model="nuevo.ida" />
          </div>
          <div>
            <label for="nv-vuelta">Regreso</label>
            <input id="nv-vuelta" type="date" v-model="nuevo.vuelta" :min="nuevo.ida" />
          </div>
        </div>
        <p class="hint" style="margin: 0">Tus básicos (cargadores, aseo, documentos…) se copian solos a la maleta.</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div class="row">
          <button class="btn" type="submit">Crear y armar pintas</button>
          <button v-if="s.viajes.length" type="button" class="btn ghost" @click="abierto = false">Cancelar</button>
        </div>
      </form>
    </div>
  </main>
</template>

<style scoped>
.viajes {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
h1 {
  margin: 4px 0 0;
  font-size: clamp(24px, 7vw, 30px);
  text-wrap: balance;
}
.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.trip {
  background: var(--surface);
  border: 1.5px solid var(--line);
  border-radius: var(--r);
  display: flex;
  align-items: stretch;
  overflow: hidden;
}
.trip:hover {
  border-color: var(--lav);
}
.trip.pasado {
  opacity: 0.7;
}
.trip-main {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.trip-main strong {
  font-size: 19px;
}
.estado {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}
.estado.now {
  color: var(--pink);
}
.fechas {
  font-size: 14px;
  color: var(--ink);
}
.mini {
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.trip-act {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  padding: 8px;
  max-width: 55%;
}
.q {
  font-size: 12px;
}
.sm {
  padding: 6px 12px;
  font-size: 13px;
}
.danger {
  background: var(--warn);
}
.nuevo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nuevo label {
  font-size: 13px;
  font-weight: 600;
}
.nuevo input {
  border: 1.5px solid var(--line);
  background: var(--surface);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 15px;
  width: 100%;
  min-width: 0;
}
.fechas-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.fechas-row > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.error {
  margin: 0;
  font-size: 13px;
  color: var(--warn);
}
</style>
