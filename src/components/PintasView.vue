<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { viaje, dias, CATS, ACTIVIDADES, pintaDe, prendasDe, usos, togglePrenda, addPrenda, infoDia, setInfo } from '../store.js'

const diaSel = ref(0)
watch(dias, (d) => {
  if (diaSel.value >= d.length) diaSel.value = Math.max(0, d.length - 1)
})
const dia = computed(() => dias.value[diaSel.value])
const pinta = computed(() => (dia.value ? pintaDe(dia.value.key) : []))
const porCat = (c) => pinta.value.filter((p) => p.cat === c)
const info = computed(() => (dia.value ? infoDia(dia.value.key) : {}))
const elegirActividad = (a) => setInfo(dia.value.key, 'actividad', info.value.actividad === a ? '' : a)
const enDia = (id) => !!dia.value && (viaje.value.pintas[dia.value.key] || []).includes(id)

// Agregar una prenda nueva sin salir de las pintas
const agregandoEn = ref(null)
const nombreNuevo = ref('')
async function abrirAgregar(c) {
  agregandoEn.value = c
  nombreNuevo.value = ''
  await nextTick()
  document.getElementById('nueva-' + c)?.focus()
}
function guardarNueva(c) {
  const n = nombreNuevo.value.trim()
  if (n) {
    const id = addPrenda(n, c)
    togglePrenda(dia.value.key, id) // queda puesta en este día
  }
  agregandoEn.value = null
}
</script>

<template>
  <section aria-labelledby="t-pintas" v-if="dia">
    <h2 id="t-pintas" class="sr-only">Pintas por día</h2>
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
        <em v-if="viaje.info?.[d.key]?.actividad">{{ viaje.info[d.key].actividad }}</em>
      </button>
    </div>

    <div class="panel">
      <div class="row" style="justify-content: space-between">
        <h2>{{ dia.largo }}</h2>
        <span v-if="diaSel === 0" class="badge">Ida · lo llevas puesto</span>
        <span v-else-if="diaSel === dias.length - 1" class="badge">Regreso</span>
      </div>
      <div class="actividad" role="group" aria-label="¿Qué vas a hacer este día?">
        <button
          v-for="a in ACTIVIDADES"
          :key="a"
          type="button"
          class="act"
          :class="{ on: info.actividad === a }"
          :aria-pressed="info.actividad === a"
          @click="elegirActividad(a)"
        >{{ a }}</button>
      </div>
      <input
        :id="'notas-' + dia.key"
        class="notas"
        :value="info.notas || ''"
        placeholder="Notas del día: caminar bastante, cena elegante…"
        aria-label="Notas del día"
        @change="setInfo(dia.key, 'notas', $event.target.value)"
      />
      <dl class="outfit" v-if="pinta.length">
        <template v-for="c in CATS" :key="c">
          <template v-if="porCat(c).length">
            <dt>{{ c }}</dt>
            <dd>{{ porCat(c).map((p) => p.nombre).join(', ') }}</dd>
          </template>
        </template>
      </dl>
      <p v-else class="empty" style="margin: 0">Todavía no hay pinta. Toca prendas abajo para armarla.</p>
    </div>

    <div class="group" v-for="c in CATS" :key="c">
      <h3>{{ c }}</h3>
      <div class="chips">
        <button
          v-for="p in prendasDe(c)"
          :key="p.id"
          type="button"
          class="chip"
          :class="{ on: enDia(p.id) }"
          :aria-pressed="enDia(p.id)"
          @click="togglePrenda(dia.key, p.id)"
        >
          {{ p.nombre }}
          <span class="n" v-if="usos[p.id]" :aria-label="usos[p.id] + ' días'">{{ usos[p.id] }}</span>
        </button>

        <form v-if="agregandoEn === c" class="chip-form" @submit.prevent="guardarNueva(c)">
          <input :id="'nueva-' + c" v-model="nombreNuevo" :placeholder="'Nueva prenda (' + c.toLowerCase() + ')'" :aria-label="'Nueva prenda en ' + c" autocomplete="off" @keydown.esc="agregandoEn = null" />
          <button class="btn sm" type="submit">Agregar</button>
        </form>
        <button v-else type="button" class="chip add-chip" @click="abrirAgregar(c)">+ Nueva</button>
      </div>
    </div>

    <p class="tip">
      <b>Regla anti-maleta-gorda:</b> pocos bottoms que se repiten y tops que rotan. El número en cada prenda dice
      cuántos días la usas. Lo que no sale en ninguna pinta, no viaja.
    </p>
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
.actividad {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.act {
  border: 1.5px solid var(--line);
  background: transparent;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
  color: var(--muted);
}
.act.on {
  background: var(--pink-soft);
  border-color: var(--pink);
  color: var(--pink);
  font-weight: 600;
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
.add-chip {
  border-style: dashed;
  color: var(--lav);
  font-weight: 600;
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
.sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
