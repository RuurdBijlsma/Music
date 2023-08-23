<template>
    <div class="playlist">
        <p class="tracks-info">
            {{ tracksAmount }}
            Track{{ trucks.length === 1 ? '' : 's' }}
            • {{ base.approximateDuration((totalDurationMs)) }}
        </p>
        <div class="play-buttons mb-1">
            <v-divider/>
            <v-btn :color="base.themeColor.value" icon="mdi-play-outline" variant="text"/>
            <v-btn :color="base.themeColor.value" icon="mdi-shuffle" variant="text"/>
            <v-btn :color="base.themeColor.value" icon="mdi-filter-outline" variant="text"/>
            <v-divider/>
        </div>
        <v-progress-linear :indeterminate="trackLoadProgress === 0"
                           :style="{opacity: trackLoadProgress === 100 ? 0 : 1}"
                           class="mb-2 progress"
                           rounded
                           :model-value="trackLoadProgress"></v-progress-linear>
        <track-list-virtual v-if="collection !== null" item-height :collection="collection" type="liked"
                            :subtract-height="188" padding-top="0"/>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import {useBaseStore} from "../../scripts/store/base";
import {computed, ref, toRaw, watch} from "vue";
import TrackListVirtual from "../../components/TrackListVirtual.vue";
import {storeToRefs} from "pinia";

const spotify = useSpotifyStore();
const {trucks} = storeToRefs(spotify)
const base = useBaseStore();

const collection = computed(() => {
    if (trucks.value === null || trucks.value === undefined) {
        return null
    }
    return {
        tracks: toRaw(trucks.value).map(t=>t.track),
        type: 'liked',
        id: 'liked',
        loaded: spotify.likedTracksLoaded,
    }
})
// spotify.loadLikedTracks()
const totalDurationMs = computed(() => {
    if (trucks.value === null || trucks.value === undefined) return 0;
    return trucks.value.reduce((a, b) => a + b.track.duration_ms, 0);
});
// const trackLoadProgress = computed(() => 100)
const trackLoadProgress = computed(() => 100 * spotify.likedTracksLoaded / spotify.likedTracksTotal)

const tracksAmount = computed(() => {
    if (trackLoadProgress.value === 100) {
        return trucks.value.length.toLocaleString()
    }
    return `${spotify.likedTracksLoaded.toLocaleString()} / ${spotify.likedTracksTotal.toLocaleString()}`
})
</script>

<style scoped>
.track-list-item.odd-item {
    background-color: rgba(0, 0, 0, 0.07);
}

.dark .track-list-item.odd-item {
    background-color: rgba(255, 255, 255, 0.05);
}

.play-buttons {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
}

.progress {
    transition: opacity .3s;
    width: 80%;
}

.tracks-info {
    font-size: 13px;
    font-weight: 400;
    opacity: .7;
    text-align: center;
}
</style>