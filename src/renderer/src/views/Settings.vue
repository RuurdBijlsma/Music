<template>
    <div class="settings mt-8">
        <h1>Settings</h1>
        <v-divider class="mt-2 mb-2"></v-divider>
        <h3>
            <v-icon :color="spotifyAuth.hasCredentials ? 'green' : 'default'">mdi-spotify</v-icon>
            Spotify
        </h3>
        <authentication/>
        <v-divider class="mt-3 mb-3" />
        <h3>Export</h3>
        <v-btn prepend-icon="mdi-export"
               :loading="platform.exportMp3State.loading"
               @click="platform.exportLikedTracks"
               :block="true" variant="tonal"
               class="mt-2">
            Export liked track mp3s to folder
        </v-btn>
        <v-progress-linear class="mt-2" rounded v-if="platform.exportMp3State.loading"
                           :model-value="100 * platform.exportMp3State.exported / platform.exportMp3State.total" />
        <span
            v-if="platform.exportMp3State.loading">Exported {{ platform.exportMp3State.exported
            }} / {{ platform.exportMp3State.total }}</span>
        <br>
        <v-btn @click="platform.cancelExport" variant="tonal" color="error"
               prepend-icon="mdi-cancel" class="mt-2"
               v-if="platform.exportMp3State.loading">Cancel exporting
        </v-btn>
        <v-divider class="mt-3 mb-3" />
        <h3>Audio settings</h3>
        <p>Attempt to make loud tracks quieter to match closer with quiet tracks.</p>
        <v-switch v-model="player.normalizeVolume" label="Normalize volume" :color="base.themeColor" />
    </div>
</template>

<script setup lang="ts">
import { usePlatformStore } from "../store/electron";
import { useBaseStore } from "../store/base";
import { usePlayerStore } from "../store/player";
import { useSpotifyAuthStore } from "../store/spotify-auth";
import Authentication from "../components/Authentication.vue";

const player = usePlayerStore();
const platform = usePlatformStore();
const base = useBaseStore();
const spotifyAuth = useSpotifyAuthStore();
</script>

<style scoped lang="less">
.settings {
    padding: 30px;
}
</style>
