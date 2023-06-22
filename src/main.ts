import {createApp} from 'vue'

import App from './App.vue'

import 'vuetify/styles'
import {createVuetify} from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {aliases, mdi} from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import pinia from "./scripts/store/pinia";
import router from "./scripts/router";

const vuetify = createVuetify({
    components: {...components},
    directives,
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        }
    },
})

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(vuetify);

app.mount('#app')