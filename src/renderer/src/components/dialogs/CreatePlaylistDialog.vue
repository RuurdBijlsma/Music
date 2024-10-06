<template>
    <v-dialog
        v-model="dialog.playlist.show"
        :class="{ dark: ui.isDark }"
        :scrollable="true"
        width="auto"
    >
        <v-card class="translucent">
            <h2 class="mb-5">Create a new playlist</h2>

            <v-divider class="mb-4"></v-divider>

            <v-list-item
                v-if="dialog.playlist.startTrack"
                :prepend-avatar="itemImage(dialog.playlist.startTrack)"
                class="mb-2"
            >
                <v-list-item-title>{{ dialog.playlist.startTrack.name }} </v-list-item-title>
                <v-list-item-subtitle>
                    <artists-span :artists="dialog.playlist.startTrack.artists" />
                </v-list-item-subtitle>
            </v-list-item>

            <v-divider class="mb-5 mt-2"></v-divider>

            <v-form @submit.prevent="createPlaylist">
                <v-text-field
                    v-model="dialog.playlist.title"
                    :color="ui.themeColor"
                    hide-details
                    label="Title"
                ></v-text-field>
                <v-textarea
                    v-model="dialog.playlist.description"
                    :color="ui.themeColor"
                    hide-details
                    label="Description"
                ></v-textarea>
                <v-chip-group
                    v-model="chips"
                    :color="ui.themeColor"
                    :mandatory="true"
                    class="mt-3 mb-3"
                >
                    <v-chip prepend-icon="mdi-earth">Public</v-chip>
                    <v-chip prepend-icon="mdi-share-variant">Collaborative </v-chip>
                    <v-chip prepend-icon="mdi-lock-outline">Private</v-chip>
                </v-chip-group>
                <v-btn
                    :block="true"
                    :color="ui.themeColor"
                    :loading="loading"
                    type="submit"
                    variant="tonal"
                >
                    Create Playlist
                </v-btn>
            </v-form>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useLibraryStore } from '../../store/library'
import { useUIStore } from '../../store/UI/UIStore'
import ArtistsSpan from '../ArtistsSpan.vue'
import { ref, watch } from 'vue'
import { useDialogStore } from '../../store/UI/dialogStore'
import { itemImage } from '../../scripts/item-utils'

const library = useLibraryStore()
const ui = useUIStore()
const dialog = useDialogStore()

const chips = ref(0)
const chipOptions = [
    [true, false],
    [false, true],
    [false, false]
]
watch(chips, () => {
    const [isPublic, isCollaborative] = chipOptions[chips.value]
    dialog.playlist.isPublic = isPublic
    dialog.playlist.isCollaborative = isCollaborative
})

const loading = ref(false)

async function createPlaylist() {
    loading.value = true
    const result = await library.createPlaylistFromDialog()
    if (!result) {
        dialog.addSnack('Something went wrong creating the playlist')
    }
    loading.value = false
}
</script>

<style lang="less" scoped>
.translucent {
    backdrop-filter: blur(40px) saturate(150%) brightness(130%);
    background-color: rgba(var(--v-theme-background), 0.5);
    border-radius: 8px;
    box-shadow: 0 4px 2px 0 rgba(0, 0, 0, 0.2);
    width: calc(80vw - 150px);
    padding: 20px;
}

.dark .translucent {
    backdrop-filter: blur(40px) saturate(150%) brightness(70%) !important;
    background-color: rgba(var(--v-theme-background), 0.7) !important;
}
</style>
