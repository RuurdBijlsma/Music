<template>
    <div class="settings">
        <h1>Settings</h1>
        <v-divider class="mt-2 mb-2"></v-divider>
        <h2>API Keys</h2>
        <v-text-field v-model="spotify.secret" label="Spotify secret"></v-text-field>
        <v-text-field v-model="spotify.clientId" label="Spotify client ID"></v-text-field>
    </div>
</template>

<script setup>
import {useSpotifyStore} from '../scripts/store/spotify'

const spotify = useSpotifyStore();
console.log(spotify);
spotify.secret = 'asdf';
spotify.clientId = 'ggaa';
</script>

<style scoped>
.settings {
    padding: 30px;
}
</style>