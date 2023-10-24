<template>
    <div class="settings mt-8">
        <h1>Settings</h1>
        <v-divider class="mt-2 mb-2"></v-divider>
        <h3>
            <v-icon :color="spotifyAuth.hasCredentials ? 'green' : 'default'"
                >mdi-spotify</v-icon
            >
            Spotify
        </h3>
        <authentication />
        <v-divider class="mt-3 mb-3" />

        <h3>Export</h3>
        <v-btn
            :block="true"
            :loading="platform.exportMp3State.loading"
            class="mt-2"
            prepend-icon="mdi-export"
            variant="tonal"
            @click="platform.exportLikedTracks"
        >
            Export liked track mp3s to folder
        </v-btn>
        <template v-if="downloadState && !downloadState.canceled">
            <v-progress-linear
                v-if="downloadState.loading"
                :model-value="
                    (100 * downloadState.downloaded) / downloadState.total
                "
                class="mt-2"
                rounded
            />
            <span v-if="downloadState.loading"
                >Exported {{ downloadState.downloaded }} /
                {{ downloadState.total }}</span
            >
            <br />
            <v-btn
                v-if="downloadState.loading"
                class="mt-2"
                color="error"
                prepend-icon="mdi-cancel"
                variant="tonal"
                @click="downloadState.canceled = true"
                >Cancel exporting
            </v-btn>
        </template>
        <v-divider class="mt-3 mb-3" />
        <h3>Audio settings</h3>
        <p>
            Attempt to make loud tracks quieter to match closer with quiet
            tracks.
        </p>
        <v-switch
            v-model="player.normalizeVolume"
            :color="base.themeColor"
            label="Normalize volume"
        />
        <v-btn :loading="updateLoading" variant="tonal" @click="updateYtdlp"
            >Update YT-DLP</v-btn
        >
        <v-sheet
            v-if="updateResult !== ''"
            :color="base.themeColor"
            class="update-result"
            rounded
        >
            {{ updateResult }}
        </v-sheet>
    </div>
</template>

<script lang="ts" setup>
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
const downloadState = computed(
    () => platform.downloadState.get("liked")?.value,
);

async function updateYtdlp() {
    updateLoading.value = true;
    updateResult.value = await platform.updateYtdlp();
    updateLoading.value = false;
}
</script>

<style lang="less" scoped>
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
