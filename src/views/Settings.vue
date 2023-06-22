<template>
    <div class="settings mt-8">
        <h1>Settings</h1>
        <v-divider class="mt-2 mb-2"></v-divider>
        <h3>
            <v-icon :color="spotify.hasCredentials ? 'green' : 'default'">mdi-spotify</v-icon>
            Spotify
        </h3>
        <v-text-field
            class="mt-5"
            variant="filled"
            density="compact"
            hide-details
            v-model="spotify.clientId"
            label="Spotify client ID"/>
        <v-text-field
            class="mt-5"
            variant="filled"
            hide-details
            density="compact"
            :type="showPassword ? 'text' : 'password'"
            v-model="spotify.secret"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showPassword = !showPassword"
            label="Spotify secret"/>
        <v-btn class="mt-4" v-if="spotify.hasCredentials && !spotify.isLoggedIn" variant="tonal" color="green"
               @click="spotify.login()">
            <v-icon class="mr-2" size="25" color="green">mdi-spotify</v-icon>
            Log in
        </v-btn>
        <div v-if="spotify.isLoggedIn">
            hi you are logged in {{ spotify.userInfo.name }}
        </div>
        <h3 class="mt-5">
            <v-icon :color="spotify.hasYoutubeKey ? 'red' : 'default'">mdi-youtube</v-icon>
            YouTube
        </h3>
        <v-text-field
            class="mt-5"
            variant="filled"
            density="compact"
            hide-details
            v-model="spotify.youtubeKey"
            label="YouTube API Key"/>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from '../scripts/store/spotify'
import {ref} from "vue";

const spotify = useSpotifyStore()
const showPassword = ref(false);
</script>

<style scoped>
.settings {
    padding: 30px;
}
</style>