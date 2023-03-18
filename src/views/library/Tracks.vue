<template>
    <div class="playlist">
        <p class="tracks-info">
            {{ spotify.library.tracks.length.toLocaleString() }} Track{{spotify.library.tracks.length === 1 ? '' : 's'}}
            • {{ base.approximateDuration((totalDurationMs)) }}
        </p>
        <div class="play-buttons mb-2">
            <v-divider/>
            <v-btn color="primary" icon="mdi-play-outline" variant="text"/>
            <v-btn color="primary" icon="mdi-shuffle" variant="text"/>
            <v-btn color="primary" icon="mdi-filter-outline" variant="text"/>
            <v-divider/>
        </div>
        <track-list item-height :tracks="spotify.library.tracks" :subtract-height="236" padding-top="0"/>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import {useBaseStore} from "../../scripts/store/base";
import {computed} from "vue";
import TrackList from "../../components/TrackList.vue";

const spotify = useSpotifyStore();
const base = useBaseStore();
const totalDurationMs = computed(() => {
    if (spotify.library.tracks === null) return 0;
    return spotify.library.tracks.reduce((a, b) => a + b.duration_ms, 0);
});

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

.tracks-info {
    font-size: 13px;
    font-weight: 400;
    opacity: .7;
    text-align: center;
}
</style>