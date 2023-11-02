<template>
    <v-text-field
        v-model="spotifyAuth.clientId"
        class="mt-5"
        density="compact"
        hide-details
        label="Spotify client ID"
        variant="filled"
        :color="base.themeColor"
    />
    <v-text-field
        v-model="spotifyAuth.secret"
        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showPassword ? 'text' : 'password'"
        class="mt-5"
        density="compact"
        hide-details
        label="Spotify secret"
        variant="filled"
        @click:append="showPassword = !showPassword"
        :color="base.themeColor"
    />
    <v-btn
        v-if="spotifyAuth.hasCredentials && !spotifyAuth.isLoggedIn"
        class="mt-4"
        color="green"
        variant="tonal"
        @click="spotifyAuth.login()"
    >
        <v-icon class="mr-2" color="green" size="25">mdi-spotify</v-icon>
        Log in
    </v-btn>
    <div v-if="spotifyAuth.isLoggedIn" class="mt-2">
        <v-avatar color="primary">
            <v-img
                v-if="library.userInfo.avatar"
                :src="library.userInfo.avatar"
            ></v-img>
            <span v-else>{{ library.userInfo.name[0] }}</span>
        </v-avatar>
        <span class="ml-2">You are logged in {{ library.userInfo.name }}</span>
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useLibraryStore } from "../store/library";
import { useSpotifyAuthStore } from "../store/spotify-auth";
import { useBaseStore } from "../store/base";

const base = useBaseStore();
const library = useLibraryStore();
const spotifyAuth = useSpotifyAuthStore();

const showPassword = ref(false);
</script>

<style lang="less" scoped></style>
