import { createApp, watch } from "vue";
import App from "./App.vue";
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import router from "./scripts/router";
import { createPinia } from "pinia";

const vuetify = createVuetify({
    icons: {
        defaultSet: "mdi",
        aliases,
        sets: { mdi }
    }
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(vuetify);

watch(router.currentRoute, () => {
    localStorage.lastRoute = router.currentRoute.value.fullPath;
});
router.replace(localStorage.getItem("lastRoute") === null ? "/" : localStorage.lastRoute).then();

app.mount("#app");
