<template>
    <div class="settings mt-8">
        <h1>Settings</h1>
        <v-divider class="mt-2 mb-2"></v-divider>
        <h3>
            <v-icon :color="spotifyAuth.hasCredentials ? 'green' : 'default'">mdi-spotify</v-icon>
            Spotify
        </h3>
        <authentication />
        <v-divider class="mt-3 mb-3" />

        <h3>Export</h3>
        <v-btn prepend-icon="mdi-export"
               :loading="platform.exportMp3State.loading"
               @click="platform.exportLikedTracks"
               :block="true" variant="tonal"
               class="mt-2">
            Export liked track mp3s to folder
        </v-btn>
        <template v-if="downloadState && !downloadState.canceled">
            <v-progress-linear class="mt-2" rounded v-if="downloadState.loading"
                               :model-value="100 * downloadState.downloaded / downloadState.total" />
            <span
                v-if="downloadState.loading">Exported {{ downloadState.downloaded
                }} / {{ downloadState.total }}</span>
            <br>
            <v-btn @click="downloadState.canceled = true" variant="tonal" color="error"
                   prepend-icon="mdi-cancel" class="mt-2"
                   v-if="downloadState.loading">Cancel exporting
            </v-btn>
        </template>
        <v-divider class="mt-3 mb-3" />
        <h3>Audio settings</h3>
        <p>Attempt to make loud tracks quieter to match closer with quiet tracks.</p>
        <v-switch v-model="player.normalizeVolume" label="Normalize volume" :color="base.themeColor" />
        <v-btn variant="tonal" :loading="updateLoading" @click="updateYtdlp">Update YT-DLP</v-btn>
        <v-sheet :color="base.themeColor" rounded class="update-result" v-if="updateResult !== ''">
            {{ updateResult }}
        </v-sheet>
    </div>
</template>

<script setup lang="ts">
import { usePlatformStore } from "../store/electron";
import { useBaseStore } from "../store/base";
import { usePlayerStore } from "../store/player";
import { useSpotifyAuthStore } from "../store/spotify-auth";
import Authentication from "../components/Authentication.vue";
import { computed, ref } from "vue";

const player = usePlayerStore();
const platform = usePlatformStore();
const base = useBaseStore();
const spotifyAuth = useSpotifyAuthStore();

const updateLoading = ref(false);
const updateResult = ref("");
const downloadState = computed(() => platform.downloadState.get("liked")?.value);

async function updateYtdlp() {
    updateLoading.value = true;
    updateResult.value = await platform.updateYtdlp();
    updateLoading.value = false;
}
</script>

<style scoped lang="less">
.settings {
    padding: 30px;
}

.update-result {
    font-family: monospace;
    margin-top: 20px;
    word-wrap: break-word;
    padding: 10px;
}
</style>
