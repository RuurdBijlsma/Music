import { createApp } from "vue";
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
        sets: { mdi },
    },
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(vuetify);

app.mount("#app");

if (localStorage.getItem("lastRoute") !== null) {
    router.replace(localStorage.lastRoute).then();
}
