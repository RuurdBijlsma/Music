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

            <v-menu>
                <template #activator="{ props }">
                    <v-btn v-if="showSort" :icon="activeIcon" v-bind="props" variant="text" />
                </template>
                <v-list>
                    <v-list-subheader>Sort tracks</v-list-subheader>
                    <v-list-item v-for="sortOption in sortOptions">
                        <div class="sort-list-item">
                            <div>
                                <v-list-item-title>{{ sortOption.name }} </v-list-item-title>
                            </div>
                            <div class="ml-3 sort-buttons">
                                <v-btn
                                    v-for="option in sortOption.options"
                                    :active="
                                        library.activeSort === option.index &&
                                        library.reverseSort === option.reverse
                                    "
                                    :icon="option.icon"
                                    size="35"
                                    variant="text"
                                    @click="library.sortLiked(option.index, option.reverse)"
                                ></v-btn>
                            </div>
                        </div>
                    </v-list-item>
                </v-list>
            </v-menu>
            <like-button v-if="likeItem" :item="likeItem" icon-button variant="no-theme" />
            <v-tooltip location="top" text="Go to artist radio">
                <template #activator="{ props }">
                    <v-btn
                        v-if="collection.context && collection.type === 'artist'"
                        :to="`/radio?id=${radioId()}&seed_artists=${collection.context.id}`"
                        icon="mdi-radio-tower"
                        v-bind="props"
                        variant="text"
                    />
                </template>
            </v-tooltip>
            <v-tooltip location="top" text="Make available offline">
                <template #activator="{ props }">
                    <v-btn
                        v-if="collection.type === 'playlist' || collection.type === 'album'"
                        :icon="isLibraryDownloaded ? 'mdi-cloud' : 'mdi-cloud-arrow-down-outline'"
                        v-bind="props"
                        variant="text"
                        @click="downloadTracks"
                    />
                </template>
            </v-tooltip>
            <v-divider />
        </div>
        <div
            v-if="downloadState && downloadState.loading && !downloadState.canceled"
            class="download-stats"
        >
            <div class="download-info">
                <p>Downloaded {{ downloadState.downloaded }} / {{ downloadState.total }} tracks</p>
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
                :model-value="100 * (downloadState.downloaded / downloadState.total)"
                class="progress-bar mb-3 mt-2"
                rounded
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { usePlayerStore } from '../store/player/player'
import type { PropType } from 'vue'
import { computed, ref, toRaw, watch } from 'vue'
import type { Item, ItemCollection } from '../scripts/types'
import { usePlatformStore } from '../store/electron'
import { useLibraryStore } from '../store/library'
import { useRoute } from 'vue-router'
import { radioId } from '../scripts/item-utils'
import { baseDb } from '../scripts/database'
import LikeButton from './item/LikeButton.vue'

const sortOptions = ref([
    {
        name: 'Date added',
        options: [
            {
                index: 'newToOld',
                icon: 'mdi-sort-clock-ascending-outline',
                reverse: false
            },
            {
                index: 'oldToNew',
                icon: 'mdi-sort-clock-descending-outline',
                reverse: false
            }
        ]
    },
    {
        name: 'Title',
        options: [
            {
                index: 'title',
                icon: 'mdi-sort-alphabetical-ascending',
                reverse: false
            },
            {
                index: 'title',
                icon: 'mdi-sort-alphabetical-descending',
                reverse: true
            }
        ]
    },
    {
        name: 'Artist',
        options: [
            {
                index: 'artist',
                icon: 'mdi-sort-alphabetical-ascending',
                reverse: false
            },
            {
                index: 'artist',
                icon: 'mdi-sort-alphabetical-descending',
                reverse: true
            }
        ]
    },
    {
        name: 'Duration',
        options: [
            {
                index: 'duration',
                icon: 'mdi-sort-ascending',
                reverse: false
            },
            {
                index: 'duration',
                icon: 'mdi-sort-descending',
                reverse: true
            }
        ]
    }
])

const library = useLibraryStore()
const props = defineProps({
    collection: {
        type: Object as PropType<ItemCollection | null>,
        required: true
    },
    likeItem: {
        type: Object as PropType<Item | null>,
        default: () => null
    },
    showSort: {
        type: Boolean,
        default: false
    }
})

const activeIcon = computed(
    () =>
        sortOptions.value
            .map((s) => s.options)
            .flat()
            .find((o) => o.index === library.activeSort && o.reverse === library.reverseSort)
            ?.icon ?? 'mdi-sort'
)
const platform = usePlatformStore()
const player = usePlayerStore()
const route = useRoute()
const downloadState = computed(() => platform.downloadState.get(props.collection?.id ?? '')?.value)
const isLibraryDownloaded = computed(() => {
    if (props.collection === null) return false
    return library.offlineCollections.has(props.collection.id)
})

async function checkTracksDownloaded() {
    if (props.collection === null || props.collection.tracks.length === 0) return
    const isDownloaded = await platform.checkTracksDownloaded(props.collection.tracks)
    let change = false
    if (isDownloaded && !isLibraryDownloaded.value) {
        library.offlineCollections.add(props.collection.id)
        change = true
    } else if (!isDownloaded && isLibraryDownloaded.value) {
        library.offlineCollections.delete(props.collection.id)
        change = true
    }
    if (change) {
        ;(await baseDb)
            .put('spotify', [...toRaw(library.offlineCollections)], 'offlineCollections')
            .then()
    }
}

watch(route, () => checkTracksDownloaded())

// checkTracksDownloaded();

async function cancelDownload() {
    if (downloadState.value === null || downloadState.value === undefined) return
    downloadState.value.canceled = true
}

function downloadTracks() {
    if (props.collection === null || props.collection.tracks.length === 0) return
    platform.downloadTracks(props.collection.id, props.collection.tracks)
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

.sort-list-item {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
}

.sort-buttons {
    display: flex;
    gap: 10px;
}
</style>
