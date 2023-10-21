<template>
    <div class="search mt-8" v-if="r !== null">
        <h1 class="title mb-5 mt-4">Search results for <span class="query">{{ query }}</span></h1>
        <div v-if="r.liked.loading ||  r.liked.tracks.length > 0">
            <v-divider class="mt-5 mb-3" />
            <h2 class="mb-3 text-center">
                <v-icon icon="mdi-thumb-up" color="white" size="25" class="mr-1" />
                Liked Tracks
            </h2>
            <div class="add-margin">
                <track-list-expander
                    :show-amount="6"
                    :loading="r.liked.loading"
                    :collection="likedCollection"
                    :tracks="r.liked.tracks" />
            </div>
        </div>
        <h4 v-else>No liked tracks found</h4>
        <div>
            <v-divider class="mt-5 mb-3" />
            <h2 class="mb-3 text-center">
                <v-icon icon="mdi-spotify" color="green" />
                Spotify
            </h2>
            <div class="add-margin" v-if="r.spotify.data.tracks.length > 0 || r.spotify.loading">
                <track-list-expander
                    :show-amount="6"
                    :loading="r.spotify.loading"
                    :collection="spotifyCollection"
                    :tracks="r.spotify.data.tracks" />
            </div>
            <h4 v-else>No tracks found</h4>

            <h3 class="mb-3 text-center">Albums</h3>
            <template v-if="r.spotify.data.albums.length > 0 || r.spotify.loading">
                <horizontal-scroller>
                    <highlight-card
                        class="mr-4"
                        :size="250"
                        v-if="r.spotify.data.albums[0]"
                        :item="r.spotify.data.albums[0]" />
                    <item-card class="mr-4"
                               :item="album"
                               :size="250"
                               v-for="album in r.spotify.data.albums.slice(1)" />
                </horizontal-scroller>
            </template>
            <h4 v-else>No albums found</h4>

            <h3 class="mb-3 text-center">Artists</h3>
            <template v-if="r.spotify.data.artists.length > 0 || r.spotify.loading">
                <horizontal-scroller>
                    <item-card class="mr-4"
                               :item="artist"
                               :size="250"
                               v-for="artist in r.spotify.data.artists" />
                </horizontal-scroller>
            </template>
            <h4 v-else>No artists found</h4>

            <h3 class="mb-3 text-center">Playlists</h3>
            <template v-if="r.spotify.data.playlists.length > 0 || r.spotify.loading">
                <horizontal-scroller>
                    <item-card class="mr-4"
                               :item="playlist"
                               :size="250"
                               v-for="playlist in r.spotify.data.playlists" />
                </horizontal-scroller>
            </template>
            <h4 v-else>No playlists found</h4>
        </div>
        <div>
            <v-divider class="mt-5 mb-3" />
            <h2 class="mb-3 text-center">
                <v-icon icon="mdi-youtube" color="red" />
                YouTube
            </h2>
            <div class="add-margin" v-if="r.youtube.tracks.length > 0 || r.youtube.loading">
                <track-list
                    padding-top="0"
                    v-if="!r.youtube.loading"
                    :collection="youtubeCollection"
                    :tracks="r.youtube.tracks" />
                <div class="center-loader" v-else>
                    <v-progress-circular indeterminate />
                </div>
            </div>
            <h4 v-else>No YouTube results found</h4>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed, Ref, ref, watch } from "vue";
import { useSearchStore } from "../store/search";
import { ItemCollection, SearchResult } from "../scripts/types";
import TrackListExpander from "../components/TrackListExpander.vue";
import HorizontalScroller from "../components/HorizontalScroller.vue";
import ItemCard from "../components/ItemCard.vue";
import HighlightCard from "../components/HighlightCard.vue";
import TrackList from "../components/TrackList.vue";

const route = useRoute();
const search = useSearchStore();
const r: Ref<null | SearchResult> = ref(null);


const spotifyCollection = computed(() => ({
    tracks: r.value === null ? [] : r.value.spotify.data.tracks,
    type: "search",
    id: "searchSpotify" + query.value,
    name: `Spotify search results for "${query.value}"`,
    buttonText: "Search",
    to: `/search?q=${query.value}`
} as ItemCollection));
const youtubeCollection = computed(() => ({
    tracks: r.value === null ? [] : r.value.youtube.tracks,
    type: "search",
    id: "searchYouTube" + query.value,
    name: `YouTube search results for "${query.value}"`,
    buttonText: "Search",
    to: `/search?q=${query.value}`
} as ItemCollection));
const likedCollection = computed(() => ({
    tracks: r.value === null ? [] : r.value.liked.tracks,
    type: "search",
    id: "searchLiked" + query.value,
    name: `Filtered liked tracks for "${query.value}"`,
    buttonText: "Search",
    to: `/search?q=${query.value}`
} as ItemCollection));

function init() {
    if (query.value === undefined || query.value === null) {
        return;
    }
    console.log("Search query", query.value);
    r.value = search.cachedSearch(query.value).value;
}

const query = computed(() => route.query.q?.toString());

watch(route, () => init());
init();
</script>

<style scoped lang="less">
.search {
    padding: 10px;
    padding-bottom: 50px;
}

.add-margin {
    padding-right: 10px;
}

.title {
    font-weight: 300;
}

h1, h2, h3, h4 {
    font-weight: 400;
    text-align: center;
}

.query {
    font-weight: bold;
}

.center-loader {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 50px;
}
</style>
