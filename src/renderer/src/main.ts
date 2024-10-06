import { createApp } from 'vue'
import App from './App.vue'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import router from './scripts/router'
import { createPinia } from 'pinia'
import { vuetify } from './scripts/theme'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')

if (localStorage.getItem('lastRoute') !== null) {
    router.replace(localStorage.lastRoute).then()
}
