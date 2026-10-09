<script setup>
// Lo que aprendiste en viajes anteriores: notas, lo que hizo falta y lo que no usaste.
import { ref, computed } from 'vue'
import { viaje, lecciones, llevarLoQueFalto, enMaleta } from '../store.js'

const abierto = ref(true)
const hay = computed(() => lecciones.value.notas.length || lecciones.value.falto.length || lecciones.value.noUsado.length)
const noUsadoVisibles = computed(() => lecciones.value.noUsado.slice(0, 8))
</script>

<template>
  <div v-if="hay" class="panel lecciones">
    <button type="button" class="lh" :aria-expanded="abierto" @click="abierto = !abierto">
      <span>
        <strong>Para tener en cuenta</strong>
        <span class="hint">Lo que anotaste en viajes anteriores</span>
      </span>
      <span class="chev" aria-hidden="true">{{ abierto ? '−' : '+' }}</span>
    </button>

    <template v-if="abierto">
      <div v-for="n in lecciones.notas.slice(0, 3)" :key="n.id" class="nota" :class="{ mismo: n.mismo }">
        <span class="de">{{ n.mismo ? 'La última vez en ' + n.destino : n.destino }} · {{ n.rango }}</span>
        <p>{{ n.texto }}</p>
      </div>

      <div v-if="lecciones.falto.length" class="bloque">
        <h4>Te hizo falta</h4>
        <ul class="list">
          <li v-for="f in lecciones.falto" :key="f.nombre">
            <span style="flex: 1; min-width: 0">{{ f.nombre }} <small class="sub">· {{ f.destino }}</small></span>
            <button type="button" class="btn sm" @click="llevarLoQueFalto(f)">+ Llevar</button>
          </li>
        </ul>
      </div>

      <div v-if="noUsadoVisibles.length" class="bloque">
        <h4>Llevaste y no usaste</h4>
        <div class="chips">
          <span v-for="x in noUsadoVisibles" :key="x.prenda.id" class="chip estatica" :class="{ ojo: enMaleta(x.prenda.id) }">
            {{ x.prenda.nombre }}
            <small v-if="x.destinos.length > 1">×{{ x.destinos.length }}</small>
          </span>
        </div>
        <p class="hint" style="margin: 0; font-size: 12px" v-if="noUsadoVisibles.some((x) => enMaleta(x.prenda.id))">
          Las resaltadas ya están en tu maleta de {{ viaje.destino }}. ¿Seguro las vas a usar?
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lecciones {
  border-color: var(--lav);
}
.lh {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  color: inherit;
}
.lh > span:first-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.lh .hint {
  font-size: 12px;
}
.chev {
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
.nota {
  background: var(--bg);
  border-radius: 12px;
  padding: 10px 12px;
}
.nota.mismo {
  background: var(--pink-soft);
}
.nota .de {
  font-size: 11px;
  font-weight: 600;
  color: var(--pink);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.nota p {
  margin: 4px 0 0;
  font-size: 14px;
  white-space: pre-line;
}
.bloque {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
h4 {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--lav);
}
.sub {
  color: var(--muted);
  font-size: 11px;
}
.sm {
  padding: 4px 10px;
  font-size: 12px;
}
.estatica {
  cursor: default;
}
.chip.ojo {
  background: var(--warn-soft);
  border-color: var(--warn);
  color: var(--warn);
  font-weight: 600;
}
</style>
