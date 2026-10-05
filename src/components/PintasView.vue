<script setup>
import { ref, computed, watch } from 'vue'
import { s, dias, CATS, pintaDe, prendasDe, usos, togglePrenda } from '../store.js'

const diaSel = ref(0)
watch(dias, (d) => {
  if (diaSel.value >= d.length) diaSel.value = d.length - 1
})
const dia = computed(() => dias.value[diaSel.value])
const pinta = computed(() => pintaDe(dia.value.key))
const porCat = (c) => pinta.value.filter((p) => p.cat === c)
const enDia = (id) => (s.pintas[dia.value.key] || []).includes(id)
</script>

<template>
  <section aria-labelledby="t-pintas">
    <h2 id="t-pintas" class="sr-only">Pintas por día</h2>
    <div class="days" role="tablist" aria-label="Días del viaje">
      <button
        v-for="(d, i) in dias"
        :key="d.key"
        type="button"
        role="tab"
        class="day"
        :class="{ on: diaSel === i }"
        :aria-selected="diaSel === i"
        @click="diaSel = i"
      >
        <span>{{ d.corto }}</span><strong>{{ d.num }}</strong>
      </button>
    </div>

    <div class="panel">
      <div class="row" style="justify-content: space-between">
        <h2>{{ dia.largo }}</h2>
        <span v-if="diaSel === 0" class="badge">Viaje · lo llevas puesto</span>
        <span v-else-if="diaSel === dias.length - 1" class="badge">Regreso</span>
      </div>
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
        <span v-if="!prendasDe(c).length" class="empty">Nada en esta categoría. Agrégala en Armario.</span>
      </div>
    </div>

    <p class="tip">
      <b>Regla anti-maleta-gorda:</b> pocos bottoms que se repiten y tops que rotan. El número en cada prenda dice
      cuántos días la usas. Lo que no sale en ninguna pinta, no viaja.
    </p>
  </section>
</template>
