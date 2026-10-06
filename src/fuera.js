// v-fuera="fn": llama fn cuando tocas o haces clic fuera del elemento.
// Sirve para cerrar menús y listas desplegadas.
export const vFuera = {
  mounted(el, binding) {
    el._fuera = (e) => {
      if (!el.contains(e.target) && typeof binding.value === 'function') binding.value(e)
    }
    // Espera al siguiente ciclo para que el mismo toque que lo abrió no lo cierre
    el._fueraT = setTimeout(() => document.addEventListener('pointerdown', el._fuera), 0)
  },
  unmounted(el) {
    clearTimeout(el._fueraT)
    document.removeEventListener('pointerdown', el._fuera)
  }
}
