// Estado global de Maletica. Se guarda en este navegador y, si inicias sesión, en tu cuenta.
//
// La idea:
//   ARMARIO  → todo lo que tienes (ropa y cosas)
//   MALETA   → lo que TÚ eliges del armario para este viaje (empieza vacía)
//   PINTAS   → qué te pones cada día; elegir algo para un día también lo mete a la maleta
//   REGRESO  → todo lo que viajó (maleta + lo puesto) para que no se quede nada
import { reactive, computed, watch } from 'vue'
import {
  CATS, CATS_PINTA, CATS_ROPA, CATS_COSAS, CATS_SUELTAS, ACTIVIDADES, SECCIONES, normalizar, viajeNuevo, adivinarCat
} from './data/semilla.js'

// Orden alfabético (ignora mayúsculas y tildes)
export const alfa = (a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base', numeric: true })
// Texto sin tildes ni mayúsculas, para buscar
export const plano = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

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
export const ui = reactive({ pantalla: 'viajes', viajeId: null, tab: 'pintas', sinCuenta: false, balance: false })

export function abrirViaje(id, { balance = false } = {}) {
  ui.viajeId = id
  ui.tab = balance ? 'maleta' : 'pintas'
  ui.balance = balance
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
  s.viajes.unshift(viajeNuevo(id, destino, ida, vuelta))
  return id
}

export function borrarViaje(id) {
  s.viajes = s.viajes.filter((v) => v.id !== id)
}

// Resumen para la lista de viajes
export function resumenViaje(v) {
  const ds = listaDias(v)
  const puestoIds = new Set((ds[0] && v.pintas[ds[0].key]) || [])
  const enMaleta = (v.llevo || []).filter((id) => !puestoIds.has(id))
  const listos = enMaleta.filter((id) => v.checks.ida['p:' + id]).length
  const conPinta = ds.filter((d) => (v.pintas[d.key] || []).length).length
  return { dias: ds.length, conPinta, listos, total: enMaleta.length }
}

// ---------- Armario ----------
const byId = (id) => s.prendas.find((p) => p.id === id)
export const prendasDe = (cat) => s.prendas.filter((p) => p.cat === cat).sort(alfa)
export const pintaDe = (fecha) => ((viaje.value && viaje.value.pintas[fecha]) || []).map(byId).filter(Boolean)

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
    v.llevo = (v.llevo || []).filter((x) => x !== id)
  })
}

// ---------- Pintas ----------
// Lo que llevas puesto el día de ida (no va en la maleta, pero sí vuelve)
export const puesto = computed(() => (dias.value[0] ? pintaDe(dias.value[0].key) : []))
const puestoIds = computed(() => new Set(puesto.value.map((p) => p.id)))
export const esPuesta = (id) => puestoIds.value.has(id)

export const usos = computed(() => {
  const u = {}
  if (!viaje.value) return u
  dias.value.forEach((d) => (viaje.value.pintas[d.key] || []).forEach((id) => (u[id] = (u[id] || 0) + 1)))
  return u
})

// Días (sin contar la ida) en que una prenda está en la pinta
export const diasDePieza = (id) =>
  viaje.value ? dias.value.slice(1).filter((d) => (viaje.value.pintas[d.key] || []).includes(id)).map((d) => d.corto + ' ' + d.num) : []

export function togglePrenda(fecha, id) {
  const v = viaje.value
  const arr = v.pintas[fecha] || (v.pintas[fecha] = [])
  const i = arr.indexOf(id)
  if (i >= 0) {
    arr.splice(i, 1)
  } else {
    arr.push(id)
    // Si la eliges para un día (que no sea la ida), también va en la maleta
    const primer = dias.value[0] && dias.value[0].key
    if (fecha !== primer) meterEnMaleta(id)
  }
}

// ---------- Maleta (lo que eliges) ----------
export const enMaleta = (id) => !!viaje.value && (viaje.value.llevo || []).includes(id)

export function meterEnMaleta(id) {
  const v = viaje.value
  if (!v.llevo) v.llevo = []
  if (!v.llevo.includes(id)) v.llevo.push(id)
}
export function sacarDeMaleta(id) {
  const v = viaje.value
  v.llevo = (v.llevo || []).filter((x) => x !== id)
  if (v.cant) delete v.cant[id]
}
export function toggleMaleta(id) {
  enMaleta(id) ? sacarDeMaleta(id) : meterEnMaleta(id)
}

// Cantidad de una cosa en la maleta (ej. 3 brillos)
export const cantidad = (id) => (viaje.value?.cant?.[id]) || 1
export function setCantidad(id, n) {
  const v = viaje.value
  if (!v.cant) v.cant = {}
  n = Math.max(1, Math.min(99, Math.round(n) || 1))
  if (n === 1) delete v.cant[id]
  else v.cant[id] = n
}

// Lo que va en la maleta para empacar (sin lo que llevas puesto)
export const maleta = computed(() => {
  if (!viaje.value) return []
  const ids = new Set(viaje.value.llevo || [])
  return s.prendas.filter((p) => ids.has(p.id) && !puestoIds.value.has(p.id)).sort(alfa)
})
export const maletaDe = (cat) => maleta.value.filter((p) => p.cat === cat)

// Prendas que están en alguna pinta pero no las has metido a la maleta
export const pintasSinMaleta = computed(() => {
  if (!viaje.value) return []
  const ids = new Set()
  dias.value.slice(1).forEach((d) => (viaje.value.pintas[d.key] || []).forEach((id) => ids.add(id)))
  return s.prendas.filter((p) => ids.has(p.id) && !enMaleta(p.id) && !puestoIds.value.has(p.id))
})
export function llevarTodasLasDePintas() {
  pintasSinMaleta.value.forEach((p) => meterEnMaleta(p.id))
}

export const recomendado = () => dias.value.length + 1

// ---------- Regreso ----------
export const REVISAR = [
  'Cargadores conectados en la pared',
  'Baño: cepillo, cremas y maquillaje',
  'Debajo de la cama y detrás de la puerta',
  'Ropa colgada o en el tendedero',
  'Cajones y clóset',
  'Mesa de noche (audífonos, gafas, celular)',
  'Nevera, si guardaste algo',
  'Cédula, plata y llaves a la mano'
]

// Lo que te pones el día que vuelves
export const ropaParaVolver = computed(() => {
  const ult = dias.value[dias.value.length - 1]
  return ult && dias.value.length > 1 ? pintaDe(ult.key) : []
})

// Todo lo que viajó (maleta + lo puesto en la ida) menos lo que te pones para volver
export const regreso = computed(() => {
  if (!viaje.value) return []
  const vuelve = new Set(ropaParaVolver.value.map((p) => p.id))
  const ids = new Set([...(viaje.value.llevo || []), ...puestoIds.value])
  return s.prendas.filter((p) => ids.has(p.id) && !vuelve.has(p.id)).sort(alfa)
})

// ---------- Checks ----------
const keys = computed(() => {
  const v = viaje.value
  if (!v) return []
  if (v.fase === 'vuelta') return [...regreso.value.map((p) => 'p:' + p.id), ...REVISAR.map((_, i) => 'r:' + i)]
  return maleta.value.map((p) => 'p:' + p.id)
})
export const total = computed(() => keys.value.length)
export const hechos = computed(() => (viaje.value ? keys.value.filter((k) => viaje.value.checks[viaje.value.fase][k]).length : 0))
export const pct = computed(() => (total.value ? Math.round((hechos.value / total.value) * 100) : 0))
// Marca o desmarca todo lo de la lista actual (ida o regreso)
export function marcarTodo(valor) {
  const v = viaje.value
  keys.value.forEach((k) => {
    if (valor) v.checks[v.fase][k] = true
    else delete v.checks[v.fase][k]
  })
}
export const chk = (k) => !!viaje.value.checks[viaje.value.fase][k]
export const setChk = (k, val) => (viaje.value.checks[viaje.value.fase][k] = val)
export const listosDe = (items, pref = 'p:') => items.filter((x) => chk(pref + x.id)).length

// ---------- Actividad y notas por día ----------
export function infoDia(fecha) {
  return (viaje.value.info && viaje.value.info[fecha]) || {}
}
export function actividadesDe(fecha) {
  return infoDia(fecha).actividades || []
}
export function toggleActividad(fecha, a) {
  const actual = actividadesDe(fecha)
  setInfo(fecha, 'actividades', actual.includes(a) ? actual.filter((x) => x !== a) : [...actual, a])
}
export function setInfo(fecha, campo, valor) {
  const v = viaje.value
  if (!v.info) v.info = {}
  if (!v.info[fecha]) v.info[fecha] = {}
  v.info[fecha][campo] = valor
}

// ---------- Avisos ----------
export const avisos = computed(() => {
  const v = viaje.value
  if (!v) return []
  const out = []

  if (pintasSinMaleta.value.length)
    out.push({
      tipo: 'pintas',
      texto: 'Está en tus outfits pero no en la maleta: ' + pintasSinMaleta.value.map((p) => p.nombre).join(', ') + '.'
    })

  const sinPinta = dias.value.filter((d) => !(v.pintas[d.key] || []).length)
  if (sinPinta.length && sinPinta.length < dias.value.length)
    out.push({ tipo: 'falta', texto: 'Falta el outfit de ' + sinPinta.map((d) => d.corto + ' ' + d.num).join(', ') + '.' })

  CATS_SUELTAS.forEach((cat) => {
    const n = maletaDe(cat).length + puesto.value.filter((p) => p.cat === cat).length
    const r = recomendado()
    const unidad = cat === 'Medias' ? (n === 1 ? 'par de medias' : 'pares de medias') : n === 1 ? 'pieza de ropa interior' : 'piezas de ropa interior'
    if (n > 0 && n < r) out.push({ tipo: 'falta', texto: 'Llevas ' + n + ' ' + unidad + '; para ' + dias.value.length + ' días se recomiendan ' + r + '.' })
  })

  const pesadas = maleta.value.filter((p) => ['Abajo', 'Zapatos', 'Abrigo'].includes(p.cat) && usos.value[p.id] === 1)
  if (pesadas.length)
    out.push({
      tipo: 'exceso',
      texto: pesadas.length === 1
        ? pesadas[0].nombre + ' se usa un solo día. Si la cambias por algo que ya llevas, ahorras espacio.'
        : pesadas.map((p) => p.nombre).join(', ') + ' se usan un solo día. Si las cambias por algo que ya llevas, ahorras espacio.'
    })

  return out
})

// ---------- Sugerir outfits con lo que hay en la maleta ----------
// Llena solo los días vacíos (nunca borra lo que ya armaste) y no toca el día de ida.
// Tops rotan, bottoms y zapatos se repiten (incluye lo que llevas puesto),
// ropa interior y medias: una distinta por día mientras alcancen.
export const diasSinOutfit = computed(() =>
  viaje.value ? dias.value.slice(1).filter((d) => !(viaje.value.pintas[d.key] || []).length) : []
)
export function sugerirOutfits() {
  const v = viaje.value
  if (!v) return 0
  const deMaleta = (cat) => maletaDe(cat)
  const conPuesto = (cat) => [...puesto.value.filter((p) => p.cat === cat), ...maletaDe(cat)]
  const pools = {
    Arriba: { items: deMaleta('Arriba'), repite: true },
    Abajo: { items: conPuesto('Abajo'), repite: true },
    Zapatos: { items: conPuesto('Zapatos'), repite: true },
    'Ropa interior': { items: deMaleta('Ropa interior'), repite: false },
    Medias: { items: deMaleta('Medias'), repite: false }
  }
  // Empieza después de lo que ya usaste en otros días, para no repetir de entrada
  const usado = new Set(Object.values(v.pintas).flat())
  Object.values(pools).forEach((pl) => {
    pl.items = [...pl.items.filter((p) => !usado.has(p.id)), ...pl.items.filter((p) => usado.has(p.id))]
    pl.i = 0
  })
  const ultimo = dias.value[dias.value.length - 1]
  let armados = 0
  diasSinOutfit.value.forEach((d) => {
    // El día de regreso, si no hay nada, repite lo que llevabas puesto en la ida
    if (d === ultimo && puesto.value.length && dias.value.length > 2) {
      v.pintas[d.key] = puesto.value.map((p) => p.id)
      armados++
      return
    }
    const ids = []
    Object.values(pools).forEach((pl) => {
      if (!pl.items.length) return
      if (!pl.repite && pl.i >= pl.items.length) return
      ids.push(pl.items[pl.i % pl.items.length].id)
      pl.i++
    })
    if (ids.length) {
      v.pintas[d.key] = ids
      armados++
    }
  })
  return armados
}

// ---------- Importar una lista escrita o dictada ----------
// Acepta viñetas, numeración y encabezados ("Aseo:", "Por comprar:").
// "Blusa naranja → maleta de mamá" queda como "Blusa naranja (en la maleta de mamá)".
export function leerLista(texto) {
  const items = []
  const comprar = []
  let catHeader = null
  let enComprar = false
  ;(texto || '').split(/\r?\n/).forEach((linea) => {
    let t = linea
      .replace(/^[\s>*•·\-–—]+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .replace(/^\[[ xX✓]?\]\s*/, '')
      .replace(/^[\u2600-\u27BF\u{1F300}-\u{1FAFF}\uFE0F]+\s*/u, '')
      .trim()
    if (!t) return
    // Encabezado: "Por comprar:", "Aseo:", "👚 Ropa"
    const head = t.match(/^(.+?):$/)
    if (head || /^(pendientes|por comprar|comprar)\b/i.test(t)) {
      const h = plano(head ? head[1] : t)
      enComprar = /comprar|pendiente/.test(h)
      catHeader = enComprar ? null : CATS.find((c) => plano(c).startsWith(h) || h.startsWith(plano(c))) || null
      if (head || enComprar) return
    }
    t = t.replace(/\s*(→|->|=>)\s*(.+)$/, (_, __, donde) => ' (en la ' + donde.replace(/^(en\s+)?(la\s+)?/i, '') + ')')
    if (enComprar) {
      comprar.push(t)
      return
    }
    // "3 brillos" → Brillos ×3
    let cant = 1
    const num = t.match(/^(\d{1,2})\s*(x\s+)?(?!\d)([^\d].*)$/i)
    if (num && +num[1] > 1 && +num[1] < 50 && !/^\$/.test(t)) {
      cant = +num[1]
      t = num[3].charAt(0).toUpperCase() + num[3].slice(1)
    }
    const repetida = items.find((i) => plano(i.nombre) === plano(t))
    if (repetida) {
      repetida.cant += cant
      return
    }
    const existe = s.prendas.find((p) => plano(p.nombre) === plano(t))
    items.push({ nombre: t, cant, cat: existe ? existe.cat : catHeader || adivinarCat(t), existeId: existe ? existe.id : null })
  })
  return { items, comprar }
}

// Agrega lo leído al armario (si no existe) y a la maleta del viaje
export function importarLista({ items, comprar }, empacado) {
  const v = viaje.value
  let nuevas = 0
  items.forEach((it) => {
    const nombre = it.nombre.trim()
    if (!nombre) return
    let id = it.existeId
    if (!id) {
      id = addPrenda(nombre, it.cat)
      nuevas++
    }
    meterEnMaleta(id)
    if (it.cant > 1) setCantidad(id, it.cant)
    if (empacado) v.checks.ida['p:' + id] = true
  })
  comprar.forEach((n) => n.trim() && addComprar(n))
  return { total: items.length, nuevas, comprar: comprar.length }
}

// ---------- Por comprar ----------
export function addComprar(nombre) {
  const v = viaje.value
  if (!v.comprar) v.comprar = []
  v.comprar.push({ id: 'c' + ++s.seq, nombre: nombre.trim() })
}
export function delComprar(id) {
  viaje.value.comprar = (viaje.value.comprar || []).filter((x) => x.id !== id)
}
// Ya lo compraste: pasa al armario y a la maleta
export function comprado(id) {
  const v = viaje.value
  const it = (v.comprar || []).find((x) => x.id === id)
  if (!it) return
  const existe = s.prendas.find((p) => plano(p.nombre) === plano(it.nombre))
  meterEnMaleta(existe ? existe.id : addPrenda(it.nombre, adivinarCat(it.nombre)))
  delComprar(id)
}

// ---------- Balance del viaje ----------
// Al volver: qué no usaste, qué te hizo falta y notas para la próxima vez.
const rep = () => {
  const v = viaje.value
  if (!v.repaso) v.repaso = { noUsado: [], falto: [], notas: '' }
  return v.repaso
}
// Todo lo que viajó: lo puesto en la ida + la maleta
export const viajo = computed(() => {
  if (!viaje.value) return []
  const ids = new Set([...(viaje.value.llevo || []), ...puestoIds.value])
  return s.prendas.filter((p) => ids.has(p.id)).sort(alfa)
})
export const noUsado = (id) => (viaje.value?.repaso?.noUsado || []).includes(id)
export function toggleNoUsado(id) {
  const r = rep()
  r.noUsado = r.noUsado.includes(id) ? r.noUsado.filter((x) => x !== id) : [...r.noUsado, id]
}
export function addFalto(nombre) {
  if (nombre.trim()) rep().falto.push({ id: 'f' + ++s.seq, nombre: nombre.trim() })
}
export function delFalto(id) {
  rep().falto = rep().falto.filter((f) => f.id !== id)
}
export function setNotasRepaso(t) {
  rep().notas = t
}
// El balance se hace una vez, desde el último día del viaje
const hoyISO = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
export const termino = (v) => !!v && !!v.vuelta && hoyISO() >= v.vuelta
export const balanceHecho = (v) => !!v?.repaso?.hecho
export const pideBalance = (v) => termino(v) && !balanceHecho(v)
export function guardarBalance() {
  rep().hecho = true
  ui.balance = false
}

// Lo que aprendiste en viajes anteriores, para el viaje abierto
const mismoLugar = (a, b) => {
  const x = plano(a)
  const y = plano(b)
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x))
}
export const lecciones = computed(() => {
  const v = viaje.value
  if (!v) return { notas: [], falto: [], noUsado: [] }
  const otros = s.viajes
    .filter((o) => o.id !== v.id && o.repaso)
    .sort((a, b) => (b.vuelta || '').localeCompare(a.vuelta || ''))
  const notas = otros
    .filter((o) => (o.repaso.notas || '').trim())
    .map((o) => ({ id: o.id, destino: o.destino, rango: rangoTexto(o), texto: o.repaso.notas.trim(), mismo: mismoLugar(o.destino, v.destino) }))
    .sort((a, b) => b.mismo - a.mismo)
  const vistos = new Set()
  const falto = []
  otros.forEach((o) =>
    (o.repaso.falto || []).forEach((f) => {
      const k = plano(f.nombre)
      if (vistos.has(k)) return
      vistos.add(k)
      const existe = s.prendas.find((p) => plano(p.nombre) === k)
      if (existe && enMaleta(existe.id)) return // ya lo llevas esta vez
      falto.push({ nombre: f.nombre, destino: o.destino, existeId: existe ? existe.id : null })
    })
  )
  const cuenta = {}
  otros.forEach((o) =>
    (o.repaso.noUsado || []).forEach((id) => {
      if (!cuenta[id]) cuenta[id] = []
      cuenta[id].push(o.destino)
    })
  )
  const noUsadoL = Object.entries(cuenta)
    .map(([id, destinos]) => ({ prenda: s.prendas.find((p) => p.id === id), destinos }))
    .filter((x) => x.prenda)
    .sort((a, b) => b.destinos.length - a.destinos.length || alfa(a.prenda, b.prenda))
  return { notas, falto, noUsado: noUsadoL }
})
// En qué viajes anteriores llevaste esto y no lo usaste
export const noUsadoAntes = (id) => lecciones.value.noUsado.find((x) => x.prenda.id === id)?.destinos || []
export function llevarLoQueFalto(f) {
  meterEnMaleta(f.existeId || addPrenda(f.nombre, adivinarCat(f.nombre)))
}

// ---------- Alojamiento ----------
export function setAloja(campo, valor) {
  const v = viaje.value
  if (!v.aloja) v.aloja = {}
  v.aloja[campo] = valor
}

// ---------- Copiar lista ----------
export function textoLista() {
  const v = viaje.value
  let t = 'Maleta ' + v.destino + ' (' + rango.value + ')'
  CATS.forEach((cat) => {
    const l = maletaDe(cat)
    if (l.length) t += '\n\n' + cat + ':\n' + l.map((p) => '- ' + p.nombre + (cantidad(p.id) > 1 ? ' ×' + cantidad(p.id) : '')).join('\n')
  })
  if (puesto.value.length) t += '\n\nPuesto: ' + puesto.value.map((p) => p.nombre).join(', ')
  return t
}

export { CATS, CATS_PINTA, CATS_ROPA, CATS_COSAS, CATS_SUELTAS, ACTIVIDADES, SECCIONES, adivinarCat }
