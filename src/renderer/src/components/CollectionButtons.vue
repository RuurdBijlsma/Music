<template>
    <div class="mb-1 collection-buttons">
        <div v-if="collection" class="play-buttons">
            <v-divider />
            <v-btn
                icon="mdi-play-outline"
                variant="text"
                @click="player.playCollection(collection)"
            />
            <v-btn
                icon="mdi-shuffle"
                variant="text"
                @click="player.shuffleCollection(collection)"
            />
            <v-btn v-if="showFilter" icon="mdi-filter-outline" variant="text" />
            <like-button
                v-if="likeItem"
                :item="likeItem"
                icon-button
                variant="no-theme"
            />
            <v-tooltip location="top" text="Go to artist radio">
                <template v-slot:activator="{ props }">
                    <v-btn
                        v-if="
                            collection.context && collection.type === 'artist'
                        "
                        :to="`/radio?id=${base.radioId()}&seed_artists=${
                            collection.context.id
                        }`"
                        icon="mdi-radio-tower"
                        v-bind="props"
                        variant="text"
                    />
                </template>
            </v-tooltip>
            <v-tooltip location="top" text="Make available offline">
                <template v-slot:activator="{ props }">
                    <v-btn
                        v-if="
                            collection.type === 'playlist' ||
                            collection.type === 'album'
                        "
                        :icon="
                            isLibraryDownloaded
                                ? 'mdi-cloud'
                                : 'mdi-cloud-arrow-down-outline'
                        "
                        v-bind="props"
                        variant="text"
                        @click="downloadTracks"
                    />
                </template>
            </v-tooltip>
            <v-divider />
        </div>
        <div
            v-if="
                downloadState &&
                downloadState.loading &&
                !downloadState.canceled
            "
            class="download-stats"
        >
            <div class="download-info">
                <p>
                    Downloaded {{ downloadState.downloaded }} /
                    {{ downloadState.total }} tracks
                </p>
                <v-btn
                    class="cancel-button"
                    density="compact"
                    icon="mdi-close"
                    size="16"
                    variant="text"
                    @click="cancelDownload"
                ></v-btn>
            </div>
            <v-progress-linear
                :model-value="
                    100 * (downloadState.downloaded / downloadState.total)
                "
                class="progress-bar mb-3 mt-2"
                rounded
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { usePlayerStore } from "../store/player/player";
import type { PropType } from "vue";
import { computed, toRaw, watch } from "vue";
import type { Item, ItemCollection } from "../scripts/types";
import LikeButton from "./LikeButton.vue";
import { baseDb, useBaseStore } from "../store/base";
import { usePlatformStore } from "../store/electron";
import { useLibraryStore } from "../store/library";
import { useRoute } from "vue-router";

const base = useBaseStore();
const library = useLibraryStore();
const props = defineProps({
    collection: {
        type: Object as PropType<ItemCollection | null>,
        required: true,
    },
    likeItem: {
        type: Object as PropType<Item | null>,
        default: () => null,
    },
    showFilter: {
        type: Boolean,
        default: false,
    },
});
const platform = usePlatformStore();
const player = usePlayerStore();
const route = useRoute();
const downloadState = computed(
    () => platform.downloadState.get(props.collection?.id ?? "")?.value,
);
const isLibraryDownloaded = computed(() => {
    if (props.collection === null) return false;
    return library.offlineCollections.has(props.collection.id);
});

async function checkTracksDownloaded() {
    if (props.collection === null || props.collection.tracks.length === 0)
        return;
    let isDownloaded = await platform.checkTracksDownloaded(
        props.collection.tracks,
    );
    let change = false;
    if (isDownloaded && !isLibraryDownloaded.value) {
        library.offlineCollections.add(props.collection.id);
        change = true;
    } else if (!isDownloaded && isLibraryDownloaded.value) {
        library.offlineCollections.delete(props.collection.id);
        change = true;
    }
    if (change) {
        (await baseDb)
            .put(
                "spotify",
                [...toRaw(library.offlineCollections)],
                "offlineCollections",
            )
            .then();
    }
}

watch(route, () => checkTracksDownloaded());
// checkTracksDownloaded();

async function cancelDownload() {
    if (downloadState.value === null || downloadState.value === undefined)
        return;
    downloadState.value.canceled = true;
}

function downloadTracks() {
    if (props.collection === null || props.collection.tracks.length === 0)
        return;
    platform.downloadTracks(props.collection.id, props.collection.tracks);
}
</script>

<style lang="less" scoped>
.collection-buttons {
    width: 100%;
}

.play-buttons {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
}

.download-stats {
    text-align: center;
    opacity: 0.8;
    font-size: 14px;
    font-weight: bolder;
    width: 100%;
}

.progress-bar {
    width: 70%;
}

.download-info {
    display: flex;
    justify-content: center;
    gap: 10px;
    align-items: center;
    width: 100%;
}

.cancel-button {
    opacity: 0.6;
}

.cancel-button:hover {
    opacity: 1;
}
</style>
