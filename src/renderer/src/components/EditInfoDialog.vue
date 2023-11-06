<template>
    <v-dialog
        v-model="editDialog.show"
        :class="{ dark: base.isDark }"
        :scrollable="true"
        width="auto"
    >
        <div v-if="track" class="translucent">
            <v-card-title>Edit Track Info</v-card-title>
            <v-divider />
            <v-card-text>
                <v-list-subheader class="mb-2">Title</v-list-subheader>
                <v-text-field
                    v-model="editDialog.title"
                    :color="base.themeColor"
                    :single-line="true"
                    density="compact"
                    hide-details
                ></v-text-field>

                <v-list-subheader class="mb-2 mt-4">Artists</v-list-subheader>
                <div>
                    <v-text-field
                        v-for="(_, i) in editDialog.artists"
                        v-model="editDialog.artists[i]"
                        :color="base.themeColor"
                        :single-line="true"
                        density="compact"
                        hide-details
                    >
                    </v-text-field>
                </div>

                <v-list-subheader class="mb-2 mt-4">Duration</v-list-subheader>
                <v-range-slider
                    v-model="editDialog.durationRange"
                    :color="base.themeColor"
                    :max="track.duration_ms / 1000"
                    :min="0"
                    :step="0.1"
                    :strict="true"
                >
                    <template v-slot:prepend>
                        <v-text-field
                            v-model="editDialog.durationRange[0]"
                            :color="base.themeColor"
                            :max="track.duration_ms / 1000"
                            :min="0"
                            :single-line="true"
                            :step="0.1"
                            class="duration-input"
                            density="compact"
                            hide-details
                            type="number"
                        ></v-text-field>
                    </template>
                    <template v-slot:append>
                        <v-text-field
                            v-model="editDialog.durationRange[1]"
                            :color="base.themeColor"
                            :max="track.duration_ms / 1000"
                            :min="0"
                            :single-line="true"
                            :step="0.1"
                            class="duration-input"
                            density="compact"
                            hide-details
                            type="number"
                        ></v-text-field>
                    </template>
                </v-range-slider>
                <v-btn
                    v-if="changesObject !== null"
                    :color="base.themeColor"
                    prepend-icon="mdi-restore"
                    variant="tonal"
                    @click="revert"
                >
                    Revert to original values
                </v-btn>
            </v-card-text>
            <v-divider class="mb-3"></v-divider>
            <v-card-item>
                <simple-player
                    :color="base.themeColor"
                    :end-time="editDialog.durationRange[1]"
                    :insta-load="true"
                    :play-button-size="50"
                    :start-time="editDialog.durationRange[0]"
                    :track="track"
                ></simple-player>
            </v-card-item>
            <v-card-actions class="mt-1">
                <spacer></spacer>
                <v-btn
                    :color="base.themeColor"
                    variant="tonal"
                    @click="applyChanges"
                >
                    Apply Changes
                </v-btn>
                <v-btn variant="tonal" @click="editDialog.show = false">
                    Cancel
                </v-btn>
            </v-card-actions>
        </div>
    </v-dialog>
</template>

<script lang="ts" setup>
import { baseDb, useBaseStore } from "../store/base";
import { useLibraryStore } from "../store/library";
import { computed, ref, watch } from "vue";
import SimplePlayer from "./SimplePlayer.vue";
import Spacer from "./Spacer.vue";
import { TrackChanges } from "../scripts/types";

const base = useBaseStore();
const library = useLibraryStore();
const editDialog = computed(() => library.editDialog);
const track = computed(() => library.editDialog.likedTrack?.track);
const changesObject = ref(null as TrackChanges | null);
watch(track, async () => {
    if (!track.value) return;
    editDialog.value.title = track.value.name;
    editDialog.value.artists = track.value.artists.map((a) => a.name);

    let db = await baseDb;
    changesObject.value = (await db.get("trackEdits", track.value.id)) ?? null;
});

function revert() {
    if (changesObject.value === null) return;
    editDialog.value.durationRange = [
        0,
        Math.max(
            changesObject.value.original.endTime,
            (track.value?.duration_ms ?? 0) / 1000,
        ),
    ];
    editDialog.value.artists = changesObject.value.original.artists;
    editDialog.value.title = changesObject.value.original.title;
}

async function applyChanges() {
    if (
        editDialog.value.likedTrack !== null &&
        (await library.applyEditChanges(
            editDialog.value.likedTrack,
            editDialog.value.title,
            editDialog.value.artists,
            editDialog.value.durationRange,
        ))
    ) {
        editDialog.value.show = false;
    } else {
        base.addSnack("Couldn't apply changes, can't find related track.");
    }
}
</script>
<style lang="less" scoped>
.translucent {
    backdrop-filter: blur(40px) saturate(150%) brightness(130%);
    background-color: rgba(var(--v-theme-background), 0.5);
    border-radius: 8px;
    box-shadow: 0 4px 2px 0 rgba(0, 0, 0, 0.2);
    width: calc(100vw - 200px);
}

.dark .translucent {
    backdrop-filter: blur(40px) saturate(150%) brightness(70%) !important;
    background-color: rgba(var(--v-theme-background), 0.7) !important;
}

.duration-input {
    width: 100px;
}

h1,
h2,
h3,
h4 {
    text-align: left;
    font-weight: 300 !important;
}
</style>
