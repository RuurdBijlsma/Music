<template>
    <div class="settings mt-8">
        <h1>Settings</h1>
        <v-divider class="mt-2 mb-2"></v-divider>
        <authentication />
        <v-divider class="mt-3 mb-3" />

        <h3 class="mb-3">Theme</h3>
        <div class="theme-chips">
            <v-chip-group
                v-model="ui.themeIndex"
                :color="ui.themeColor"
                class="chip-group"
                mandatory
            >
                <v-chip v-for="opt in ui.themeOptions" class="theme-chip"
                    >{{ base.caps(opt) }}
                </v-chip>
            </v-chip-group>
        </div>
        <div v-if="ui.themeOptions[ui.themeIndex] === 'schedule'">
            <h4 class="mt-3">Schedule theme</h4>
            <v-switch
                v-model="ui.useSunSchedule"
                :color="ui.themeColor"
                :label="`Sunrise to sunset${sunTimes}`"
                hide-details
            ></v-switch>
            <template v-if="!ui.useSunSchedule">
                <label class="mr-3" for="light-picker"
                    >Turn on light theme</label
                >
                <input
                    id="light-picker"
                    v-model="ui.lightOnTime"
                    max="24:00"
                    min="00:00"
                    required
                    type="time"
                />
                <div class="mt-3 mb-3" />
                <label class="mr-3" for="dark-picker">Turn on dark theme</label>
                <input
                    id="dark-picker"
                    v-model="ui.darkOnTime"
                    max="24:00"
                    min="00:00"
                    required
                    type="time"
                />
            </template>
        </div>
        <v-divider class="mt-3 mb-3" />

        <h3 class="mb-3">Backup & restore</h3>
        <v-btn
            :block="true"
            :color="ui.themeColor"
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
                :color="ui.themeColor"
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

        <div v-if="ruurdAuth.isLoggedIn" class="file-buttons mt-3">
            <v-btn
                :append-icon="
                    exportResult === 'none'
                        ? ''
                        : exportResult === 'success'
                        ? 'mdi-check-bold'
                        : 'mdi-alert-circle-outline'
                "
                :color="ui.themeColor"
                :loading="exportLoading"
                variant="tonal"
                @click="exportToServer"
                >Backup to server
            </v-btn>
            <v-btn
                :color="ui.themeColor"
                :loading="importLoading"
                variant="tonal"
                @click="importFromServer"
            >
                Restore from server
            </v-btn>
        </div>

        <div class="file-buttons mt-3">
            <v-btn
                :color="ui.themeColor"
                :loading="exportFileLoading"
                variant="tonal"
                @click="exportToFile"
            >
                Backup to file
            </v-btn>
            <v-btn
                :color="ui.themeColor"
                :loading="importFileLoading"
                variant="tonal"
                @click="importFromFile"
            >
                Restore from file
            </v-btn>
        </div>

        <v-switch
            v-if="ruurdAuth.isLoggedIn"
            v-model="base.autoBackup"
            :color="ui.themeColor"
            hide-details
            label="Daily automatic backup to server"
        />

        <v-divider class="mt-3 mb-3" />
        <h3 class="mb-3">Audio settings</h3>
        <p>
            Attempt to make loud tracks quieter to match closer with quiet
            tracks.
        </p>
        <v-switch
            v-model="player.normalizeVolume"
            :color="ui.themeColor"
            hide-details
            label="Normalize volume"
        />
        <v-btn
            :block="true"
            :color="ui.themeColor"
            :loading="updateLoading"
            variant="tonal"
            @click="updateYtdlp"
            >Update YT-DLP
        </v-btn>
        <v-sheet
            v-if="updateResult !== ''"
            :color="ui.themeColor"
            class="update-result"
            rounded
        >
            {{ updateResult }}
        </v-sheet>

        <div class="version-string mt-10">
            <span class="mr-2">Ruurd Music</span
            ><span class="bold-version">v{{ appVersion }}</span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { usePlatformStore } from "../store/electron";
import { useBaseStore } from "../store/base";
import { usePlayerStore } from "../store/player/player";
import Authentication from "../components/Authentication.vue";
import { computed, ref } from "vue";
import { useRuurdAuthStore } from "../store/ruurd-auth";
import { useUIStore } from "../store/UIStore";

const player = usePlayerStore();
const platform = usePlatformStore();
const base = useBaseStore();
const ruurdAuth = useRuurdAuthStore();
const ui = useUIStore();
const appVersion = ref("");
window.api.getAppVersion().then((r) => (appVersion.value = r));

const updateLoading = ref(false);
const updateResult = ref("");
const downloadState = computed(
    () => platform.downloadState.get("liked")?.value,
);

const exportLoading = ref(false);
const importLoading = ref(false);
const exportFileLoading = ref(false);
const importFileLoading = ref(false);
const exportResult = ref("none" as "none" | "failed" | "success");

const sunTimes = computed(() => {
    return ` (${ui.sun.rise} - ${ui.sun.set})`;
});

async function exportToServer() {
    exportResult.value = "none";
    exportLoading.value = true;
    try {
        let result = await base.exportToServer();
        exportResult.value = result ? "success" : "failed";
    } catch (e: any) {
        base.addSnack("Backup to server failed: ", e.message);
    }
    exportLoading.value = false;
}

async function importFromServer() {
    importLoading.value = true;
    try {
        await base.importFromServer();
    } catch (e: any) {
        base.addSnack("Restore from server failed: ", e.message);
    }
    importLoading.value = false;
}

async function exportToFile() {
    exportFileLoading.value = true;
    try {
        await base.exportToFile();
    } catch (e: any) {
        base.addSnack("Backup to file failed: ", e.message);
    }
    exportFileLoading.value = false;
}

async function importFromFile() {
    importFileLoading.value = true;
    let result = await base.importFromFile();
    if (result) {
        base.addSnack("Restored backup from file");
    } else {
        base.addSnack("Restore from file failed");
    }
    importFileLoading.value = false;
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

h2,
h3,
h4,
h5 {
    font-weight: 500;
}

.update-result {
    font-family: monospace;
    margin-top: 20px;
    word-wrap: break-word;
    padding: 10px;
}

.theme-chips {
    display: flex;
    justify-content: center;
}

.file-buttons {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.file-buttons > * {
    flex-grow: 1;
}

.version-string {
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0.6;
    font-weight: 300;
}

.bold-version {
    font-weight: 500;
}
</style>
