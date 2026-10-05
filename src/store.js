// Estado global de Maletica. Se guarda en este navegador y, si inicias sesión, en tu cuenta.
import { reactive, computed, watch } from 'vue'
import { CATS, GRUPOS, normalizar } from './data/semilla.js'

const KEY = 'maletica-v2'
const KEY_V1 = 'maletica-v1'

function cargar() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return normalizar(JSON.parse(raw))
    const v1 = localStorage.getItem(KEY_V1)
    if (v1) return normalizar(JSON.parse(v1))
  } catch (e) {}
  return normalizar(null)
}

export const s = reactive(cargar())

// Reemplaza todo el estado (por ejemplo, al traer los datos de la nube)
export function reemplazar(data) {
  const n = normalizar(data)
  Object.keys(s).forEach((k) => delete s[k])
  Object.assign(s, n)
}

watch(
  s,
  () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s))
    } catch (e) {}
  },
  { deep: true }
)

// ---------- Navegación (no se guarda) ----------
export const ui = reactive({ pantalla: 'viajes', viajeId: null, tab: 'pintas', sinCuenta: false })

export function abrirViaje(id) {
  ui.viajeId = id
  ui.tab = 'pintas'
  ui.pantalla = 'viaje'
}
export function irAViajes() {
  ui.pantalla = 'viajes'
  ui.viajeId = null
}

export const viaje = computed(() => s.viajes.find((v) => v.id === ui.viajeId) || null)

// ---------- Fechas ----------
const DIAS_C = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DIAS_L = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const aFecha = (iso) => new Date(iso + 'T12:00:00Z')
const aISO = (d) => d.toISOString().slice(0, 10)

export function listaDias(v) {
  if (!v || !v.ida || !v.vuelta) return []
  const out = []
  const d = aFecha(v.ida)
  const fin = aFecha(v.vuelta)
  while (d <= fin && out.length < 31) {
    const w = d.getUTCDay()
    out.push({ key: aISO(d), corto: DIAS_C[w], num: d.getUTCDate(), largo: DIAS_L[w] + ' ' + d.getUTCDate() })
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

export function rangoTexto(v) {
  if (!v) return ''
  const a = aFecha(v.ida)
  const b = aFecha(v.vuelta)
  const fa = DIAS_C[a.getUTCDay()] + ' ' + a.getUTCDate()
  const fb = DIAS_C[b.getUTCDay()] + ' ' + b.getUTCDate() + ' ' + MESES[b.getUTCMonth()]
  return (a.getUTCMonth() === b.getUTCMonth() ? fa : fa + ' ' + MESES[a.getUTCMonth()]) + ' – ' + fb
}

export const dias = computed(() => listaDias(viaje.value))
export const rango = computed(() => rangoTexto(viaje.value))

// ---------- Viajes ----------
export function crearViaje({ destino, ida, vuelta }) {
  const id = 'v' + ++s.seq
  s.viajes.unshift({
    id,
    destino,
    ida,
    vuelta,
    pintas: {},
    basicos: JSON.parse(JSON.stringify(s.plantilla)),
    checks: { ida: {}, vuelta: {} },
    fase: 'ida'
  })
  return id
}

export function borrarViaje(id) {
  s.viajes = s.viajes.filter((v) => v.id !== id)
}

// Resumen para la lista de viajes
export function resumenViaje(v) {
  const ds = listaDias(v)
  const puestoIds = new Set((ds[0] && v.pintas[ds[0].key]) || [])
  const ropa = new Set()
  ds.slice(1).forEach((d) => (v.pintas[d.key] || []).forEach((id) => !puestoIds.has(id) && ropa.add(id)))
  const ks = [...[...ropa].map((id) => 'p:' + id), ...v.basicos.map((b) => 'b:' + b.id)]
  const listos = ks.filter((k) => v.checks.ida[k]).length
  const conPinta = ds.filter((d) => (v.pintas[d.key] || []).length).length
  return { dias: ds.length, conPinta, listos, total: ks.length }
}

// ---------- Prendas y pintas ----------
const byId = (id) => s.prendas.find((p) => p.id === id)
export const pintaDe = (fecha) => ((viaje.value && viaje.value.pintas[fecha]) || []).map(byId).filter(Boolean)
export const prendasDe = (cat) => s.prendas.filter((p) => p.cat === cat)
export const basicosDe = (g) => (viaje.value ? viaje.value.basicos.filter((b) => b.grupo === g) : [])

export const usos = computed(() => {
  const u = {}
  if (!viaje.value) return u
  dias.value.forEach((d) => (viaje.value.pintas[d.key] || []).forEach((id) => (u[id] = (u[id] || 0) + 1)))
  return u
})

// Lo que llevas puesto el día de ida no se empaca
export const puesto = computed(() => (dias.value[0] ? pintaDe(dias.value[0].key) : []))

export const ropaMaleta = computed(() => {
  if (!viaje.value || !dias.value.length) return []
  const puestoIds = new Set(viaje.value.pintas[dias.value[0].key] || [])
  const set = new Set()
  dias.value.slice(1).forEach((d) =>
    (viaje.value.pintas[d.key] || []).forEach((id) => {
      if (!puestoIds.has(id)) set.add(id)
    })
  )
  return s.prendas.filter((p) => set.has(p.id))
})

export const seQueda = computed(() => s.prendas.filter((p) => !usos.value[p.id]))

export function togglePrenda(fecha, id) {
  const v = viaje.value
  const arr = v.pintas[fecha] || (v.pintas[fecha] = [])
  const i = arr.indexOf(id)
  i >= 0 ? arr.splice(i, 1) : arr.push(id)
}

export function addPrenda(nombre, cat) {
  const id = 'p' + ++s.seq
  s.prendas.push({ id, nombre, cat })
  return id
}

export function renombrarPrenda(id, nombre) {
  const p = byId(id)
  if (p && nombre.trim()) p.nombre = nombre.trim()
}

export function delPrenda(id) {
  s.prendas = s.prendas.filter((p) => p.id !== id)
  s.viajes.forEach((v) => Object.keys(v.pintas).forEach((k) => (v.pintas[k] = v.pintas[k].filter((x) => x !== id))))
}

// Quitar de la maleta = sacarla de las pintas desde el segundo día
export function sacarDeMaleta(id) {
  const v = viaje.value
  const primer = dias.value[0] && dias.value[0].key
  Object.keys(v.pintas).forEach((k) => {
    if (k !== primer) v.pintas[k] = v.pintas[k].filter((x) => x !== id)
  })
}

// ---------- Básicos del viaje ----------
export function addBasico(nombre, grupo) {
  viaje.value.basicos.push({ id: 'b' + ++s.seq, nombre, grupo })
}
export function delBasico(id) {
  viaje.value.basicos = viaje.value.basicos.filter((b) => b.id !== id)
}

// ---------- Checks ----------
const keys = computed(() =>
  viaje.value ? [...ropaMaleta.value.map((p) => 'p:' + p.id), ...viaje.value.basicos.map((b) => 'b:' + b.id)] : []
)
export const total = computed(() => keys.value.length)
export const hechos = computed(() => (viaje.value ? keys.value.filter((k) => viaje.value.checks[viaje.value.fase][k]).length : 0))
export const pct = computed(() => (total.value ? Math.round((hechos.value / total.value) * 100) : 0))
export const chk = (k) => !!viaje.value.checks[viaje.value.fase][k]
export const setChk = (k, val) => (viaje.value.checks[viaje.value.fase][k] = val)

export function textoLista() {
  const v = viaje.value
  let t = 'Maleta ' + v.destino + ' (' + rango.value + ')\n\nRopa:\n' + ropaMaleta.value.map((p) => '- ' + p.nombre).join('\n')
  GRUPOS.forEach((g) => {
    const l = basicosDe(g)
    if (l.length) t += '\n\n' + g + ':\n' + l.map((b) => '- ' + b.nombre).join('\n')
  })
  t += '\n\nPuesto: ' + puesto.value.map((p) => p.nombre).join(', ')
  return t
}

export { CATS, GRUPOS }
