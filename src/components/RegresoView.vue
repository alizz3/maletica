<script setup>
import { computed } from 'vue'
import { viaje, dias, CATS, GRUPOS, basicosDe, chk, setChk, ropaRegreso, ropaParaVolver, REVISAR, cantidad } from '../store.js'

const props = defineProps({ soloPendientes: Boolean })

const ver = (items, pref) => (props.soloPendientes ? items.filter((x) => !chk(pref + x.id)) : items)
const porCat = computed(() =>
  CATS.map((c) => ({ cat: c, items: ropaRegreso.value.filter((p) => p.cat === c) })).filter((g) => g.items.length)
)
const listos = (items, pref) => items.filter((x) => chk(pref + x.id)).length
const revisar = computed(() => REVISAR.map((nombre, i) => ({ id: i, nombre })))
const ultimo = computed(() => dias.value[dias.value.length - 1])
</script>

<template>
  <div class="panel regreso-intro">
    <h3>Checklist de regreso</h3>
    <p class="hint" style="margin: 0">
      Marca cada cosa cuando la metas en la maleta. Lo que quede sin marcar es lo que todavía no aparece.
    </p>
  </div>

  <div class="panel" v-if="ropaParaVolver.length">
    <h3>Te pones para volver ({{ ultimo.largo.toLowerCase() }})</h3>
    <p style="margin: 0; font-size: 14px">{{ ropaParaVolver.map((p) => p.nombre).join(' · ') }}</p>
  </div>

  <div class="panel">
    <div class="ph">
      <h3>Ropa para empacar</h3>
      <span class="gp" :class="{ full: listos(ropaRegreso, 'p:') === ropaRegreso.length }">
        {{ listos(ropaRegreso, 'p:') }}/{{ ropaRegreso.length }}
      </span>
    </div>
    <p class="hint" style="margin: 0; font-size: 12px">Incluye lo que llevabas puesto el día de ida.</p>
    <template v-for="g in porCat" :key="g.cat">
      <h4 v-if="ver(g.items, 'p:').length">{{ g.cat }}</h4>
      <ul class="list">
        <li v-for="p in ver(g.items, 'p:')" :key="p.id">
          <label>
            <input type="checkbox" :id="'vu-p-' + p.id" :checked="chk('p:' + p.id)" @change="setChk('p:' + p.id, $event.target.checked)" />
            <span :class="{ done: chk('p:' + p.id) }">{{ p.nombre }}</span>
          </label>
        </li>
      </ul>
    </template>
    <p v-if="!ropaRegreso.length" class="empty" style="margin: 0">Arma las pintas y aquí aparece la ropa que viajó.</p>
  </div>

  <template v-for="g in GRUPOS" :key="g">
    <div class="panel" v-if="basicosDe(g).length && (!soloPendientes || ver(basicosDe(g), 'b:').length)">
      <div class="ph">
        <h3>{{ g }}</h3>
        <span class="gp" :class="{ full: listos(basicosDe(g), 'b:') === basicosDe(g).length }">
          {{ listos(basicosDe(g), 'b:') }}/{{ basicosDe(g).length }}
        </span>
      </div>
      <ul class="list">
        <li v-for="b in ver(basicosDe(g), 'b:')" :key="b.id">
          <label>
            <input type="checkbox" :id="'vu-b-' + b.id" :checked="chk('b:' + b.id)" @change="setChk('b:' + b.id, $event.target.checked)" />
            <span :class="{ done: chk('b:' + b.id) }">{{ b.nombre }}</span>
          </label>
          <span v-if="cantidad(b)" class="meta">× {{ cantidad(b) }}</span>
        </li>
      </ul>
    </div>
  </template>

  <div class="panel revisar">
    <div class="ph">
      <h3>Revisa antes de salir</h3>
      <span class="gp" :class="{ full: listos(revisar, 'r:') === revisar.length }">{{ listos(revisar, 'r:') }}/{{ revisar.length }}</span>
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
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--lav);
}
.regreso-intro {
  background: var(--pink-soft);
  border-color: transparent;
}
.revisar {
  border-color: var(--pink);
}
</style>
