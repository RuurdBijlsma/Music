<template>
    <div class="menu">
        <v-spacer></v-spacer>
        <div class="nav-buttons">
            <v-btn no-drag class="menu-button" variant="text" exact to="/">Listen Now</v-btn>
            <v-btn no-drag class="menu-button" variant="text" exact to="/browse">Browse</v-btn>
            <v-btn no-drag class="menu-button" variant="text" exact to="/library">Library</v-btn>
        </div>

        <v-spacer/>
        <v-text-field
            no-drag
            class="search-field"
            hide-details density="compact"
            append-inner-icon="mdi-magnify"
            placeholder="Search tracks, artists, playlists, and more"
            variant="solo"/>
        <v-spacer/>
        <v-menu location="bottom" :close-on-content-click="false" v-model="dropdownOpen" close-on-back>
            <template v-slot:activator="{ props }">
                <v-btn no-drag size="30" variant="tonal" v-bind="props"
                       density="compact" rounded
                       class="account-button">
                    <v-img :image="spotify.userInfo.avatar"></v-img>
                    <v-icon size="20">mdi-account</v-icon>
                </v-btn>
            </template>

            <v-list density="compact">
                <v-list-item two-line v-if="spotify.isLoggedIn" to="/user">
                    <div class="list-link">
                        <v-avatar variant="tonal" icon="mdi-account"
                                  :image="spotify.userInfo.avatar" alt="User Avatar" class="mr-3"/>
                        <div>
                            <v-list-item-title>{{ spotify.userInfo.name }}</v-list-item-title>
                            <v-list-item-subtitle>{{ spotify.userInfo.mail }}</v-list-item-subtitle>
                        </div>
                    </div>
                </v-list-item>
                <v-divider class="mt-2"></v-divider>
                <v-sheet class="pt-2 pb-2">
                    <v-list-item>
                        <div class="theme-list-item">
                            <v-list-item-title class="small-item">
                                Dark theme
                            </v-list-item-title>
                            <v-list-item-action>
<!--                                <v-switch-->
<!--                                    color="red"-->
<!--                                    v-model="theme.global.name"-->
<!--                                    true-value="dark"-->
<!--                                    true-icon="mdi-brightness-6"-->
<!--                                    false-icon="mdi-brightness-7"-->
<!--                                    false-value="light"-->
<!--                                    hide-details-->
<!--                                    density="compact"/>-->
                            </v-list-item-action>
                        </div>
                    </v-list-item>
                </v-sheet>
                <v-divider class="mb-2"></v-divider>
                <v-list-item to="/downloads">
                    <v-list-item-title class="small-item">
                        <v-icon icon="mdi-download" class="mr-2"/>
                        Downloads
                    </v-list-item-title>
                </v-list-item>
                <v-list-item to="/settings">
                    <v-list-item-title class="small-item">
                        <v-icon icon="mdi-cog" class="mr-2"/>
                        Settings
                    </v-list-item-title>
                </v-list-item>
                <v-list-item to="/settings">
                    <v-list-item-title class="small-item">
                        <v-icon icon="mdi-logout" class="mr-2"/>
                        Logout
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
        <v-btn no-drag @click="setDark()">set dark</v-btn>
        <v-btn no-drag @click="setLight()">set light</v-btn>
        <v-spacer/>
        <div class="app-buttons" no-drag>
            <div class="minimize">
                <v-icon icon="mdi-window-minimize"/>
            </div>
            <div class="maximize">
                <v-icon icon="mdi-window-restore"/>
            </div>
            <div class="close">
                <v-icon icon="mdi-window-close"/>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../scripts/store/spotify";
import {ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useTheme} from "vuetify";

const route = useRoute();
const theme = useTheme();
const spotify = useSpotifyStore();
const dropdownOpen = ref(false);
watch(route, () => {
    dropdownOpen.value = false;
})

function setDark(){
    theme.global.name.value = 'dark';
    console.log(`Current theme is  ${theme.global.current.value.dark}`);
}

function setLight(){
    theme.global.name.value = 'light';
    console.log(`Current theme is  ${theme.global.current.value.dark}`);
}

</script>

<style scoped>

.menu {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 15px;
    font-size: 16px;
    -webkit-app-region: drag;
}
.menu *[no-drag]{
    -webkit-app-region: no-drag;
}

.nav-buttons {
    display: flex;
    align-items: center;
    flex-grow: 2;
    justify-content: center;
    gap:10px;
}

.menu-button {
    text-transform: capitalize;
    font-size: 15px;
}

.menu > a {
    color: rgba(0, 0, 0, 0.8);
    /*opacity: 0.7;*/
}

.small-item {
    font-size: 13px;
    opacity: .7;
    text-transform: uppercase;
}

.search-field {
    height: 40px;
    width: 280px;
    flex-grow: 2;
    background-color: rgba(255, 255, 255, 0.4);
}

.search-field:deep(.v-field--variant-solo) {
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.15);
}

.list-link {
    display: flex;
}

.list-link > div > div {
    color: rgba(0, 0, 0, 0.9);
    text-decoration: none !important;
}

.theme-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 5px;
}

.app-buttons {
    display: flex;
    margin-top: -15px;
    margin-right: -15px;
}

.app-buttons > div {
    width: 50px;
    height: 35px;
    text-align: center;
    font-size: 13px;
    padding: 6px;
    color: rgba(0, 0, 0, 0.8);
    transition: 0.1s;
}

.app-buttons > div:hover {
    background-color: rgba(0, 0, 0, 0.15);
}

.close:hover {
    background-color: #cb2525 !important;
    color: white;
}
</style>