import { defineStore } from "pinia";
import { computed, ref, toRaw, watch } from "vue";

export const useRuurdAuthStore = defineStore("ruurd-auth", () => {
    const credentials = ref(
        localStorage.getItem("ruurdCredentials") === null
            ? {
                  email: null as null | string,
                  password: null as null | string,
                  name: null as null | string,
              }
            : JSON.parse(localStorage.ruurdCredentials),
    );

    watch(
        credentials,
        () => {
            localStorage.ruurdCredentials = JSON.stringify(
                toRaw(credentials.value),
            );
        },
        { deep: true },
    );

    function logout() {
        credentials.value.email = null;
        credentials.value.name = null;
        credentials.value.password = null;
    }

    const isLoggedIn = computed(
        () =>
            credentials.value.email !== null &&
            credentials.value.password !== null &&
            credentials.value.name !== null,
    );

    return {
        credentials,
        isLoggedIn,
        logout,
    };
});
