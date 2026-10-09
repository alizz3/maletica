<script setup>
import { computed } from 'vue'
import { dias, CATS, chk, setChk, listosDe, regreso, ropaParaVolver, REVISAR, esPuesta, cantidad } from '../store.js'

const props = defineProps({ soloPendientes: Boolean })

const ver = (items, pref) => (props.soloPendientes ? items.filter((x) => !chk(pref + x.id)) : items)
const porCat = computed(() =>
  CATS.map((c) => ({
    cat: c,
    items: regreso.value.filter((p) => p.cat === c),
    puestas: ropaParaVolver.value.filter((p) => p.cat === c)
  })).filter((g) => g.items.length || g.puestas.length)
)
const revisar = computed(() => REVISAR.map((nombre, i) => ({ id: i, nombre })))
const ultimo = computed(() => dias.value[dias.value.length - 1])
</script>

<template>
  <div class="panel regreso-intro">
    <h3>Checklist de regreso</h3>
    <p class="hint" style="margin: 0">
      Aquí está todo lo que viajó contigo. Márcalo cuando lo metas a la maleta: lo que quede sin marcar es lo que todavía no aparece.
    </p>
  </div>

  <div class="panel">
    <div class="ph">
      <h3>Todo lo que viajó</h3>
      <span class="gp" :class="{ full: regreso.length && listosDe(regreso) === regreso.length }">
        {{ listosDe(regreso) }}/{{ regreso.length }}
      </span>
    </div>
    <span v-if="ropaParaVolver.length" class="leyenda"><i aria-hidden="true"></i> te la pones para volver ({{ ultimo.largo.toLowerCase() }})</span>
    <template v-for="g in porCat" :key="g.cat">
      <h4 v-if="ver(g.items, 'p:').length || (!soloPendientes && g.puestas.length)">
        {{ g.cat }} <small class="sub" v-if="g.items.length">{{ listosDe(g.items) }}/{{ g.items.length }}</small>
      </h4>
      <ul class="list">
        <template v-if="!soloPendientes">
          <li v-for="p in g.puestas" :key="'pv-' + p.id" class="puesta-fila">
            <span class="dot" aria-hidden="true"></span>
            <span class="nom">{{ p.nombre }}</span>
            <span class="meta tag-puesta">Puesta · Regreso</span>
          </li>
        </template>
        <li v-for="p in ver(g.items, 'p:')" :key="p.id">
          <label>
            <input type="checkbox" :id="'vu-p-' + p.id" :checked="chk('p:' + p.id)" @change="setChk('p:' + p.id, $event.target.checked)" />
            <span :class="{ done: chk('p:' + p.id) }">{{ p.nombre }}</span>
          </label>
          <span v-if="cantidad(p.id) > 1" class="meta qty">×{{ cantidad(p.id) }}</span>
          <span v-if="esPuesta(p.id)" class="meta puesta">puesta en la ida</span>
        </li>
      </ul>
    </template>
    <p v-if="!regreso.length" class="empty" style="margin: 0">Cuando armes la maleta de ida, aquí aparece todo para traerlo de vuelta.</p>
  </div>

  <div class="panel revisar">
    <div class="ph">
      <h3>Revisa antes de salir</h3>
      <span class="gp" :class="{ full: listosDe(revisar, 'r:') === revisar.length }">{{ listosDe(revisar, 'r:') }}/{{ revisar.length }}</span>
    </div>
    <ul class="list">
      <li v-for="r in ver(revisar, 'r:')" :key="r.id">
        <label>
          <input type="checkbox" :id="'vu-r-' + r.id" :checked="chk('r:' + r.id)" @change="setChk('r:' + r.id, $event.target.checked)" />
          <span :class="{ done: chk('r:' + r.id) }">{{ r.nombre }}</span>
        </label>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.ph {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.gp {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.gp.full {
  color: var(--ok);
}
h4 {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--lav);
}
h4 .sub {
  color: var(--muted);
  font-weight: 500;
  margin-left: 4px;
}
.qty {
  color: var(--lav);
  font-weight: 700;
}
.puesta {
  color: var(--pink);
}
.leyenda {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--pink);
}
.leyenda i,
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--pink);
  flex: 0 0 10px;
}
.list li.puesta-fila {
  gap: 10px;
}
.puesta-fila .dot {
  margin: 0 6px;
}
.puesta-fila .nom {
  flex: 1;
  min-width: 0;
}
.tag-puesta {
  color: var(--pink);
  background: var(--pink-soft);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.regreso-intro {
  background: var(--pink-soft);
  border-color: transparent;
}
.revisar {
  border-color: var(--pink);
}
</style>
