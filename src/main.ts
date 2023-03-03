import {createApp} from 'vue'
import App from './App.vue'
import router from './scripts/router'
import vuetify from './scripts/vuetify'
import pinia from './scripts/store/pinia'

createApp(App)
    .use(pinia)
    .use(router)
    .use(vuetify)
    .mount('#app')
