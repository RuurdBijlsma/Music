<template>
    <div class="playlist">
        <p class="tracks-info">
            {{ tracks.length.toLocaleString() }}
            Track{{ tracks.length === 1 ? '' : 's' }} •
            {{ approximateDuration(totalDurationMs) }}
            <v-btn
                v-if="!base.offlineMode"
                :loading="library.isRefreshing.track"
                class="refresh-button"
                density="compact"
                icon="mdi-refresh"
                size="25"
                variant="plain"
                @click="library.loadLikedTracks"
            />
        </p>
        <collection-buttons :collection="collection" show-sort />
        <track-list-virtual
            v-if="collection !== null"
            :collection="collection"
            :height="(ui.windowHeight - subtractFromHeight).toString()"
            :tracks="collection.tracks"
            padding-top="0"
        />
    </div>
</template>

<script lang="ts" setup>
import { useLibraryStore } from '../../store/library'
import { useBaseStore } from '../../store/base'
import { computed } from 'vue'
import TrackListVirtual from '../../components/track-list/TrackListVirtual.vue'
import { storeToRefs } from 'pinia'
import type { ItemCollection } from '../../scripts/types'
import CollectionButtons from '../../components/CollectionButtons.vue'
import { useUIStore } from '../../store/UI/UIStore'
import { approximateDuration } from '../../scripts/utils'

const library = useLibraryStore()
const { tracks } = storeToRefs(library)
const base = useBaseStore()
const ui = useUIStore()

const subtractFromHeight = computed(() => {
    return ui.windowWidth <= 930 ? 358 : 188
})

const collection = computed(() => {
    if (tracks.value === null || tracks.value === undefined) {
        return null
    }
    return {
        tracks: tracks.value.map((t) => t.track),
        type: 'liked',
        id: 'liked',
        name: 'Liked tracks',
        buttonText: 'Library',
        to: '/library'
    } as ItemCollection
})

setTimeout(() => {
    // if last track reload is 24 or more hours ago then reload tracks
    if (library.lastTracksLoad === -1 || Date.now() - 1000 * 60 * 60 * 24 > library.lastTracksLoad)
        library.loadLikedTracks()
}, 500)

const totalDurationMs = computed(() => {
    if (tracks.value === null || tracks.value === undefined) return 0
    return tracks.value.reduce((a, b) => a + b.track.duration_ms, 0)
})
</script>

<style lang="less" scoped>
.track-list-item.odd-item {
    background-color: rgba(0, 0, 0, 0.07);
}

.dark .track-list-item.odd-item {
    background-color: rgba(255, 255, 255, 0.05);
}

.progress {
    transition: opacity 0.3s;
    width: 80%;
}

.tracks-info {
    font-size: 13px;
    font-weight: 400;
    opacity: 0.7;
    text-align: center;
}

.refresh-button {
    margin-left: 5px;
}
</style>
