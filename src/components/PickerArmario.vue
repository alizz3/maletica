<script setup>
// Lista del armario de una categoría para meter o sacar cosas de la maleta.
// Se puede buscar y, si no existe, crearla ahí mismo.
import { ref, computed, onMounted } from 'vue'
import { prendasDe, enMaleta, esPuesta, toggleMaleta, addPrenda, meterEnMaleta, plano } from '../store.js'

const props = defineProps({ cat: { type: String, required: true } })
const emit = defineEmits(['cerrar'])

const q = ref('')
const items = computed(() => {
  const t = plano(q.value)
  return prendasDe(props.cat).filter((p) => !t || plano(p.nombre).includes(t))
})
const existeExacta = computed(() => prendasDe(props.cat).some((p) => plano(p.nombre) === plano(q.value)))
const idInput = computed(() => 'pk-' + props.cat.replace(/\W+/g, '-'))

function crear() {
  const n = q.value.trim()
  if (!n) return
  meterEnMaleta(addPrenda(n, props.cat))
  q.value = ''
}
function enter() {
  // Enter: si hay una sola coincidencia, la mete; si no existe, la crea
  if (items.value.length === 1 && !enMaleta(items.value[0].id) && !esPuesta(items.value[0].id)) {
    toggleMaleta(items.value[0].id)
    q.value = ''
  } else if (q.value.trim() && !existeExacta.value) crear()
}
onMounted(() => document.getElementById(idInput.value)?.focus())
</script>

<template>
  <div class="picker">
    <div class="picker-top">
      <input
        :id="idInput"
        v-model="q"
        type="search"
        :placeholder="'Buscar o crear en ' + cat.toLowerCase() + '…'"
        :aria-label="'Buscar en ' + cat"
        autocomplete="off"
        @keydown.enter.prevent="enter"
        @keydown.esc="emit('cerrar')"
      />
      <button type="button" class="btn sm" @click="emit('cerrar')">Listo</button>
    </div>
    <div class="chips">
      <button
        v-for="p in items"
        :key="p.id"
        type="button"
        class="chip"
        :class="{ on: enMaleta(p.id) || esPuesta(p.id) }"
        :aria-pressed="enMaleta(p.id) || esPuesta(p.id)"
        :disabled="esPuesta(p.id)"
        @click="toggleMaleta(p.id)"
      >
        <span v-if="enMaleta(p.id)" aria-hidden="true">✓</span>
        {{ p.nombre }}
        <small v-if="esPuesta(p.id)">· puesta</small>
      </button>
      <button v-if="q.trim() && !existeExacta" type="button" class="chip crear" @click="crear">+ Crear «{{ q.trim() }}»</button>
      <span v-if="!items.length && !q.trim()" class="empty">No tienes nada en {{ cat.toLowerCase() }}. Escribe para crearla.</span>
    </div>
  </div>
</template>

<style scoped>
.picker {
  background: var(--lav-soft);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}
.picker-top {
  display: flex;
  gap: 8px;
}
.picker-top input {
  flex: 1;
  min-width: 0;
  border: 1.5px solid var(--lav);
  background: var(--surface);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 14px;
}
.sm {
  padding: 6px 14px;
  font-size: 13px;
}
.chip small {
  font-size: 11px;
}
.chip:disabled {
  cursor: default;
  opacity: 0.85;
}
.crear {
  border-style: dashed;
  border-color: var(--lav);
  color: var(--lav);
  font-weight: 600;
}
.empty {
  font-size: 13px;
}
</style>
