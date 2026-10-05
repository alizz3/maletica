// Estado global de Maletica. Se guarda en este navegador y, si inicias sesión, en tu cuenta.
import { reactive, computed, watch } from 'vue'
import { CATS, CATS_PINTA, CATS_SUELTAS, GRUPOS, ACTIVIDADES, normalizar, reglaPorNombre, catDeBasico } from './data/semilla.js'

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
    llevo: [],
    info: { [ida]: { actividad: 'Viaje' }, ...(vuelta !== ida ? { [vuelta]: { actividad: 'Regreso' } } : {}) },
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
  ;(v.llevo || []).forEach((id) => !puestoIds.has(id) && ropa.add(id))
  const ks = [...[...ropa].map((id) => 'p:' + id), ...v.basicos.filter((b) => !reemplazado(b, v)).map((b) => 'b:' + b.id)]
  const listos = ks.filter((k) => v.checks.ida[k]).length
  const conPinta = ds.filter((d) => (v.pintas[d.key] || []).length).length
  return { dias: ds.length, conPinta, listos, total: ks.length }
}

// ---------- Prendas y pintas ----------
const byId = (id) => s.prendas.find((p) => p.id === id)
export const pintaDe = (fecha) => ((viaje.value && viaje.value.pintas[fecha]) || []).map(byId).filter(Boolean)
export const prendasDe = (cat) => s.prendas.filter((p) => p.cat === cat)
export const basicosDe = (g) => (viaje.value ? viaje.value.basicos.filter((b) => b.grupo === g && !reemplazado(b, viaje.value)) : [])

// ---------- Ropa interior y medias (piezas sueltas) ----------
// El básico genérico "Ropa interior" / "Medias" se oculta cuando ya elegiste piezas concretas
function reemplazado(b, v) {
  const cat = b.regla === 'dias+1' ? catDeBasico(b.nombre) : null
  if (!cat) return false
  const ids = [...(v.llevo || []), ...Object.values(v.pintas).flat()]
  return ids.some((id) => s.prendas.find((p) => p.id === id && p.cat === cat))
}
// Piezas que van en la maleta: las de las pintas (sin lo puesto) + las de repuesto
export const piezasMaleta = (cat) => {
  if (!viaje.value) return []
  const puestoIds = new Set(puesto.value.map((p) => p.id))
  const ids = new Set([...ropaPintas.value.map((p) => p.id), ...(viaje.value.llevo || [])])
  return s.prendas.filter((p) => p.cat === cat && ids.has(p.id) && !puestoIds.has(p.id))
}
export const piezasPuestas = (cat) => puesto.value.filter((p) => p.cat === cat)
export const llevoDe = (cat) => piezasMaleta(cat)
export const esDeRepuesto = (id) => !!viaje.value && (viaje.value.llevo || []).includes(id)
// Días (sin contar la ida) en que una pieza está en la pinta
export const diasDePieza = (id) =>
  dias.value.slice(1).filter((d) => (viaje.value.pintas[d.key] || []).includes(id)).map((d) => d.corto + ' ' + d.num)
export const llevaPieza = (id) => esDeRepuesto(id) || diasDePieza(id).length > 0
export function toggleLlevo(id) {
  const v = viaje.value
  if (!v.llevo) v.llevo = []
  const i = v.llevo.indexOf(id)
  i >= 0 ? v.llevo.splice(i, 1) : v.llevo.push(id)
}
export const recomendado = () => dias.value.length + 1

export const usos = computed(() => {
  const u = {}
  if (!viaje.value) return u
  dias.value.forEach((d) => (viaje.value.pintas[d.key] || []).forEach((id) => (u[id] = (u[id] || 0) + 1)))
  return u
})

// Lo que llevas puesto el día de ida no se empaca
export const puesto = computed(() => (dias.value[0] ? pintaDe(dias.value[0].key) : []))

// Toda la ropa de las pintas que hay que empacar (lo puesto el día de ida no se empaca)
export const ropaPintas = computed(() => {
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
// Ropa de pintas sin ropa interior ni medias (esas tienen su propia sección)
export const ropaMaleta = computed(() => ropaPintas.value.filter((p) => CATS_PINTA.includes(p.cat)))

export const seQueda = computed(() => s.prendas.filter((p) => CATS_PINTA.includes(p.cat) && !usos.value[p.id]))

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
  s.viajes.forEach((v) => {
    Object.keys(v.pintas).forEach((k) => (v.pintas[k] = v.pintas[k].filter((x) => x !== id)))
    if (v.llevo) v.llevo = v.llevo.filter((x) => x !== id)
  })
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
  viaje.value.basicos.push({ id: 'b' + ++s.seq, nombre, grupo, regla: reglaPorNombre(nombre) })
}

// Cuántas unidades llevar según los días (ropa interior, medias, pijama)
export function cantidad(b, numDias = dias.value.length) {
  if (b.regla === 'dias+1') return numDias + 1
  if (b.regla === 'noches/4') return Math.max(1, Math.ceil((numDias - 1) / 4))
  return null
}

// ---------- Actividad y notas por día ----------
export function infoDia(fecha) {
  return (viaje.value.info && viaje.value.info[fecha]) || {}
}
export function setInfo(fecha, campo, valor) {
  const v = viaje.value
  if (!v.info) v.info = {}
  if (!v.info[fecha]) v.info[fecha] = {}
  v.info[fecha][campo] = valor
}
export function delBasico(id) {
  viaje.value.basicos = viaje.value.basicos.filter((b) => b.id !== id)
}

// ---------- Checks ----------
const keys = computed(() =>
  viaje.value
    ? [
        ...ropaMaleta.value.map((p) => 'p:' + p.id),
        ...CATS_SUELTAS.flatMap((cat) => piezasMaleta(cat)).map((p) => 'p:' + p.id),
        ...viaje.value.basicos.filter((b) => !reemplazado(b, viaje.value)).map((b) => 'b:' + b.id)
      ]
    : []
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
    if (l.length) t += '\n\n' + g + ':\n' + l.map((b) => '- ' + b.nombre + (cantidad(b) ? ' ×' + cantidad(b) : '')).join('\n')
  })
  CATS_SUELTAS.forEach((cat) => {
    const l = llevoDe(cat)
    if (l.length) t += '\n\n' + cat + ':\n' + l.map((p) => '- ' + p.nombre).join('\n')
  })
  t += '\n\nPuesto: ' + puesto.value.map((p) => p.nombre).join(', ')
  return t
}

// ---------- Avisos inteligentes ----------
export const avisos = computed(() => {
  const v = viaje.value
  if (!v) return []
  const out = []

  // Días sin pinta
  const sinPinta = dias.value.filter((d) => !(v.pintas[d.key] || []).length)
  if (sinPinta.length)
    out.push({ tipo: 'falta', texto: 'Falta la pinta de ' + sinPinta.map((d) => d.corto + ' ' + d.num).join(', ') + '.' })

  // Empacaste algo que ya no está en ninguna pinta (cambiaste un outfit)
  const enUso = new Set([...ropaPintas.value.map((p) => p.id), ...puesto.value.map((p) => p.id), ...(v.llevo || [])])
  const huerfanas = Object.keys(v.checks.ida)
    .filter((k) => k.startsWith('p:') && v.checks.ida[k] && !enUso.has(k.slice(2)))
    .map((k) => s.prendas.find((p) => p.id === k.slice(2)))
    .filter(Boolean)
  huerfanas.forEach((p) =>
    out.push({ tipo: 'sobra', texto: p.nombre + ' ya no está en ninguna pinta. ¿La sacas de la maleta?', id: p.id })
  )

  // Prendas que ocupan espacio y se usan un solo día
  const pesadas = ropaMaleta.value.filter((p) => ['Abajo', 'Zapatos', 'Abrigo'].includes(p.cat) && usos.value[p.id] === 1)
  if (pesadas.length)
    out.push({
      tipo: 'exceso',
      texto: pesadas.length === 1
        ? pesadas[0].nombre + ' se usa un solo día. Si la cambias por algo que ya llevas, ahorras espacio.'
        : pesadas.map((p) => p.nombre).join(', ') + ' se usan un solo día. Si las cambias por algo que ya llevas, ahorras espacio.'
    })

  // Pocas piezas de ropa interior o medias para los días del viaje
  CATS_SUELTAS.forEach((cat) => {
    const n = llevoDe(cat).length + piezasPuestas(cat).length
    const r = recomendado()
    const unidad = cat === 'Medias' ? (n === 1 ? 'par de medias' : 'pares de medias') : n === 1 ? 'pieza de ropa interior' : 'piezas de ropa interior'
    if (n > 0 && n < r)
      out.push({ tipo: 'falta', texto: 'Llevas ' + n + ' ' + unidad + '; para ' + dias.value.length + ' días se recomiendan ' + r + '.' })
  })

  // Lo que más reusas (buena señal)
  const reuso = ropaMaleta.value
    .concat(puesto.value)
    .filter((p, i, a) => a.indexOf(p) === i && ['Abajo', 'Zapatos'].includes(p.cat) && usos.value[p.id] >= 3)
  reuso.forEach((p) => out.push({ tipo: 'bien', texto: p.nombre + ' sale en ' + usos.value[p.id] + ' pintas. Con eso basta.' }))

  return out
})

export function descartarHuerfana(id) {
  const v = viaje.value
  delete v.checks.ida['p:' + id]
  delete v.checks.vuelta['p:' + id]
}

// Progreso de un grupo de la maleta
export function progresoGrupo(items, prefijo) {
  const v = viaje.value
  const listos = items.filter((x) => v.checks[v.fase][prefijo + x.id]).length
  return { listos, total: items.length }
}

export { CATS, CATS_PINTA, CATS_SUELTAS, GRUPOS, ACTIVIDADES }
