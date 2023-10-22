<template>
    <v-text-field
        class="mt-5"
        variant="filled"
        density="compact"
        hide-details
        v-model="spotifyAuth.clientId"
        label="Spotify client ID" />
    <v-text-field
        class="mt-5"
        variant="filled"
        hide-details
        density="compact"
        :type="showPassword ? 'text' : 'password'"
        v-model="spotifyAuth.secret"
        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        @click:append="showPassword = !showPassword"
        label="Spotify secret" />
    <v-btn class="mt-4" v-if="spotifyAuth.hasCredentials && !spotifyAuth.isLoggedIn" variant="tonal" color="green"
           @click="spotifyAuth.login()">
        <v-icon class="mr-2" size="25" color="green">mdi-spotify</v-icon>
        Log in
    </v-btn>
    <div v-if="spotifyAuth.isLoggedIn" class="mt-2">
        <v-avatar color="primary">
            <v-img v-if="library.userInfo.avatar" :src="library.userInfo.avatar"></v-img>
            <span v-else>{{ library.userInfo.name[0] }}</span>
        </v-avatar>
        <span class="ml-2">You are logged in {{ library.userInfo.name }}</span>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useLibraryStore } from "../store/library";
import { useSpotifyAuthStore } from "../store/spotify-auth";
const library = useLibraryStore();
const spotifyAuth = useSpotifyAuthStore();

const showPassword = ref(false);
</script>

<style scoped lang="less">

</style>
