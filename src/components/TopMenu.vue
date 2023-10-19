<template>
    <div class="menu">
        <div class="logo">
            <v-img width="30" height="30" src="icon/new-dark-192.png"></v-img>
            <div>Ruurd Music</div>
        </div>
        <spacer />
        <v-text-field
            no-drag
            spellcheck="false"
            class="search-field"
            hide-details density="compact"
            v-model="base.searchValue"
            append-inner-icon="mdi-magnify"
            placeholder="Search tracks, artists, playlists, and more"
            :clearable="true"
            variant="solo">
        </v-text-field>
        <spacer />
        <v-menu location="bottom" :close-on-content-click="false" v-model="dropdownOpen" close-on-back>
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
                                  :image="library.userInfo.avatar"
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
                <v-list-item to="/settings">
                    <v-list-item-title class="small-item">
                        <v-icon icon="mdi-logout" class="mr-2" />
                        Logout
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
        <spacer />
        <div class="app-buttons" no-drag>
            <v-btn class="minimize window-button" variant="plain" density="compact" @click="platform.minimize()">
                <v-icon icon="mdi-window-minimize" />
            </v-btn>
            <v-btn class="maximize window-button" variant="plain" density="compact" @click="platform.toggleMaximize()">
                <v-icon icon="mdi-window-restore" />
            </v-btn>
            <v-btn class="close window-button" variant="plain" density="compact" @click="platform.close()">
                <v-icon icon="mdi-window-close" />
            </v-btn>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLibraryStore } from "../scripts/store/library";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useTheme } from "vuetify";
import { useBaseStore } from "../scripts/store/base";
import { usePlatformStore } from "../scripts/store/electron";
import { useSpotifyAuthStore } from "../scripts/store/spotify-auth";
import Spacer from "./Spacer.vue";

const route = useRoute();
const theme = useTheme();
const base = useBaseStore();
const library = useLibraryStore();
const spotifyAuth = useSpotifyAuthStore();
const dropdownOpen = ref(false);
const themeOptions = ["light", "dark", "system"];
const chosenTheme = ref(2);
const platform = usePlatformStore();
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
    platform.setTheme(theme.global.name.value);
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

<style scoped lang="scss">

.menu {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 15px;
    font-size: 16px;
    -webkit-app-region: drag;
}

.menu *[no-drag] {
    -webkit-app-region: no-drag;
}


@media (max-width: 930px) {
    .logo, {
        display: none !important;
    }
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 300;
}

.small-item {
    font-size: 13px;
    opacity: .7;
    text-transform: uppercase;
}

.list-link {
    display: flex;
}

.search-field {
    -webkit-app-region: no-drag;
    width: 300px;
    flex-grow: 2;
    position: relative;
}

.search-field:deep(.v-field--variant-solo) {
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
}

.dark .search-field:deep(.v-field--variant-solo) {
    background-color: rgba(0, 0, 0, 0.3);
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.15);
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

.app-buttons {
    display: flex;
    margin-top: -15px;
    margin-right: -15px;
}

.app-buttons > .window-button {
    width: 50px;
    height: 35px;
    text-align: center;
    font-size: 13px;
    padding: 6px;
    color: rgba(0, 0, 0, 0.8);
    transition: 0.1s;
}

.dark .app-buttons > .window-button {
    color: rgba(255, 255, 255, 0.7);
}

.dark .app-buttons > .window-button:hover {
    background-color: rgba(255, 255, 255, 0.15);
}

.app-buttons > .window-button:hover {
    background-color: rgba(0, 0, 0, 0.15);
}

.close:hover {
    background-color: #cb2525 !important;
    color: white;
}
</style>