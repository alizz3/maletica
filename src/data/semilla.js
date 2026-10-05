// Datos iniciales: viaje a Villavicencio (lun 5 – vie 9 oct 2026)
// y la lista base de julio. Todo se puede editar desde la app.

export const CATS = ['Arriba', 'Abajo', 'Zapatos', 'Abrigo', 'Accesorios']

export const GRUPOS = [
  'Ropa extra',
  'Tecnología',
  'Documentos y plata',
  'Aseo y maquillaje',
  'Ropa interior y dormir',
  'Extras'
]

export const DIAS = [
  { key: 'd0', corto: 'Lun', num: 5, largo: 'Lunes 5' },
  { key: 'd1', corto: 'Mar', num: 6, largo: 'Martes 6' },
  { key: 'd2', corto: 'Mié', num: 7, largo: 'Miércoles 7' },
  { key: 'd3', corto: 'Jue', num: 8, largo: 'Jueves 8' },
  { key: 'd4', corto: 'Vie', num: 9, largo: 'Viernes 9' }
]

export function semilla() {
  let n = 0
  const P = (nombre, cat) => ({ id: 'p' + ++n, nombre, cat })
  const prendas = [
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
  const id = (nombre) => prendas.find((p) => p.nombre === nombre).id
  const viaje = ['Jean de brillitos', 'Esqueleto negro', 'Buzo blanco manga campana', 'Tenis rojos'].map(id)

  const pintas = {
    d0: viaje,
    d1: ['Short de jean azul', 'Esqueleto de rombos gris/blanco', 'Tenis rojos', 'Correa negra'].map(id),
    d2: ['Falda-short negra', 'Blusa negra de perlas', 'Tenis rojos'].map(id),
    d3: ['Falda-short gris', 'Blusa café/beige con brillitos', 'Tenis rojos', 'Correa gris'].map(id),
    d4: [...viaje]
  }

  let m = 0
  const B = (nombre, grupo) => ({ id: 'b' + ++m, nombre, grupo })
  const basicos = [
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
    B('Ropa interior (4 mudas)', 'Ropa interior y dormir'),
    B('Medias (3 pares)', 'Ropa interior y dormir'),
    B('Pijama satinada negra', 'Ropa interior y dormir'),
    B('Perfume Tonic Noche', 'Extras'),
    B('Bolsa con cierre para ropa mojada', 'Extras')
  ]

  return {
    regreso: 'vie',
    fase: 'ida',
    prendas,
    pintas,
    basicos,
    checks: { ida: {}, vuelta: {} },
    seq: 100
  }
}
