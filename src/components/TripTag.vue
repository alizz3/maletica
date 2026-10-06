<script setup>
import { ref, reactive, computed } from 'vue'
import { viaje, rango, dias, irAViajes, borrarViaje, setAloja } from '../store.js'

const abierto = ref(false)
const editandoViaje = ref(false)
const confirmar = ref(false)
const verMapa = ref(false)

function borrar() {
  const id = viaje.value.id
  irAViajes()
  borrarViaje(id)
}

// ----- Alojamiento -----
const aloja = computed(() => viaje.value.aloja || {})
const tieneAloja = computed(() => !!(aloja.value.nombre || aloja.value.direccion))
const editandoAloja = ref(false)
const form = reactive({ nombre: '', direccion: '', telefono: '', notas: '' })
function editarAloja() {
  Object.assign(form, { nombre: '', direccion: '', telefono: '', notas: '', ...aloja.value })
  editandoAloja.value = true
}
function guardarAloja() {
  ;['nombre', 'direccion', 'telefono', 'notas'].forEach((k) => setAloja(k, form[k].trim()))
  editandoAloja.value = false
  verMapa.value = false
}
function abrir() {
  abierto.value = !abierto.value
  if (abierto.value && !tieneAloja.value) editarAloja()
}

// Dirección + ciudad para buscar en el mapa
const consulta = computed(() => {
  const d = (aloja.value.direccion || aloja.value.nombre || '').trim()
  if (!d) return ''
  const ciudad = viaje.value.destino || ''
  return d.toLowerCase().includes(ciudad.toLowerCase()) ? d : d + ', ' + ciudad
})
const q = computed(() => encodeURIComponent(consulta.value))
const urlMapa = computed(() => 'https://www.google.com/maps?q=' + q.value + '&output=embed')
const urlRuta = computed(() => 'https://www.google.com/maps/dir/?api=1&destination=' + q.value)
const urlWaze = computed(() => 'https://waze.com/ul?q=' + q.value + '&navigate=yes')
const tel = computed(() => (aloja.value.telefono || '').replace(/[^\d+]/g, ''))
</script>

<template>
  <header class="tag" v-if="viaje">
    <button type="button" class="back" @click="irAViajes">← Mis viajes</button>

    <button type="button" class="tiquete" :aria-expanded="abierto" aria-controls="detalle-viaje" @click="abrir">
      <h1>{{ viaje.destino }}</h1>
      <span class="route">
        <span>{{ rango }}</span>
        <span>{{ dias.length }} {{ dias.length === 1 ? 'día' : 'días' }}</span>
      </span>
      <span v-if="tieneAloja" class="donde">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
        {{ aloja.nombre || aloja.direccion }}
      </span>
      <span class="ver">{{ abierto ? 'Cerrar detalles' : tieneAloja ? 'Ver alojamiento y detalles' : 'Agregar dónde te quedas' }} <span class="car" :class="{ up: abierto }" aria-hidden="true">▾</span></span>
    </button>

    <div v-if="abierto" id="detalle-viaje" class="detalle">
      <!-- Alojamiento -->
      <section class="bloque" aria-labelledby="t-aloja">
        <div class="bh">
          <h2 id="t-aloja">Dónde te quedas</h2>
          <button v-if="tieneAloja && !editandoAloja" type="button" class="link" @click="editarAloja">Editar</button>
        </div>

        <form v-if="editandoAloja" class="aloja-form" @submit.prevent="guardarAloja">
          <label for="al-nombre">Nombre del lugar</label>
          <input id="al-nombre" v-model="form.nombre" placeholder="Ej: Casa de la tía, Hotel Llanos" autocomplete="off" />
          <label for="al-dir">Dirección</label>
          <input id="al-dir" v-model="form.direccion" placeholder="Ej: Calle 15 # 40-20, barrio Barzal" autocomplete="street-address" />
          <label for="al-tel">Teléfono (opcional)</label>
          <input id="al-tel" v-model="form.telefono" type="tel" placeholder="Ej: 311 000 0000" autocomplete="off" />
          <label for="al-notas">Notas (opcional)</label>
          <textarea id="al-notas" v-model="form.notas" rows="2" placeholder="Check-in, apartamento, clave del wifi, a quién llamar…"></textarea>
          <div class="row">
            <button class="btn sm" type="submit">Guardar</button>
            <button v-if="tieneAloja" type="button" class="btn ghost sm" @click="editandoAloja = false">Cancelar</button>
          </div>
        </form>

        <template v-else-if="tieneAloja">
          <dl class="datos">
            <template v-if="aloja.nombre"><dt>Lugar</dt><dd>{{ aloja.nombre }}</dd></template>
            <template v-if="aloja.direccion"><dt>Dirección</dt><dd>{{ aloja.direccion }}</dd></template>
            <template v-if="aloja.telefono">
              <dt>Teléfono</dt>
              <dd><a :href="'tel:' + tel">{{ aloja.telefono }}</a></dd>
            </template>
            <template v-if="aloja.notas"><dt>Notas</dt><dd class="notas">{{ aloja.notas }}</dd></template>
          </dl>

          <div class="nav" v-if="consulta">
            <a class="btn sm" :href="urlRuta" target="_blank" rel="noopener">Cómo llegar · Google Maps</a>
            <a class="btn ghost sm" :href="urlWaze" target="_blank" rel="noopener">Abrir en Waze</a>
            <button type="button" class="btn ghost sm" @click="verMapa = !verMapa">{{ verMapa ? 'Ocultar mapa' : 'Ver mapa' }}</button>
          </div>
          <div v-if="verMapa" class="mapa">
            <iframe
              :src="urlMapa"
              :title="'Mapa de ' + (aloja.nombre || aloja.direccion)"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <p v-if="verMapa" class="hint" style="margin: 0; font-size: 11px">El mapa es de Google y solo se carga cuando tocas «Ver mapa».</p>
        </template>
      </section>

      <!-- Datos del viaje -->
      <section class="bloque">
        <div class="bh">
          <h2>Viaje</h2>
          <button type="button" class="link" @click="editandoViaje = !editandoViaje">{{ editandoViaje ? 'Listo' : 'Editar viaje' }}</button>
        </div>
        <div v-if="editandoViaje" class="edit">
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
          <p class="hint" style="margin: 0">Si acortas el viaje, los outfits de los días que quedan por fuera se guardan por si vuelves a alargarlo.</p>
          <div class="row">
            <button v-if="!confirmar" type="button" class="link danger" @click="confirmar = true">Borrar este viaje</button>
            <template v-else>
              <span class="hint">¿Seguro? Se borran sus outfits y su maleta.</span>
              <button type="button" class="btn sm del-btn" @click="borrar">Sí, borrar</button>
              <button type="button" class="btn ghost sm" @click="confirmar = false">Cancelar</button>
            </template>
          </div>
        </div>
      </section>
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
.tiquete {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  color: inherit;
  cursor: pointer;
}
.tiquete h1 {
  margin: 0;
}
.tiquete .route {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 13px;
  color: var(--muted);
}
.donde {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  max-width: 100%;
}
.donde svg {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
  fill: none;
  stroke: var(--pink);
  stroke-width: 2;
}
.ver {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--lav);
}
.car {
  display: inline-block;
  transition: transform 0.15s;
}
.car.up {
  transform: rotate(180deg);
}
@media (prefers-reduced-motion: reduce) {
  .car {
    transition: none;
  }
}
.detalle {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-top: 1.5px dashed var(--line);
  padding-top: 12px;
  margin-top: 4px;
}
.bloque {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bh {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bh h2 {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
}
.bh .link {
  padding: 0;
  font-size: 13px;
}
.aloja-form,
.edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.aloja-form label,
.edit label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}
.aloja-form input,
.aloja-form textarea,
.edit input {
  width: 100%;
  min-width: 0;
  border: 1.5px solid var(--line);
  background: var(--surface);
  border-radius: 10px;
  padding: 8px 10px;
  font: inherit;
  font-size: 15px;
}
.aloja-form textarea {
  resize: vertical;
}
.aloja-form .row {
  margin-top: 6px;
}
.datos {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 12px;
  margin: 0;
  font-size: 14px;
}
.datos dt {
  font-size: 12px;
  color: var(--muted);
  padding-top: 2px;
}
.datos dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
.datos .notas {
  white-space: pre-line;
}
.datos a {
  color: var(--lav);
  font-weight: 600;
}
.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.nav .btn {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.mapa {
  width: 100%;
  aspect-ratio: 4 / 3;
  max-width: 100%;
  border-radius: 14px;
  overflow: hidden;
  border: 1.5px solid var(--line);
  background: var(--lav-soft);
}
.mapa iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
.dos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.dos > div {
  min-width: 0;
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
</style>
