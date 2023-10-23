<template>
    <div class="mb-1 collection-buttons">
        <div class="play-buttons" v-if="collection">
            <v-divider />
            <v-btn icon="mdi-play-outline" variant="text" @click="player.playCollection(collection)" />
            <v-btn icon="mdi-shuffle" variant="text" @click="player.shuffleCollection(collection)" />
            <v-btn v-if="showFilter" icon="mdi-filter-outline" variant="text" />
            <like-button icon-button v-if="likeItem" variant="no-theme" :item="likeItem" />
            <v-tooltip text="Go to artist radio" location="top">
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props"
                           variant="text"
                           icon="mdi-radio-tower"
                           v-if="collection.context && collection.type === 'artist'"
                           :to="`/radio?id=${base.radioId()}&seed_artists=${collection.context.id}`" />
                </template>
            </v-tooltip>
            <v-tooltip text="Make available offline" location="top">
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props"
                           variant="text"
                           icon="mdi-cloud-arrow-down-outline"
                           v-if="collection.type === 'playlist' || collection.type === 'album'"
                           @click="downloadTracks" />
                </template>
            </v-tooltip>
            <v-divider />
        </div>
        <div class="download-stats" v-if="downloadState && downloadState.loading && !downloadState.canceled">
            <div class="download-info">
                <p>Downloaded {{ downloadState.downloaded }} / {{ downloadState.total }} tracks</p>
                <v-btn @click="cancelDownload" class="cancel-button" variant="text" density="compact" size="16"
                       icon="mdi-close"></v-btn>
            </div>
            <v-progress-linear rounded class="progress-bar mb-3 mt-2" :model-value="100 * (downloadState.downloaded / downloadState.total)"/>
        </div>
    </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from "../store/player";
import type { PropType } from "vue";
import type { Item, ItemCollection } from "../scripts/types";
import LikeButton from "./LikeButton.vue";
import { useBaseStore } from "../store/base";
import { usePlatformStore } from "../store/electron";
import { computed } from "vue";

const base = useBaseStore();
const props = defineProps({
    collection: {
        type: Object as PropType<ItemCollection | null>,
        required: true
    },
    likeItem: {
        type: Object as PropType<Item | null>,
        default: () => null
    },
    showFilter: {
        type: Boolean,
        default: false
    }
});
const platform = usePlatformStore();
const player = usePlayerStore();
const downloadState = computed(() => platform.downloadState.get(props.collection?.id ?? "")?.value);

async function cancelDownload() {
    if (downloadState.value === null || downloadState.value === undefined)
        return;
    downloadState.value.canceled = true;
}

function downloadTracks() {
    if (props.collection === null || props.collection.tracks.length === 0) return;
    platform.downloadTracks(props.collection.id, props.collection.tracks);
}
</script>

<style scoped lang="less">
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
    opacity: .8;
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
    opacity: .6;
}

.cancel-button:hover {
    opacity: 1;
}
</style>
