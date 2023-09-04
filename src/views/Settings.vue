<template>
    <div class="settings mt-8">
        <h1>Settings</h1>
        <v-divider class="mt-2 mb-2"></v-divider>
        <h3>
            <v-icon :color="spotifyAuth.hasCredentials ? 'green' : 'default'">mdi-spotify</v-icon>
            Spotify
        </h3>
        <v-text-field
            class="mt-5"
            variant="filled"
            density="compact"
            hide-details
            v-model="spotifyAuth.clientId"
            label="Spotify client ID"/>
        <v-text-field
            class="mt-5"
            variant="filled"
            hide-details
            density="compact"
            :type="showPassword ? 'text' : 'password'"
            v-model="spotifyAuth.secret"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showPassword = !showPassword"
            label="Spotify secret"/>
        <v-btn class="mt-4" v-if="spotifyAuth.hasCredentials && !spotifyAuth.isLoggedIn" variant="tonal" color="green"
               @click="spotifyAuth.login()">
            <v-icon class="mr-2" size="25" color="green">mdi-spotify</v-icon>
            Log in
        </v-btn>
        <div v-if="spotifyAuth.isLoggedIn">
            hi you are logged in {{ library.userInfo.name }}
        </div>
    </div>
</template>

<script setup lang="ts">
import {useLibraryStore} from '../scripts/store/library'
import {ref} from "vue";
import {useSpotifyAuthStore} from "../scripts/store/spotify-auth";

const library = useLibraryStore()
const spotifyAuth = useSpotifyAuthStore()
const showPassword = ref(false);
</script>

<style scoped lang="scss">
.settings {
    padding: 30px;
}
</style>