import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './firebase.js'
import { vFuera } from './fuera.js'

createApp(App).directive('fuera', vFuera).mount('#app')
