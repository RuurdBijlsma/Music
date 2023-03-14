import 'vuetify/styles'
import {createVuetify} from 'vuetify'
import {aliases, mdi} from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import {VVirtualScroll} from "vuetify/labs/components";

export default createVuetify({
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {mdi}
    },
    components:{VVirtualScroll},
    theme: {
        defaultTheme: 'dark',
    }
})