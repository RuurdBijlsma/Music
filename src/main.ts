import { createApp, watch } from "vue";

import App from "./App.vue";

import "vuetify/styles";
import { createVuetify } from "vuetify";
import type { VuetifyOptions } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "@mdi/font/css/materialdesignicons.css";
import pinia from "./scripts/store/pinia";
import router from "./scripts/router";

const vuetify = createVuetify({
    icons: {
        defaultSet: "mdi",
        aliases,
        sets: { mdi }
    }
} as VuetifyOptions);
const app = createApp(App);

app.use(pinia);

app.use(router);
watch(router.currentRoute, () => {
    localStorage.lastRoute = router.currentRoute.value.fullPath;
});
router.replace(localStorage.getItem("lastRoute") === null ? "/" : localStorage.lastRoute).then();
app.use(vuetify);
app.mount("#app");