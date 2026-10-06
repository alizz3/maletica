<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  viaje, dias, CATS_PINTA, ACTIVIDADES, pintaDe, prendasDe, usos, togglePrenda, addPrenda,
  infoDia, setInfo, actividadesDe, toggleActividad, diasSinOutfit, sugerirOutfits, maleta
} from '../store.js'

const diaSel = ref(0)
watch(dias, (d) => {
  if (diaSel.value >= d.length) diaSel.value = Math.max(0, d.length - 1)
})
const dia = computed(() => dias.value[diaSel.value])
const outfit = computed(() => (dia.value ? pintaDe(dia.value.key) : []))
const elegidasDe = (c) => outfit.value.filter((p) => p.cat === c)
const disponiblesDe = (c) => prendasDe(c).filter((p) => !elegidasDe(c).some((e) => e.id === p.id))
const acts = computed(() => (dia.value ? actividadesDe(dia.value.key) : []))
const notas = computed(() => (dia.value ? infoDia(dia.value.key).notas || '' : ''))

// ----- Actividades: menú desplegable con varias opciones -----
const actsAbierto = ref(false)
const actsRef = ref(null)
function fuera(e) {
  if (actsRef.value && !actsRef.value.contains(e.target)) actsAbierto.value = false
}
onMounted(() => document.addEventListener('click', fuera))
onBeforeUnmount(() => document.removeEventListener('click', fuera))

// ----- Prendas: un select por categoría -----
const creandoEn = ref(null)
const nombreNuevo = ref('')
async function elegir(c, e) {
  const val = e.target.value
  e.target.value = ''
  if (!val) return
  if (val === '__nueva') {
    creandoEn.value = c
    nombreNuevo.value = ''
    await nextTick()
    document.getElementById('nueva-o-' + c)?.focus()
    return
  }
  togglePrenda(dia.value.key, val)
}
function crear(c) {
  const n = nombreNuevo.value.trim()
  if (n) togglePrenda(dia.value.key, addPrenda(n, c))
  creandoEn.value = null
}
// ----- Sugerencia automática -----
const msgSugerencia = ref('')
const hayRopaEnMaleta = computed(() => maleta.value.some((p) => ['Arriba', 'Abajo'].includes(p.cat)))
function sugerir() {
  const n = sugerirOutfits()
  msgSugerencia.value = n
    ? 'Armé ' + n + (n === 1 ? ' outfit' : ' outfits') + ' con lo de tu maleta. Cámbialos como quieras.'
    : 'No alcanzó la ropa de la maleta para sugerir. Agrega blusas o bottoms en la Maleta.'
}

const etiquetaUso = (id) => (usos.value[id] ? ' · ' + usos.value[id] + (usos.value[id] === 1 ? ' día' : ' días') : '')
</script>

<template>
  <section aria-labelledby="t-outfits" v-if="dia">
    <h2 id="t-outfits" class="sr-only">Outfits por día</h2>
    <div class="days" role="tablist" aria-label="Días del viaje">
      <button
        v-for="(d, i) in dias"
        :key="d.key"
        type="button"
        role="tab"
        class="day"
        :class="{ on: diaSel === i, lleno: (viaje.pintas[d.key] || []).length }"
        :aria-selected="diaSel === i"
        @click="diaSel = i"
      >
        <span>{{ d.corto }}</span><strong>{{ d.num }}</strong>
        <em v-if="actividadesDe(d.key).length">{{ actividadesDe(d.key).join(', ') }}</em>
      </button>
    </div>

    <div v-if="diasSinOutfit.length && hayRopaEnMaleta" class="sugerir">
      <span>{{ diasSinOutfit.length === 1 ? 'Hay 1 día' : 'Hay ' + diasSinOutfit.length + ' días' }} sin outfit.</span>
      <button type="button" class="btn sm" @click="sugerir">✨ Sugerir con lo de mi maleta</button>
    </div>
    <p v-if="msgSugerencia" class="toast" role="status" style="margin: 0">{{ msgSugerencia }}</p>

    <div class="panel">
      <div class="row" style="justify-content: space-between">
        <h2>{{ dia.largo }}</h2>
        <span v-if="diaSel === 0" class="badge">Ida · lo llevas puesto</span>
        <span v-else-if="diaSel === dias.length - 1" class="badge">Regreso</span>
      </div>

      <!-- Actividades (varias) -->
      <div class="acts" ref="actsRef">
        <button
          type="button"
          id="acts-btn"
          class="acts-btn"
          :aria-expanded="actsAbierto"
          aria-haspopup="true"
          @click="actsAbierto = !actsAbierto"
        >
          <span class="lbl">Actividad</span>
          <span class="val" :class="{ vacio: !acts.length }">{{ acts.length ? acts.join(', ') : '¿Qué vas a hacer?' }}</span>
          <span class="caret" aria-hidden="true">▾</span>
        </button>
        <div v-if="actsAbierto" class="acts-menu" role="group" aria-label="Actividades del día">
          <label v-for="a in ACTIVIDADES" :key="a" :for="'act-' + a">
            <input type="checkbox" :id="'act-' + a" :checked="acts.includes(a)" @change="toggleActividad(dia.key, a)" />
            {{ a }}
          </label>
        </div>
      </div>

      <input
        :id="'notas-' + dia.key"
        class="notas"
        :value="notas"
        placeholder="Notas del día: caminar bastante, cena elegante…"
        aria-label="Notas del día"
        @change="setInfo(dia.key, 'notas', $event.target.value)"
      />

      <!-- Una fila por categoría -->
      <div class="slots">
        <div class="slot" v-for="c in CATS_PINTA" :key="c">
          <label class="slot-lbl" :for="'sel-' + c">{{ c }}</label>
          <div class="slot-val">
            <span v-for="p in elegidasDe(c)" :key="p.id" class="pick">
              {{ p.nombre }}
              <button type="button" class="x" :aria-label="'Quitar ' + p.nombre" @click="togglePrenda(dia.key, p.id)">×</button>
            </span>
            <form v-if="creandoEn === c" class="nueva" @submit.prevent="crear(c)">
              <input :id="'nueva-o-' + c" v-model="nombreNuevo" placeholder="Nombre de la prenda" :aria-label="'Nueva prenda en ' + c" autocomplete="off" @keydown.esc="creandoEn = null" />
              <button class="btn sm" type="submit">Agregar</button>
            </form>
            <select v-else :id="'sel-' + c" class="slot-sel" :class="{ mas: elegidasDe(c).length }" @change="elegir(c, $event)">
              <option value="">{{ elegidasDe(c).length ? '+ otra' : 'Elegir…' }}</option>
              <option v-for="p in disponiblesDe(c)" :key="p.id" :value="p.id">{{ p.nombre }}{{ etiquetaUso(p.id) }}</option>
              <option value="__nueva">+ Nueva prenda…</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </section>
  <p v-else class="empty">Revisa las fechas del viaje: el regreso quedó antes de la ida.</p>
</template>

<style scoped>
.day.lleno:not(.on) strong {
  color: var(--lav);
}
.day em {
  display: block;
  font-style: normal;
  font-size: 10px;
  color: var(--pink);
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sugerir {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--lav-soft);
  border-radius: var(--r);
  padding: 10px 12px;
  font-size: 13px;
}

/* Actividades */
.acts {
  position: relative;
}
.acts-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid var(--line);
  background: var(--bg);
  border-radius: 10px;
  padding: 8px 12px;
  text-align: left;
  font-size: 13px;
}
.acts-btn:hover {
  border-color: var(--lav);
}
.acts-btn .lbl {
  color: var(--muted);
  font-size: 12px;
  flex: 0 0 auto;
}
.acts-btn .val {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--pink);
  font-weight: 600;
}
.acts-btn .val.vacio {
  color: var(--muted);
  font-weight: 400;
}
.caret {
  color: var(--muted);
}
.acts-menu {
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1.5px solid var(--lav);
  border-radius: 12px;
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
}
.acts-menu label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.acts-menu label:hover {
  background: var(--lav-soft);
}
.acts-menu input {
  accent-color: var(--pink);
}

.notas {
  border: 1.5px solid var(--line);
  background: var(--bg);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  width: 100%;
  min-width: 0;
}

/* Filas por categoría */
.slots {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--line);
}
.slot {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
}
.slot:last-child {
  border-bottom: 0;
}
.slot-lbl {
  font-size: 12px;
  color: var(--muted);
}
.slot-val {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-width: 0;
}
.pick {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--lav);
  color: var(--on-accent);
  border-radius: 999px;
  padding: 4px 4px 4px 12px;
  font-size: 13px;
  max-width: 100%;
}
.pick .x {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 16px;
  line-height: 1;
  padding: 0 6px;
  opacity: 0.85;
}
.slot-sel {
  flex: 1 1 140px;
  min-width: 0;
  border: 1.5px solid var(--line);
  background: var(--surface);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 13px;
  color: var(--muted);
}
.slot-sel.mas {
  flex: 0 0 auto;
  width: 96px;
  border-style: dashed;
  color: var(--lav);
  font-weight: 600;
}
.nueva {
  display: flex;
  gap: 6px;
  flex: 1 1 100%;
}
.nueva input {
  flex: 1;
  min-width: 0;
  border: 1.5px solid var(--lav);
  background: var(--surface);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 13px;
}
.sm {
  padding: 5px 12px;
  font-size: 13px;
}
@media (max-width: 380px) {
  .slot {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
