<template>
    <v-dialog
        v-model="playlistDialog.show"
        :class="{ dark: ui.isDark }"
        :scrollable="true"
        width="auto"
    >
        <v-card class="translucent">
            <h2 class="mb-5">Create a new playlist</h2>

            <v-divider class="mb-4"></v-divider>

            <v-list-item
                class="mb-2"
                :prepend-avatar="base.itemImage(playlistDialog.startTrack)"
            >
                <v-list-item-title
                    >{{ playlistDialog.startTrack.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                    <artists-span
                        :artists="playlistDialog.startTrack.artists"
                    />
                </v-list-item-subtitle>
            </v-list-item>

            <v-divider class="mb-5 mt-2"></v-divider>

            <v-form @submit.prevent="createPlaylist">
                <v-text-field
                    hide-details
                    label="Title"
                    :color="ui.themeColor"
                    v-model="playlistDialog.title"
                ></v-text-field>
                <v-textarea
                    hide-details
                    label="Description"
                    :color="ui.themeColor"
                    v-model="playlistDialog.description"
                ></v-textarea>
                <v-chip-group
                    class="mt-3 mb-3"
                    :color="ui.themeColor"
                    :mandatory="true"
                    v-model="chips"
                >
                    <v-chip prepend-icon="mdi-earth">Public</v-chip>
                    <v-chip prepend-icon="mdi-share-variant"
                        >Collaborative
                    </v-chip>
                    <v-chip prepend-icon="mdi-lock-outline">Private</v-chip>
                </v-chip-group>
                <v-btn
                    :loading="loading"
                    type="submit"
                    :block="true"
                    variant="tonal"
                    :color="ui.themeColor"
                >
                    Create Playlist
                </v-btn>
            </v-form>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useLibraryStore } from "../store/library";
import { useUIStore } from "../store/UIStore";
import { storeToRefs } from "pinia";
import { useBaseStore } from "../store/base";
import ArtistsSpan from "./ArtistsSpan.vue";
import { ref, watch } from "vue";

const library = useLibraryStore();
const ui = useUIStore();
const base = useBaseStore();
const { playlistDialog } = storeToRefs(library);

const chips = ref(0);
const chipOptions = [
    [true, false],
    [false, true],
    [false, false],
];
watch(chips, () => {
    let [isPublic, isCollaborative] = chipOptions[chips.value];
    playlistDialog.value.isPublic = isPublic;
    playlistDialog.value.isCollaborative = isCollaborative;
});

const loading = ref(false);

async function createPlaylist() {
    loading.value = true;
    let result = await library.createPlaylistFromDialog();
    if (!result) {
        base.addSnack("Something went wrong creating the playlist");
    }
    loading.value = false;
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
