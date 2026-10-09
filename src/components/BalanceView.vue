<script setup>
import { ref, computed } from 'vue'
import { viaje, CATS, viajo, noUsado, toggleNoUsado, addFalto, delFalto, setNotasRepaso, esPuesta } from '../store.js'

const porCat = computed(() => CATS.map((c) => ({ cat: c, items: viajo.value.filter((p) => p.cat === c) })).filter((g) => g.items.length))
const cuantosNo = computed(() => viajo.value.filter((p) => noUsado(p.id)).length)
const repaso = computed(() => viaje.value.repaso || { noUsado: [], falto: [], notas: '' })

const falta = ref('')
function agregarFalto() {
  addFalto(falta.value)
  falta.value = ''
}
</script>

<template>
  <div class="panel intro">
    <h3>Balance del viaje</h3>
    <p class="hint" style="margin: 0">
      Lo que anotes aquí te aparece en la maleta de tus próximos viajes, para que lleves justo lo necesario.
    </p>
  </div>

  <!-- 1. Lo que no usaste -->
  <div class="panel">
    <div class="ph">
      <h3>¿Qué no usaste?</h3>
      <span class="gp">{{ cuantosNo }} sin usar</span>
    </div>
    <p class="hint" style="margin: 0; font-size: 12px">Toca lo que llevaste y no usaste.</p>
    <template v-for="g in porCat" :key="g.cat">
      <h4>{{ g.cat }}</h4>
      <div class="chips">
        <button
          v-for="p in g.items"
          :key="p.id"
          type="button"
          class="chip"
          :class="{ no: noUsado(p.id) }"
          :aria-pressed="noUsado(p.id)"
          @click="toggleNoUsado(p.id)"
        >
          <span v-if="noUsado(p.id)" aria-hidden="true">✕</span>
          {{ p.nombre }}
          <small v-if="esPuesta(p.id)">· puesta</small>
        </button>
      </div>
    </template>
    <p v-if="!viajo.length" class="empty" style="margin: 0">Este viaje no tiene nada en la maleta.</p>
  </div>

  <!-- 2. Lo que hizo falta -->
  <div class="panel">
    <div class="ph">
      <h3>¿Qué te hizo falta?</h3>
      <span class="gp">{{ repaso.falto.length }}</span>
    </div>
    <ul class="list" v-if="repaso.falto.length">
      <li v-for="f in repaso.falto" :key="f.id">
        <span style="flex: 1; min-width: 0">{{ f.nombre }}</span>
        <button type="button" class="del" :aria-label="'Quitar ' + f.nombre" @click="delFalto(f.id)">×</button>
      </li>
    </ul>
    <form class="add" @submit.prevent="agregarFalto">
      <input id="falto-nuevo" v-model="falta" placeholder="Ej: Sandalias, más shorts, repelente" aria-label="Algo que te hizo falta" autocomplete="off" />
      <button class="btn sm" type="submit" :disabled="!falta.trim()">Agregar</button>
    </form>
  </div>

  <!-- 3. Notas para la próxima -->
  <div class="panel">
    <label for="notas-repaso"><h3>Notas para la próxima vez</h3></label>
    <textarea
      id="notas-repaso"
      :value="repaso.notas"
      rows="4"
      :placeholder="'Ej: En ' + viaje.destino + ' hace mucho calor; con 2 shorts y 3 blusas basta. El tomacorriente queda lejos de la cama, llevar extensión.'"
      @change="setNotasRepaso($event.target.value)"
    ></textarea>
    <p class="hint" style="margin: 0; font-size: 12px">Se guarda solo. Si vuelves a {{ viaje.destino }}, estas notas salen de primeras.</p>
  </div>
</template>

<style scoped>
.intro {
  background: var(--lav-soft);
  border-color: transparent;
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
}
h4 {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--lav);
}
.chip.no {
  background: var(--pink-soft);
  border-color: var(--pink);
  color: var(--pink);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}
.chip.no span {
  text-decoration: none;
}
.chip small {
  font-size: 11px;
  opacity: 0.85;
}
textarea {
  width: 100%;
  min-width: 0;
  border: 1.5px solid var(--line);
  background: var(--bg);
  border-radius: 12px;
  padding: 10px 12px;
  font: inherit;
  font-size: 15px;
  resize: vertical;
}
textarea:focus {
  border-color: var(--lav);
  outline: none;
}
label h3 {
  margin: 0;
}
.btn:disabled {
  opacity: 0.5;
}
.sm {
  padding: 6px 12px;
  font-size: 13px;
}
.add input {
  font-size: 15px;
}
</style>
