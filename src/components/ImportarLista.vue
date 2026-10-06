<script setup>
// Pegar una lista (de notas, WhatsApp o ChatGPT) y pasarla a la maleta.
import { ref, computed } from 'vue'
import { SECCIONES, leerLista, importarLista } from '../store.js'

const emit = defineEmits(['cerrar', 'listo'])
const texto = ref('')
const leida = ref(null)
const empacado = ref(true)

function revisar() {
  leida.value = leerLista(texto.value)
}
const nuevas = computed(() => (leida.value ? leida.value.items.filter((i) => !i.existeId).length : 0))
function quitar(i) {
  leida.value.items.splice(i, 1)
}
function quitarComprar(i) {
  leida.value.comprar.splice(i, 1)
}
function agregar() {
  const r = importarLista(leida.value, empacado.value)
  let msg = r.total + (r.total === 1 ? ' cosa pasó' : ' cosas pasaron') + ' a la maleta'
  if (r.nuevas) msg += ' (' + r.nuevas + ' nuevas en tu armario)'
  if (r.comprar) msg += ' y ' + r.comprar + ' a Por comprar'
  emit('listo', msg)
}
</script>

<template>
  <div class="panel importar">
    <div class="ph">
      <h3>Importar una lista</h3>
      <button type="button" class="link" @click="emit('cerrar')">Cerrar</button>
    </div>

    <template v-if="!leida">
      <p class="hint" style="margin: 0">
        Pega tu lista, una cosa por línea. Si escribes <b>Por comprar:</b>, lo que va debajo queda como pendiente de compra.
      </p>
      <textarea
        id="importar-texto"
        v-model="texto"
        rows="9"
        placeholder="Celular&#10;Cargador del celular&#10;Cepillo de dientes&#10;…&#10;&#10;Por comprar:&#10;Desmaquillante"
        aria-label="Lista para importar"
      ></textarea>
      <button type="button" class="btn" :disabled="!texto.trim()" @click="revisar">Revisar lista</button>
    </template>

    <template v-else>
      <p class="hint" style="margin: 0">
        Revisa la categoría de cada cosa. Lo que ya existe en tu armario no se duplica.
      </p>
      <ul class="filas">
        <li v-for="(it, i) in leida.items" :key="i">
          <input class="nom" :id="'imp-n-' + i" v-model="it.nombre" :aria-label="'Nombre ' + (i + 1)" />
          <label class="cant" :for="'imp-q-' + i">×<input :id="'imp-q-' + i" type="number" min="1" max="99" v-model.number="it.cant" :aria-label="'Cantidad de ' + it.nombre" /></label>
          <span v-if="it.existeId" class="ya">ya en tu armario</span>
          <select v-else class="cat" :id="'imp-c-' + i" v-model="it.cat" :aria-label="'Categoría de ' + it.nombre">
            <optgroup v-for="s in SECCIONES" :key="s.titulo" :label="s.titulo">
              <option v-for="c in s.cats" :key="c">{{ c }}</option>
            </optgroup>
          </select>
          <button type="button" class="del" :aria-label="'No importar ' + it.nombre" @click="quitar(i)">×</button>
        </li>
      </ul>

      <template v-if="leida.comprar.length">
        <h4>Por comprar</h4>
        <ul class="filas">
          <li v-for="(n, i) in leida.comprar" :key="'c' + i">
            <input class="nom" :id="'imp-cp-' + i" v-model="leida.comprar[i]" :aria-label="'Por comprar ' + (i + 1)" />
            <button type="button" class="del" :aria-label="'No importar ' + n" @click="quitarComprar(i)">×</button>
          </li>
        </ul>
      </template>

      <label class="toggle" for="imp-empacado">
        <input id="imp-empacado" type="checkbox" v-model="empacado" />
        Ya está todo empacado (marcarlo con ✓)
      </label>
      <div class="row">
        <button type="button" class="btn" :disabled="!leida.items.length && !leida.comprar.length" @click="agregar">
          Agregar {{ leida.items.length }} a la maleta
        </button>
        <button type="button" class="btn ghost" @click="leida = null">Volver a editar</button>
      </div>
      <p class="hint" style="margin: 0; font-size: 12px" v-if="nuevas">{{ nuevas }} {{ nuevas === 1 ? 'es nueva y queda' : 'son nuevas y quedan' }} también en tu armario.</p>
    </template>
  </div>
</template>

<style scoped>
.importar {
  border-color: var(--lav);
}
.ph {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ph .link {
  padding: 0;
}
textarea {
  width: 100%;
  min-width: 0;
  border: 1.5px solid var(--line);
  background: var(--bg);
  border-radius: 12px;
  padding: 10px 12px;
  font: inherit;
  font-size: 14px;
  resize: vertical;
}
textarea:focus {
  border-color: var(--lav);
  outline: none;
}
.btn:disabled {
  opacity: 0.5;
  cursor: default;
}
h4 {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--pink);
}
.filas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.filas li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--line);
}
.nom {
  flex: 1 1 160px;
  min-width: 0;
  border: 1.5px solid transparent;
  background: transparent;
  border-radius: 8px;
  padding: 4px 6px;
  margin-left: -6px;
  font-size: 14px;
}
.nom:focus {
  border-color: var(--lav);
  background: var(--surface);
  outline: none;
}
.cat {
  border: 0;
  background: var(--lav-soft);
  color: var(--lav);
  border-radius: 999px;
  padding: 3px 6px;
  font-size: 11px;
  font-weight: 600;
  max-width: 140px;
}
.cant {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--muted);
}
.cant input {
  width: 42px;
  border: 1.5px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  padding: 2px 4px;
  font-size: 12px;
  text-align: center;
}
.ya {
  font-size: 11px;
  color: var(--ok);
  font-weight: 600;
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}
.toggle input {
  accent-color: var(--lav);
}
</style>
