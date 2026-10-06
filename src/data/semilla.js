// Datos de Maletica (versión 3)
// - prendas: TU ARMARIO, todo lo que tienes: ropa y cosas (cargadores, aseo, documentos…)
// - viajes: destino, fechas, pintas por día y la MALETA (llevo = lo que elegiste del armario)

// Ropa que se usa en las pintas de cada día
export const CATS_PINTA = ['Arriba', 'Abajo', 'Zapatos', 'Abrigo', 'Accesorios', 'Ropa interior', 'Medias']
// Toda la ropa (la pijama no va en pintas)
export const CATS_ROPA = [...CATS_PINTA, 'Pijama']
// Cosas que no son ropa
export const CATS_COSAS = ['Tecnología', 'Documentos y plata', 'Aseo y maquillaje', 'Otras cosas']
export const CATS = [...CATS_ROPA, ...CATS_COSAS]
// Piezas que se cuentan contra lo recomendado (días + 1)
export const CATS_SUELTAS = ['Ropa interior', 'Medias']

// Secciones del armario
export const SECCIONES = [
  { titulo: 'Ropa', cats: CATS_ROPA },
  { titulo: 'Cosas', cats: ['Tecnología', 'Documentos y plata', 'Aseo y maquillaje'] },
  { titulo: 'Extra', cats: ['Otras cosas'] }
]

export const ACTIVIDADES = ['Viaje', 'Paseo', 'Piscina', 'Salida de noche', 'En casa', 'Trabajo', 'Regreso']

function armarioBase() {
  let n = 0
  const P = (nombre, cat) => ({ id: 'p' + ++n, nombre, cat })
  return [
    P('Esqueleto negro', 'Arriba'),
    P('Esqueleto de rombos gris/blanco', 'Arriba'),
    P('Blusa negra de perlas', 'Arriba'),
    P('Blusa café/beige con brillitos', 'Arriba'),
    P('Blusa tejida negra', 'Arriba'),
    P('Malla de serpientes', 'Arriba'),
    P('Jean de brillitos', 'Abajo'),
    P('Short de jean azul', 'Abajo'),
    P('Falda-short negra', 'Abajo'),
    P('Falda-short gris', 'Abajo'),
    P('Tenis rojos', 'Zapatos'),
    P('Buzo blanco manga campana', 'Abrigo'),
    P('Correa negra', 'Accesorios'),
    P('Correa gris', 'Accesorios'),
    P('Cuco negro de encaje', 'Ropa interior'),
    P('Cuco negro "Only One"', 'Ropa interior'),
    P('Cuco blanco "Secret"', 'Ropa interior'),
    P('Medias de gato rosadas', 'Medias'),
    P('Medias de leopardo', 'Medias'),
    P('Medias de rayas negras/blancas', 'Medias'),
    P('Pijama satinada negra', 'Pijama'),
    P('Portátil', 'Tecnología'),
    P('Cargador del portátil', 'Tecnología'),
    P('Mouse', 'Tecnología'),
    P('Audífonos óseos', 'Tecnología'),
    P('Cargador del celular', 'Tecnología'),
    P('Cédula', 'Documentos y plata'),
    P('Efectivo', 'Documentos y plata'),
    P('Bloqueador', 'Aseo y maquillaje'),
    P("Crema POND'S", 'Aseo y maquillaje'),
    P('Base', 'Aseo y maquillaje'),
    P('Polvo matificante', 'Aseo y maquillaje'),
    P('2 delineadores', 'Aseo y maquillaje'),
    P('3 pestañinas', 'Aseo y maquillaje'),
    P('Encrespador', 'Aseo y maquillaje'),
    P('Brillo labial', 'Aseo y maquillaje'),
    P('Perfume Tonic Noche', 'Otras cosas'),
    P('Bolsa con cierre para ropa mojada', 'Otras cosas')
  ]
}

export function viajeNuevo(id, destino, ida, vuelta) {
  return {
    id,
    destino,
    ida,
    vuelta,
    pintas: {},
    llevo: [],
    comprar: [],
    info: { [ida]: { actividades: ['Viaje'] }, ...(vuelta !== ida ? { [vuelta]: { actividades: ['Regreso'] } } : {}) },
    checks: { ida: {}, vuelta: {} },
    fase: 'ida'
  }
}

export function semilla() {
  const prendas = armarioBase()
  const id = (nombre) => prendas.find((p) => p.nombre === nombre).id
  const viaje = ['Jean de brillitos', 'Esqueleto negro', 'Buzo blanco manga campana', 'Tenis rojos'].map(id)
  const v = viajeNuevo('v1', 'Villavicencio', '2026-10-05', '2026-10-09')
  v.pintas = {
    '2026-10-05': viaje,
    '2026-10-06': ['Short de jean azul', 'Esqueleto de rombos gris/blanco', 'Tenis rojos', 'Correa negra'].map(id),
    '2026-10-07': ['Falda-short negra', 'Blusa negra de perlas', 'Tenis rojos'].map(id),
    '2026-10-08': ['Falda-short gris', 'Blusa café/beige con brillitos', 'Tenis rojos', 'Correa gris'].map(id),
    '2026-10-09': [...viaje]
  }
  return { version: 3, prendas, viajes: [v], seq: 100 }
}

// ---------- Migraciones ----------
const GRUPO_A_CAT = {
  Tecnología: 'Tecnología',
  'Documentos y plata': 'Documentos y plata',
  'Aseo y maquillaje': 'Aseo y maquillaje',
  Extras: 'Otras cosas',
  'Ropa extra': 'Otras cosas'
}
const esGenerico = (n) => /^(ropa interior|medias|calzones|cucos|panties)\b/i.test(n)

// v2 → v3: los básicos pasan al armario como cosas y la maleta queda vacía para armarla
function migrarV2(d) {
  const prendas = [...(d.prendas || [])]
  let seq = Math.max(d.seq || 100, 100)
  const nombres = new Set(prendas.map((p) => p.nombre.toLowerCase()))
  const basicos = [...(d.plantilla || []), ...(d.viajes || []).flatMap((v) => v.basicos || [])]
  basicos.forEach((b) => {
    if (!b || !b.nombre || esGenerico(b.nombre) || nombres.has(b.nombre.toLowerCase())) return
    const cat = /pijama/i.test(b.nombre) ? 'Pijama' : GRUPO_A_CAT[b.grupo] || 'Otras cosas'
    prendas.push({ id: 'p' + ++seq, nombre: b.nombre, cat })
    nombres.add(b.nombre.toLowerCase())
  })
  const viajes = (d.viajes || []).map((v) => ({
    id: v.id,
    destino: v.destino,
    ida: v.ida,
    vuelta: v.vuelta,
    pintas: v.pintas || {},
    llevo: [],
    info: v.info || {},
    checks: { ida: {}, vuelta: {} },
    fase: 'ida'
  }))
  return { version: 3, prendas, viajes, seq }
}

// v1 (un solo viaje fijo) → v2 simplificado → v3
function migrarV1(old) {
  const fechas = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']
  const pintas = {}
  fechas.forEach((f, i) => {
    if (old.pintas && old.pintas['d' + i]) pintas[f] = old.pintas['d' + i]
  })
  return migrarV2({
    prendas: old.prendas || [],
    plantilla: old.basicos || [],
    viajes: [{ id: 'v1', destino: 'Villavicencio', ida: '2026-10-05', vuelta: old.regreso === 'jue' ? '2026-10-08' : '2026-10-09', pintas }],
    seq: old.seq
  })
}

function completar(d) {
  d.prendas = (d.prendas || []).filter((p) => p && p.id)
  // actividad (texto) → actividades (lista)
  ;(d.viajes || []).forEach((v) =>
    Object.values(v.info || {}).forEach((i) => {
      if (!Array.isArray(i.actividades)) i.actividades = i.actividad ? [i.actividad] : []
      delete i.actividad
    })
  )
  d.viajes = (d.viajes || []).map((v) => ({
    pintas: {},
    llevo: [],
    comprar: [],
    info: {},
    checks: { ida: {}, vuelta: {} },
    fase: 'ida',
    ...v
  }))
  return d
}

export function normalizar(data) {
  if (!data || typeof data !== 'object') return semilla()
  if (data.version === 3 && Array.isArray(data.viajes)) return completar(data)
  if (data.version === 2 && Array.isArray(data.viajes)) return completar(migrarV2(data))
  if (data.prendas && data.pintas) return completar(migrarV1(data))
  return semilla()
}

// ---------- Adivinar la categoría por el nombre ----------
const PISTAS = [
  ['Ropa interior', /\b(cucos?|calzon(es|cito)?s?|tangas?|panty|panties|brasier|brassier|bras?ier|sosten|top deportivo)\b/],
  ['Medias', /^medias?\b|\bmedias?\b/],
  ['Pijama', /\bpijamas?\b/],
  ['Zapatos', /\b(tenis|zapatos?|sandalias?|botas?|botines|chanclas?|baletas?|crocs)\b/],
  ['Abrigo', /\b(buzo|chaqueta|saco|chompa|abrigo|cardigan|hoodie)\b/],
  ['Abajo', /\b(jean|jeans|faldas?|falda-short|shorts?|pantalon(es)?|sudadera|leggins?|licra|bermuda)\b/],
  ['Arriba', /\b(blusas?|esqueletos?|camisas?|camisetas?|top|crop|mallas?|body|vestido)\b/],
  ['Accesorios', /\b(correas?|cinturon|aretes|collar|pulsera|gafas|gorra|sombrero|bolso|cartera|reloj|anillo)\b/],
  ['Documentos y plata', /\b(cedula|efectivo|plata|dinero|tarjetas?|pasaporte|documentos?|carnet|licencia)\b|\$/],
  ['Tecnología', /\b(celular|cargador(es)?|portatil|computador|audifonos|mouse|power ?bank|bateria|tablet|cable|usb|parlante)\b/],
  ['Aseo y maquillaje', /\b(cepillo|cepillito|crema|desodorante|perfume|atomizador|base|brillos?|pestaninas?|labial|manteca|delineador(es)?|encrespador|cejas|espejo|polvos?|plancha|secador|cauchitos|depilatori[ao]|copa menstrual|toallas? higienicas?|protectores|jabon|shampoo|champu|acondicionador|bloqueador|desmaquil\w*|pomitos|nixoderm|maquillaje|rubor|corrector|esmalte|peinilla|pinzas|rasuradora|cuchilla|hilo dental|crema dental|dolor\w*|pastillas?|medicamentos?|ibuprofeno|acetaminofen)\b/]
]
const sinTildes = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function adivinarCat(nombre) {
  const t = sinTildes(nombre)
  for (const [cat, re] of PISTAS) if (re.test(t)) return cat
  return 'Otras cosas'
}
