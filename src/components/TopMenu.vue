<template>
    <div class="menu">
        <v-spacer></v-spacer>
        <div class="nav-buttons">
            <v-btn class="menu-button" variant="text" exact to="/">Listen Now</v-btn>
            <v-btn class="menu-button" variant="text" exact to="/playlists">Playlists</v-btn>
            <v-btn class="menu-button" variant="text" exact to="/tracks">Tracks</v-btn>
            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn variant="text" icon="mdi-chevron-down" v-bind="props"></v-btn>
                </template>

                <v-list density="compact">
                    <v-list-item to="/browse">
                        <template v-slot:prepend>
                            <v-icon>mdi-playlist-plus</v-icon>
                        </template>
                        <v-list-item-title>Browse</v-list-item-title>
                    </v-list-item>
                    <v-list-item to="/artists">
                        <template v-slot:prepend>
                            <v-icon>mdi-microphone</v-icon>
                        </template>
                        <v-list-item-title>Artists</v-list-item-title>
                    </v-list-item>
                    <v-list-item to="/albums">
                        <template v-slot:prepend>
                            <v-icon>mdi-album</v-icon>
                        </template>
                        <v-list-item-title>Albums</v-list-item-title>
                    </v-list-item>
                    <v-divider class="mt-2 mb-2"></v-divider>
                    <v-list-item to="/downloads">
                        <v-list-item-title class="small-item">Downloads</v-list-item-title>
                    </v-list-item>
                    <v-list-item to="/settings">
                        <v-list-item-title class="small-item">Settings</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>

        <v-spacer/>
        <v-text-field
            class="search-field"
            hide-details density="compact"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search tracks, artists, playlists, and more"
            variant="solo"/>
        <v-spacer/>
        <v-menu location="bottom" :close-on-content-click="false" v-model="hello" close-on-back>
            <template v-slot:activator="{ props }">
                <v-avatar :image="spotify.userInfo.avatar" icon="mdi-account" variant="tonal" v-bind="props"
                          v-ripple
                          class="account-button"/>
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
                <v-sheet :theme="swit ? 'light' : 'dark'" class="pt-2 pb-2">
                    <v-list-item>
                        <div class="theme-list-item">
                            <v-list-item-title class="small-item">
                                <v-icon icon="mdi-brightness-7" class="mr-2"/>
                                Dark theme
                            </v-list-item-title>
                            <v-list-item-action>
                                <v-switch
                                    color="red"
                                    v-model="swit"
                                    hide-details
                                    density="compact"/>
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
        <v-spacer/>
        <div class="app-buttons">
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

const route = useRoute();

const spotify = useSpotifyStore();
const swit = ref(false);
const hello = ref(false);
watch(hello, () => {
    console.log(hello, 'changed');
})
watch(route, () => {
    hello.value = false;
})

</script>

<style scoped>

.menu {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 15px;
    font-size: 16px;
}

.nav-buttons {
    display: flex;
    align-items: center;
    flex-grow: 2;
    justify-content: space-between;
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
    width: 280px;
    flex-grow: 2;
    background-color: rgba(255, 255, 255, 0.4);
}

.search-field:deep(.v-field--variant-solo) {
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.15);
}

.account-button {
    cursor: pointer;
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
    margin-top: -35px;
    margin-right: -20px;
}

.app-buttons > div {
    width: 50px;
    height: 35px;
    text-align: center;
    font-size: 13px;
    padding: 6px;
    color: rgba(0, 0, 0, 0.8);
}

.app-buttons > div:hover {
    background-color: rgba(0, 0, 0, 0.15);
}

.close:hover {
    background-color: #cb2525 !important;
    color: white;
}
</style>