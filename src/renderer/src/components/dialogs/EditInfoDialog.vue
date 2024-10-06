<template>
    <v-dialog
        v-model="editDialog.show"
        :class="{ dark: ui.isDark }"
        :scrollable="true"
        width="auto"
    >
        <div v-if="editDialog.loading" class="edit-loading">
            <v-progress-circular :indeterminate="true" />
        </div>
        <div v-else-if="editDialog.likedTrack && editDialog.trackData && track" class="translucent">
            <v-card-title>Edit Track Info</v-card-title>
            <v-divider />
            <v-card-text>
                <v-list-subheader class="mb-2">Title</v-list-subheader>
                <v-text-field
                    v-model="editDialog.title"
                    :color="ui.themeColor"
                    :single-line="true"
                    density="compact"
                    hide-details
                ></v-text-field>

                <v-list-subheader class="mb-2 mt-4">Artists</v-list-subheader>
                <div>
                    <v-text-field
                        v-for="(_, i) in editDialog.artists"
                        v-model="editDialog.artists[i]"
                        :color="ui.themeColor"
                        :single-line="true"
                        density="compact"
                        hide-details
                    >
                    </v-text-field>
                </div>

                <v-list-subheader class="mb-2 mt-4">Duration</v-list-subheader>
                <v-range-slider
                    v-model="editDialog.durationRange"
                    :color="ui.themeColor"
                    :max="track.duration_ms / 1000"
                    :min="0"
                    :step="0.1"
                    :strict="true"
                >
                    <template #prepend>
                        <v-text-field
                            v-model="editDialog.durationRange[0]"
                            :color="ui.themeColor"
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
                    <template #append>
                        <v-text-field
                            v-model="editDialog.durationRange[1]"
                            :color="ui.themeColor"
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
                    v-if="revertPossible"
                    :color="ui.themeColor"
                    prepend-icon="mdi-restore"
                    variant="tonal"
                    @click="revert"
                >
                    Revert to original values
                </v-btn>
                <div v-else class="button-space"></div>
            </v-card-text>
            <v-divider class="mb-3"></v-divider>
            <v-card-item>
                <simple-player
                    :color="ui.themeColor"
                    :end-time="editDialog.durationRange[1]"
                    :insta-load="true"
                    :play-button-size="50"
                    :start-time="editDialog.durationRange[0]"
                    :track="track"
                ></simple-player>
            </v-card-item>
            <v-card-actions class="mt-1">
                <spacer></spacer>
                <v-btn :color="ui.themeColor" variant="tonal" @click="applyChanges">
                    Apply Changes
                </v-btn>
                <v-btn variant="tonal" @click="editDialog.show = false"> Cancel </v-btn>
            </v-card-actions>
        </div>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useLibraryStore } from '../../store/library'
import { computed } from 'vue'
import SimplePlayer from '../player/SimplePlayer.vue'
import Spacer from '../Spacer.vue'
import { useUIStore } from '../../store/UI/UIStore'
import { useDialogStore } from '../../store/UI/dialogStore'

const dialog = useDialogStore()
const ui = useUIStore()
const library = useLibraryStore()
const editDialog = computed(() => dialog.edit)
const likedTrack = computed(() => dialog.edit.likedTrack)
const track = computed(() => likedTrack.value?.track)

const revertPossible = computed(() => {
    if (!likedTrack.value) return false
    return (
        editDialog.value.title !== likedTrack.value.original.name ||
        editDialog.value.artists.toString() !== likedTrack.value.original.artists.toString() ||
        editDialog.value.durationRange[0] !== 0 ||
        editDialog.value.durationRange[1] !== likedTrack.value.track.duration_ms / 1000
    )
})

function revert() {
    if (likedTrack.value === null) return
    editDialog.value.durationRange = [0, likedTrack.value.track.duration_ms / 1000]
    editDialog.value.artists = likedTrack.value.original.artists
    editDialog.value.title = likedTrack.value.original.name
}

async function applyChanges() {
    if (
        editDialog.value.likedTrack !== null &&
        (await library.applyEditChanges(
            editDialog.value.likedTrack,
            editDialog.value.title,
            editDialog.value.artists,
            editDialog.value.durationRange
        ))
    ) {
        editDialog.value.show = false
    } else {
        dialog.addSnack("Couldn't apply changes, can't find related track.")
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

.button-space {
    height: 36px;
}

h1,
h2,
h3,
h4 {
    text-align: left;
    font-weight: 300 !important;
}
</style>
