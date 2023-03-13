// Vuetify
import 'vuetify/styles'
import {createVuetify} from 'vuetify'
import {
    VApp,
    VAvatar,
    VBtn, VDivider,
    VIcon, VImg, VLazy, VList, VListItem,
    VListItemAction,
    VListItemSubtitle, VListItemTitle, VMenu,
    VSheet, VSlider, VSpacer,
    VSwitch,
    VTextField
} from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {aliases, mdi} from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

import {VVirtualScroll} from 'vuetify/labs/components'

export default createVuetify({
    components: {
        VApp,
        VBtn,
        VIcon,
        VVirtualScroll,
        VAvatar,
        VMenu,
        VTextField,
        VListItemSubtitle,
        VSwitch,VLazy,
        VListItemAction,
        VSheet, VImg, VSpacer, VSlider, VList, VDivider, VListItem, VListItemTitle
    },
    directives,
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {mdi}
    },
    theme: {}
})