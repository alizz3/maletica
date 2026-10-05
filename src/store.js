// Estado global de la app. Se guarda en localStorage del navegador.
import { reactive, computed, watch } from 'vue'
import { CATS, GRUPOS, DIAS, semilla } from './data/semilla.js'

const KEY = 'maletica-v1'

function cargar() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return semilla()
}

export const s = reactive(cargar())

watch(
  s,
  () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s))
    } catch (e) {}
  },
  { deep: true }
)

// ---------- Viaje ----------
export const dias = computed(() => (s.regreso === 'jue' ? DIAS.slice(0, 4) : DIAS))
export const rango = computed(() => 'Lun 5 – ' + (s.regreso === 'jue' ? 'Jue 8' : 'Vie 9') + ' oct')

// ---------- Prendas y pintas ----------
const byId = (id) => s.prendas.find((p) => p.id === id)
export const pintaDe = (k) => (s.pintas[k] || []).map(byId).filter(Boolean)
export const prendasDe = (cat) => s.prendas.filter((p) => p.cat === cat)
export const basicosDe = (g) => s.basicos.filter((b) => b.grupo === g)

// Cuántos días se usa cada prenda
export const usos = computed(() => {
  const u = {}
  dias.value.forEach((d) => (s.pintas[d.key] || []).forEach((id) => (u[id] = (u[id] || 0) + 1)))
  return u
})

// Lo que llevas puesto el día de viaje no se empaca
export const puesto = computed(() => pintaDe('d0'))

export const ropaMaleta = computed(() => {
  const puestoIds = new Set(s.pintas.d0 || [])
  const set = new Set()
  dias.value.slice(1).forEach((d) =>
    (s.pintas[d.key] || []).forEach((id) => {
      if (!puestoIds.has(id)) set.add(id)
    })
  )
  return s.prendas.filter((p) => set.has(p.id))
})

export const seQueda = computed(() => s.prendas.filter((p) => !usos.value[p.id]))

export function togglePrenda(diaKey, id) {
  const arr = s.pintas[diaKey] || (s.pintas[diaKey] = [])
  const i = arr.indexOf(id)
  i >= 0 ? arr.splice(i, 1) : arr.push(id)
}

export function addPrenda(nombre, cat) {
  s.prendas.push({ id: 'p' + ++s.seq, nombre, cat })
}

export function delPrenda(id) {
  s.prendas = s.prendas.filter((p) => p.id !== id)
  Object.keys(s.pintas).forEach((k) => (s.pintas[k] = s.pintas[k].filter((x) => x !== id)))
}

// Quitar de la maleta = sacarla de las pintas de los días 2 en adelante
export function sacarDeMaleta(id) {
  Object.keys(s.pintas).forEach((k) => {
    if (k !== 'd0') s.pintas[k] = s.pintas[k].filter((x) => x !== id)
  })
}

// ---------- Básicos ----------
export function addBasico(nombre, grupo) {
  s.basicos.push({ id: 'b' + ++s.seq, nombre, grupo })
}

export function delBasico(id) {
  s.basicos = s.basicos.filter((b) => b.id !== id)
}

// ---------- Checks ----------
const keys = computed(() => [
  ...ropaMaleta.value.map((p) => 'p:' + p.id),
  ...s.basicos.map((b) => 'b:' + b.id)
])
export const total = computed(() => keys.value.length)
export const hechos = computed(() => keys.value.filter((k) => s.checks[s.fase][k]).length)
export const pct = computed(() => (total.value ? Math.round((hechos.value / total.value) * 100) : 0))
export const chk = (k) => !!s.checks[s.fase][k]
export const setChk = (k, v) => (s.checks[s.fase][k] = v)

export function textoLista() {
  let t = 'Maleta Villavicencio (' + rango.value + ')\n\nRopa:\n' + ropaMaleta.value.map((p) => '- ' + p.nombre).join('\n')
  GRUPOS.forEach((g) => {
    const l = basicosDe(g)
    if (l.length) t += '\n\n' + g + ':\n' + l.map((b) => '- ' + b.nombre).join('\n')
  })
  t += '\n\nPuesto: ' + puesto.value.map((p) => p.nombre).join(', ')
  return t
}

export { CATS, GRUPOS }
