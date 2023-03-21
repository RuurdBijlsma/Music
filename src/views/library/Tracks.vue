<template>
    <div class="playlist">
        <p class="tracks-info">
            {{ spotify.library.tracks.length.toLocaleString() }}
            Track{{ spotify.library.tracks.length === 1 ? '' : 's' }}
            • {{ base.approximateDuration((totalDurationMs)) }}
        </p>
        <div class="play-buttons mb-1">
            <v-divider/>
            <v-btn color="primary" icon="mdi-play-outline" variant="text"/>
            <v-btn color="primary" icon="mdi-shuffle" variant="text"/>
            <v-btn color="primary" icon="mdi-filter-outline" variant="text"/>
            <v-divider/>
        </div>
        <v-progress-linear :indeterminate="trackLoadProgress === 0"
                           :style="{opacity: trackLoadProgress === 100 ? 0 : 1}"
                           class="mb-2 progress"
                           rounded
                           :model-value="trackLoadProgress"></v-progress-linear>
        <track-list item-height :tracks="spotify.library.tracks" :subtract-height="188" padding-top="0"/>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import {useBaseStore} from "../../scripts/store/base";
import {computed} from "vue";
import TrackList from "../../components/TrackList.vue";

const spotify = useSpotifyStore();
const base = useBaseStore();
// spotify.refreshUserData('track');
const totalDurationMs = computed(() => {
    if (spotify.library.tracks === null) return 0;
    return spotify.library.tracks.reduce((a, b) => a + b.duration_ms, 0);
});
const trackLoadProgress = computed(() => 100)
// const trackLoadProgress = computed(()=> 100 * spotify.likedTracksLoaded / spotify.likedTracksTotal)
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