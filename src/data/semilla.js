// Datos iniciales de Maletica.
// - prendas: tu armario (se usa en todos los viajes)
// - plantilla: básicos que se copian a cada viaje nuevo
// - viajes: cada uno con destino, fechas, pintas por fecha y su propia maleta

export const CATS = ['Arriba', 'Abajo', 'Zapatos', 'Abrigo', 'Accesorios']

export const GRUPOS = [
  'Ropa extra',
  'Tecnología',
  'Documentos y plata',
  'Aseo y maquillaje',
  'Ropa interior y dormir',
  'Extras'
]

export const ACTIVIDADES = ['Viaje', 'Paseo', 'Piscina', 'Salida de noche', 'En casa', 'Trabajo', 'Regreso']

// Cantidad automática según los días del viaje
//  dias+1   → ropa interior, medias
//  noches/4 → pijama (una cada 4 noches)
export function reglaPorNombre(nombre) {
  if (/^ropa interior|^calzones|^cucos|^medias/i.test(nombre)) return 'dias+1'
  if (/pijama/i.test(nombre)) return 'noches/4'
  return null
}

function prendasBase() {
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
    P('Correa gris', 'Accesorios')
  ]
}

export function plantillaBase() {
  let m = 0
  const B = (nombre, grupo) => ({ id: 'b' + ++m, nombre, grupo, regla: reglaPorNombre(nombre) })
  return [
    B('Portátil', 'Tecnología'),
    B('Cargador del portátil', 'Tecnología'),
    B('Mouse', 'Tecnología'),
    B('Audífonos óseos', 'Tecnología'),
    B('Cargador del celular', 'Tecnología'),
    B('Cédula', 'Documentos y plata'),
    B('Efectivo', 'Documentos y plata'),
    B('Bloqueador', 'Aseo y maquillaje'),
    B("Crema POND'S", 'Aseo y maquillaje'),
    B('Base', 'Aseo y maquillaje'),
    B('Polvo matificante', 'Aseo y maquillaje'),
    B('2 delineadores', 'Aseo y maquillaje'),
    B('3 pestañinas', 'Aseo y maquillaje'),
    B('Encrespador', 'Aseo y maquillaje'),
    B('Brillo labial', 'Aseo y maquillaje'),
    B('Ropa interior', 'Ropa interior y dormir'),
    B('Medias', 'Ropa interior y dormir'),
    B('Pijama satinada negra', 'Ropa interior y dormir'),
    B('Perfume Tonic Noche', 'Extras'),
    B('Bolsa con cierre para ropa mojada', 'Extras')
  ]
}

export function semilla() {
  const prendas = prendasBase()
  const id = (nombre) => prendas.find((p) => p.nombre === nombre).id
  const viaje = ['Jean de brillitos', 'Esqueleto negro', 'Buzo blanco manga campana', 'Tenis rojos'].map(id)
  const plantilla = plantillaBase()

  return {
    version: 2,
    prendas,
    plantilla,
    viajes: [
      {
        id: 'v1',
        destino: 'Villavicencio',
        ida: '2026-10-05',
        vuelta: '2026-10-09',
        pintas: {
          '2026-10-05': viaje,
          '2026-10-06': ['Short de jean azul', 'Esqueleto de rombos gris/blanco', 'Tenis rojos', 'Correa negra'].map(id),
          '2026-10-07': ['Falda-short negra', 'Blusa negra de perlas', 'Tenis rojos'].map(id),
          '2026-10-08': ['Falda-short gris', 'Blusa café/beige con brillitos', 'Tenis rojos', 'Correa gris'].map(id),
          '2026-10-09': [...viaje]
        },
        basicos: JSON.parse(JSON.stringify(plantilla)),
        info: { '2026-10-05': { actividad: 'Viaje' }, '2026-10-09': { actividad: 'Regreso' } },
        checks: { ida: {}, vuelta: {} },
        fase: 'ida'
      }
    ],
    seq: 100
  }
}

// Convierte los datos de la primera versión (un solo viaje fijo) al formato nuevo
export function migrarV1(old) {
  const fechas = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']
  const pintas = {}
  fechas.forEach((f, i) => {
    if (old.pintas && old.pintas['d' + i]) pintas[f] = old.pintas['d' + i]
  })
  return {
    version: 2,
    prendas: old.prendas || [],
    plantilla: JSON.parse(JSON.stringify(old.basicos || plantillaBase())),
    viajes: [
      {
        id: 'v1',
        destino: 'Villavicencio',
        ida: '2026-10-05',
        vuelta: old.regreso === 'jue' ? '2026-10-08' : '2026-10-09',
        pintas,
        basicos: old.basicos || plantillaBase(),
        info: { '2026-10-05': { actividad: 'Viaje' } },
        checks: old.checks || { ida: {}, vuelta: {} },
        fase: old.fase || 'ida'
      }
    ],
    seq: Math.max(old.seq || 100, 100)
  }
}

// Completa campos que versiones anteriores no tenían
function completar(d) {
  const conRegla = (b) => (b.regla === undefined ? { ...b, regla: reglaPorNombre(b.nombre) } : b)
  d.plantilla = (d.plantilla || []).map(conRegla)
  d.viajes.forEach((v) => {
    v.basicos = (v.basicos || []).map(conRegla)
    if (!v.info) v.info = {}
    if (!v.checks) v.checks = { ida: {}, vuelta: {} }
    if (!v.fase) v.fase = 'ida'
  })
  return d
}

export function normalizar(data) {
  if (!data || typeof data !== 'object') return semilla()
  if (data.version === 2 && Array.isArray(data.viajes)) return completar(data)
  if (data.prendas && data.pintas) return completar(migrarV1(data))
  return semilla()
}
