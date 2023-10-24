<template>
    <v-menu location="bottom" :close-on-content-click="false" v-model="dropdownOpen" :close-on-back="true">
        <template v-slot:activator="{ props }">
            <v-btn no-drag size="30" variant="tonal" v-bind="props"
                   density="compact" rounded
                   class="account-button ml-2 mr-2">
                <v-img :image="library.userInfo.avatar"></v-img>
                <v-icon size="20">mdi-account</v-icon>
            </v-btn>
        </template>

        <v-list density="compact">
            <v-list-item two-line v-if="spotifyAuth.isLoggedIn" to="/user">
                <div class="list-link">
                    <v-avatar variant="tonal" icon="mdi-account"
                              :image="library.userInfo.avatar || randomUser()"
                              alt="User Avatar" class="mr-3" />
                    <div>
                        <v-list-item-title>{{ library.userInfo.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ library.userInfo.mail }}</v-list-item-subtitle>
                    </div>
                </div>
            </v-list-item>
            <v-divider class="mt-2"></v-divider>
            <v-list-item>
                <div class="theme-flex">
                    <v-list-item-title class="theme-title">Theme</v-list-item-title>

                    <v-chip-group selected-class="text-deep-primary"
                                  v-model="chosenTheme"
                                  class="chip-group"
                                  color="primary"
                                  mandatory>
                        <v-chip class="theme-chip">Light</v-chip>
                        <v-chip class="theme-chip">Dark</v-chip>
                        <v-chip class="theme-chip">System</v-chip>
                    </v-chip-group>
                </div>
            </v-list-item>
            <v-divider class="mb-2"></v-divider>
            <v-list-item to="/downloads">
                <v-list-item-title class="small-item">
                    <v-icon icon="mdi-download" class="mr-2" />
                    Downloads
                </v-list-item-title>
            </v-list-item>
            <v-list-item to="/settings">
                <v-list-item-title class="small-item">
                    <v-icon icon="mdi-cog" class="mr-2" />
                    Settings
                </v-list-item-title>
            </v-list-item>
            <v-list-item @click="spotifyAuth.logout">
                <v-list-item-title class="small-item">
                    <v-icon icon="mdi-logout" class="mr-2" />
                    Logout
                </v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script setup lang="ts">
import { useLibraryStore } from "../store/library";
import { useSpotifyAuthStore } from "../store/spotify-auth";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useTheme } from "vuetify";
import { usePlatformStore } from "../store/electron";
import { randomUser } from "../scripts/imageSources";

const library = useLibraryStore();
const spotifyAuth = useSpotifyAuthStore();
const route = useRoute();
const theme = useTheme();
const platform = usePlatformStore();

const themeOptions = ["light", "dark", "system"];
const chosenTheme = ref(2);
const dropdownOpen = ref(false);

watch(route, () => {
    dropdownOpen.value = false;
});
watch(chosenTheme, () => {
    localStorage.theme = themeOptions[chosenTheme.value];
    applyTheme();
});

function applyTheme() {
    if (localStorage.getItem("theme") !== null)
        chosenTheme.value = themeOptions.indexOf(localStorage.theme);
    if (localStorage.getItem("theme") !== null && localStorage.theme !== "system") {
        theme.global.name.value = localStorage.theme;
    } else {
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            // dark mode
            theme.global.name.value = "dark";
        } else {
            theme.global.name.value = "light";
        }
    }
    platform.setTheme(theme.global.name.value as "light" | "dark");
}

applyTheme();

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
    if (localStorage.theme === "system") {
        if (e.matches) {
            // dark mode
            theme.global.name.value = "dark";
        } else {
            // light mode
            theme.global.name.value = "light";
        }
    }
});
</script>

<style scoped lang="less">

.small-item {
    font-size: 13px;
    opacity: .7;
    text-transform: uppercase;
}

.list-link {
    display: flex;
}

.chip-group {
    display: flex;
    justify-content: space-between;
}

.theme-chip {
    margin-right: 5px !important;
    margin-left: 5px !important;
}

.theme-title {
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 300;
    opacity: 0.7;
    text-align: center;
}

</style>
