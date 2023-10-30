<template>
    <div class="playlist">
        <p class="tracks-info">
            {{ tracksAmount }}
            Track{{ tracks.length === 1 ? "" : "s" }} •
            {{ base.approximateDuration(totalDurationMs) }}
            <v-btn
                v-show="trackLoadProgress === 100"
                class="refresh-button"
                density="compact"
                icon="mdi-refresh"
                size="25"
                variant="plain"
                @click="library.loadLikedTracks"
            />
        </p>
        <collection-buttons :collection="collection" show-filter />
        <v-progress-linear
            :indeterminate="trackLoadProgress === 0"
            :model-value="trackLoadProgress"
            :style="{ opacity: trackLoadProgress === 100 ? 0 : 1 }"
            class="mb-2 progress"
            rounded
        ></v-progress-linear>
        <track-list-virtual
            v-if="collection !== null"
            :collection="collection"
            :height="(base.windowHeight - subtractFromHeight).toString()"
            :tracks="collection.tracks"
            padding-top="0"
        />
    </div>
</template>

<script lang="ts" setup>
import { useLibraryStore } from "../../store/library";
import { useBaseStore } from "../../store/base";
import { computed, toRaw } from "vue";
import TrackListVirtual from "../../components/TrackListVirtual.vue";
import { storeToRefs } from "pinia";
import type { ItemCollection } from "../../scripts/types";
import CollectionButtons from "../../components/CollectionButtons.vue";

const library = useLibraryStore();
const { tracks } = storeToRefs(library);
const base = useBaseStore();

const subtractFromHeight = computed(() => {
    return base.windowWidth <= 930 ? 358 : 188;
});

const collection = computed(() => {
    if (tracks.value === null || tracks.value === undefined) {
        return null;
    }
    console.log("tracks", toRaw(tracks.value));
    return {
        tracks: toRaw(tracks.value).map((t) => t.track),
        type: "liked",
        id: "liked",
        loaded: library.likedTracksLoaded,
        total: library.likedTracksTotal,
        name: "Liked tracks",
        buttonText: "Library",
        to: "/library",
    } as ItemCollection;
});

setTimeout(() => {
    // if last track reload is 24 or more hours ago then reload tracks
    if (
        localStorage.getItem("lastTracksLoad") === null ||
        Date.now() - 1000 * 60 * 60 * 24 > +localStorage.lastTracksLoad
    ) {
        library.loadLikedTracks();
    }
}, 500);

const totalDurationMs = computed(() => {
    if (tracks.value === null || tracks.value === undefined) return 0;
    return tracks.value.reduce((a, b) => a + b.track.duration_ms, 0);
});
// const trackLoadProgress = computed(() => 100)
const trackLoadProgress = computed(
    () => (100 * library.likedTracksLoaded) / library.likedTracksTotal,
);

const tracksAmount = computed(() => {
    if (trackLoadProgress.value === 100) {
        return tracks.value.length.toLocaleString();
    }
    return `${library.likedTracksLoaded.toLocaleString()} / ${library.likedTracksTotal.toLocaleString()}`;
});
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
