<template>
    <h1>Settings</h1>
    <h2>API Keys</h2>
    <v-text-field :model-value="spotify.secret" label="Spotify secret" ></v-text-field>
    <v-text-field :model-value="spotify.clientId" label="Spotify client ID" ></v-text-field>
</template>

<script setup>
import {useSpotifyStore} from '../scripts/store/spotify'
const spotify = useSpotifyStore();
console.log(spotify);
spotify.secret = 'asdf';
</script>

<style scoped>

</style>