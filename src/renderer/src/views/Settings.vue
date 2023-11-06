<template>
    <div class="settings mt-8">
        <h1>Settings</h1>
        <v-divider class="mt-2 mb-2"></v-divider>
        <authentication />
        <v-divider class="mt-3 mb-3" />

        <h3 class="mb-3">Export</h3>
        <v-btn
            :block="true"
            :color="base.themeColor"
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
                :color="base.themeColor"
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

        <v-btn
            v-if="ruurdAuth.isLoggedIn"
            :append-icon="
                exportResult === 'none'
                    ? ''
                    : exportResult === 'success'
                    ? 'mdi-check-bold'
                    : 'mdi-alert-circle-outline'
            "
            :block="true"
            :color="base.themeColor"
            :loading="exportLoading"
            class="mt-4"
            variant="tonal"
            @click="exportToServer"
            >Export data to server
        </v-btn>

        <v-divider class="mt-3 mb-3" />
        <h3 class="mb-3">Audio settings</h3>
        <p>
            Attempt to make loud tracks quieter to match closer with quiet
            tracks.
        </p>
        <v-switch
            v-model="player.normalizeVolume"
            :color="base.themeColor"
            hide-details
            label="Normalize volume"
        />
        <v-btn
            :block="true"
            :color="base.themeColor"
            :loading="updateLoading"
            variant="tonal"
            @click="updateYtdlp"
            >Update YT-DLP
        </v-btn>
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
import { usePlayerStore } from "../store/player/player";
import Authentication from "../components/Authentication.vue";
import { computed, ref } from "vue";
import { useRuurdAuthStore } from "../store/ruurd-auth";

const player = usePlayerStore();
const platform = usePlatformStore();
const base = useBaseStore();
const ruurdAuth = useRuurdAuthStore();

const updateLoading = ref(false);
const updateResult = ref("");
const downloadState = computed(
    () => platform.downloadState.get("liked")?.value,
);

const exportLoading = ref(false);
const exportResult = ref("none" as "none" | "failed" | "success");

async function exportToServer() {
    exportResult.value = "none";
    exportLoading.value = true;
    try {
        let result = await base.exportToServer();
        exportResult.value = result ? "success" : "failed";
    } catch (e: any) {
        base.addSnack("Export to server failed: ", e.message);
    }
    exportLoading.value = false;
}

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
