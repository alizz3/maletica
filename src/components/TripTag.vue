<script setup>
import { ref } from 'vue'
import { viaje, rango, dias, irAViajes, borrarViaje } from '../store.js'

const editando = ref(false)
const confirmar = ref(false)
function borrar() {
  const id = viaje.value.id
  irAViajes()
  borrarViaje(id)
}
</script>

<template>
  <header class="tag" v-if="viaje">
    <button type="button" class="back" @click="irAViajes">← Mis viajes</button>
    <h1>{{ viaje.destino }}</h1>
    <div class="route">
      <span>{{ rango }}</span>
      <span>{{ dias.length }} {{ dias.length === 1 ? 'día' : 'días' }}</span>
      <button type="button" class="link" @click="editando = !editando">{{ editando ? 'Listo' : 'Editar viaje' }}</button>
    </div>
    <div v-if="editando" class="edit">
      <div>
        <label for="ed-destino">Destino</label>
        <input id="ed-destino" v-model="viaje.destino" />
      </div>
      <div class="dos">
        <div>
          <label for="ed-ida">Ida</label>
          <input id="ed-ida" type="date" v-model="viaje.ida" :max="viaje.vuelta" />
        </div>
        <div>
          <label for="ed-vuelta">Regreso</label>
          <input id="ed-vuelta" type="date" v-model="viaje.vuelta" :min="viaje.ida" />
        </div>
      </div>
      <p class="hint" style="margin: 0">Si acortas el viaje, las pintas de los días que quedan por fuera se guardan por si vuelves a alargarlo.</p>
      <div class="row">
        <button v-if="!confirmar" type="button" class="link danger" @click="confirmar = true">Borrar este viaje</button>
        <template v-else>
          <span class="hint">¿Seguro? Se borran sus pintas y su maleta.</span>
          <button type="button" class="btn sm del-btn" @click="borrar">Sí, borrar</button>
          <button type="button" class="btn ghost sm" @click="confirmar = false">Cancelar</button>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.back {
  align-self: flex-start;
  border: 0;
  background: transparent;
  color: var(--lav);
  font-weight: 600;
  font-size: 13px;
  padding: 0;
}
.edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}
.edit label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
}
.edit input {
  width: 100%;
  min-width: 0;
  border: 1.5px solid var(--line);
  background: var(--surface);
  border-radius: 10px;
  padding: 8px 10px;
}
.dos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.danger {
  color: var(--warn);
  padding: 0;
}
.sm {
  padding: 6px 12px;
  font-size: 13px;
}
.del-btn {
  background: var(--warn);
}
.dos > div {
  min-width: 0;
}
</style>
