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
        <div v-if="spotifyAuth.isLoggedIn" class="mt-2">
            <v-avatar color="primary">
                <v-img v-if="library.userInfo.avatar" :src="library.userInfo.avatar"></v-img>
                <span v-else>{{ library.userInfo.name[0] }}</span>
            </v-avatar>
            <span class="ml-2">You are logged in {{ library.userInfo.name }}</span>
        </div>
        <v-divider class="mt-3 mb-3"/>
        <h3>Export</h3>
        <v-btn prepend-icon="mdi-export"
               :loading="platform.exportMp3State.loading"
               @click="platform.exportLikedTracks"
               block variant="tonal"
               class="mt-2">
            Export liked track mp3s to folder
        </v-btn>
        <v-progress-linear class="mt-2" rounded v-if="platform.exportMp3State.loading"
                           :model-value="100 * platform.exportMp3State.exported / platform.exportMp3State.total"/>
        <span v-if="platform.exportMp3State.loading">Exported {{platform.exportMp3State.exported}} / {{platform.exportMp3State.total}}</span>
        <br>
        <v-btn @click="platform.cancelExport" variant="tonal" color="error"
               prepend-icon="mdi-cancel" class="mt-2"
               v-if="platform.exportMp3State.loading">Cancel exporting</v-btn>
    </div>
</template>

<script setup lang="ts">
import {useLibraryStore} from '../scripts/store/library'
import {ref} from "vue";
import {useSpotifyAuthStore} from "../scripts/store/spotify-auth";
import {usePlatformStore} from "../scripts/store/electron";
import {useBaseStore} from "../scripts/store/base";
import ProgressBar from "../components/ProgressBar.vue";

const library = useLibraryStore()
const spotifyAuth = useSpotifyAuthStore()
const platform = usePlatformStore()
const base = useBaseStore()
const showPassword = ref(false);
</script>

<style scoped lang="scss">
.settings {
    padding: 30px;
}
</style>