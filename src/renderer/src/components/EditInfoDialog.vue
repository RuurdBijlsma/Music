<template>
    <v-dialog
        :class="{ dark: base.isDark }"
        v-model="editDialog.show"
        :scrollable="true"
        width="auto"
    >
        <div class="translucent" v-if="track">
            <v-card-title>Edit Track Info</v-card-title>
            <v-divider />
            <v-card-text>
                <v-list-subheader class="mb-2">Title</v-list-subheader>
                <v-text-field
                    v-model="editDialog.title"
                    hide-details
                    :single-line="true"
                    :color="base.themeColor"
                    density="compact"
                ></v-text-field>

                <v-list-subheader class="mb-2 mt-4">Artists</v-list-subheader>
                <div>
                    <v-text-field
                        v-for="(_, i) in editDialog.artists"
                        v-model="editDialog.artists[i]"
                        hide-details
                        :color="base.themeColor"
                        :single-line="true"
                        density="compact"
                    >
                        <template v-slot:append>
                            <v-btn
                                size="40"
                                variant="tonal"
                                :color="base.themeColor"
                                icon="mdi-delete"
                                @click="editDialog.artists.splice(i, 1)"
                            ></v-btn>
                        </template>
                    </v-text-field>
                    <v-btn
                        prepend-icon="mdi-playlist-plus"
                        class="mt-3"
                        @click="editDialog.artists.push('')"
                        variant="tonal"
                        :color="base.themeColor"
                        >Add artist
                    </v-btn>
                </div>

                <v-list-subheader class="mb-2 mt-4">Duration</v-list-subheader>
                <v-range-slider
                    v-model="editDialog.durationRange"
                    :color="base.themeColor"
                    :max="track.duration_ms / 1000"
                    :min="0"
                    :strict="true"
                    :step="0.1"
                >
                    <template v-slot:prepend>
                        <v-text-field
                            v-model="editDialog.durationRange[0]"
                            hide-details
                            :single-line="true"
                            :color="base.themeColor"
                            type="number"
                            :step="0.1"
                            :min="0"
                            :max="track.duration_ms / 1000"
                            class="duration-input"
                            density="compact"
                        ></v-text-field>
                    </template>
                    <template v-slot:append>
                        <v-text-field
                            v-model="editDialog.durationRange[1]"
                            hide-details
                            :single-line="true"
                            type="number"
                            :color="base.themeColor"
                            :step="0.1"
                            :min="0"
                            :max="track.duration_ms / 1000"
                            class="duration-input"
                            density="compact"
                        ></v-text-field>
                    </template>
                </v-range-slider>
            </v-card-text>
            <v-divider class="mb-3"></v-divider>
            <v-card-item>
                <simple-player
                    :play-button-size="50"
                    :track="track"
                    :color="base.themeColor"
                    :insta-load="true"
                    :end-time="editDialog.durationRange[1]"
                    :start-time="editDialog.durationRange[0]"
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
import { useBaseStore } from "../store/base";
import { useLibraryStore } from "../store/library";
import { computed, toRaw, watch } from "vue";
import SimplePlayer from "./SimplePlayer.vue";
import Spacer from "./Spacer.vue";

const base = useBaseStore();
const library = useLibraryStore();
const editDialog = computed(() => library.editDialog);
const track = computed(() => library.editDialog.track);
watch(track, () => {
    if (track.value === null) return;
    editDialog.value.durationRange[0] = 0;
    editDialog.value.durationRange[1] = track.value.duration_ms / 1000;
    editDialog.value.title = track.value.name;
    editDialog.value.artists = track.value.artists.map((a) => a.name);
    console.log(toRaw(editDialog.value));
});

async function applyChanges() {
    if (await library.applyEditChanges()) {
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
