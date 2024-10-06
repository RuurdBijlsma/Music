<template>
    <div v-if="r !== null" class="search mt-8">
        <h1 class="title mb-5 mt-4">
            Search results for <span class="query">{{ query }}</span>
        </h1>
        <div v-if="r.liked.loading || r.liked.tracks.length > 0">
            <v-divider class="mt-5 mb-3" />
            <h2 class="mb-3 center-title">
                <v-icon class="mr-1" icon="mdi-thumb-up" size="25" />
                Liked Tracks
            </h2>
            <div class="add-margin">
                <track-list-expander
                    :collection="likedCollection"
                    :loading="r.liked.loading"
                    :show-amount="6"
                    :tracks="r.liked.tracks"
                />
            </div>
        </div>
        <h4 v-else>No liked tracks found</h4>
        <div>
            <v-divider class="mt-5 mb-3" />
            <h2 class="mb-3 center-title">
                <v-icon color="green" icon="mdi-spotify" />
                Spotify
            </h2>
            <div v-if="r.spotify.data.tracks.length > 0 || r.spotify.loading" class="add-margin">
                <track-list-expander
                    :collection="spotifyCollection"
                    :loading="r.spotify.loading"
                    :show-amount="6"
                    :tracks="r.spotify.data.tracks"
                />
            </div>
            <h4 v-else>No tracks found</h4>

            <h3 class="mb-3 center-title">Albums</h3>
            <template v-if="r.spotify.data.albums.length > 0 || r.spotify.loading">
                <horizontal-scroller>
                    <highlight-card
                        v-if="r.spotify.data.albums[0]"
                        :item="r.spotify.data.albums[0]"
                        :size="250"
                        class="mr-4"
                    />
                    <item-card
                        v-for="album in r.spotify.data.albums.slice(1)"
                        :item="album"
                        :size="250"
                        class="mr-4"
                    />
                </horizontal-scroller>
            </template>
            <h4 v-else>No albums found</h4>

            <h3 class="mb-3 center-title">Artists</h3>
            <template v-if="r.spotify.data.artists.length > 0 || r.spotify.loading">
                <horizontal-scroller>
                    <item-card
                        v-for="artist in r.spotify.data.artists"
                        :item="artist"
                        :size="250"
                        class="mr-4"
                    />
                </horizontal-scroller>
            </template>
            <h4 v-else>No artists found</h4>

            <h3 class="mb-3 center-title">Playlists</h3>
            <template v-if="r.spotify.data.playlists.length > 0 || r.spotify.loading">
                <horizontal-scroller>
                    <item-card
                        v-for="playlist in r.spotify.data.playlists"
                        :item="playlist"
                        :size="250"
                        class="mr-4"
                    />
                </horizontal-scroller>
            </template>
            <h4 v-else>No playlists found</h4>
        </div>
        <div>
            <v-divider class="mt-5 mb-3" />
            <h2 class="mb-3 center-title">
                <v-icon color="red" icon="mdi-youtube" />
                YouTube
            </h2>
            <div v-if="r.youtube.tracks.length > 0 || r.youtube.loading" class="add-margin">
                <track-list
                    v-if="!r.youtube.loading"
                    :collection="youtubeCollection"
                    :tracks="r.youtube.tracks"
                    padding-top="0"
                />
                <div v-else class="center-loader">
                    <v-progress-circular indeterminate />
                </div>
            </div>
            <h4 v-else>No YouTube results found</h4>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, Ref, ref, watch } from 'vue'
import { useSearchStore } from '../store/search'
import { ItemCollection, SearchResult } from '../scripts/types'
import TrackListExpander from '../components/track-list/TrackListExpander.vue'
import HorizontalScroller from '../components/HorizontalScroller.vue'
import ItemCard from '../components/item/ItemCard.vue'
import HighlightCard from '../components/item/HighlightCard.vue'
import TrackList from '../components/track-list/TrackList.vue'

const route = useRoute()
const search = useSearchStore()
const r: Ref<null | SearchResult> = ref(null)

const spotifyCollection = computed(
    () =>
        ({
            tracks: r.value === null ? [] : r.value.spotify.data.tracks,
            type: 'search',
            id: 'searchSpotify' + query.value,
            name: `Spotify search "${query.value}"`,
            buttonText: 'Search',
            to: `/search/${query.value}`
        }) as ItemCollection
)
const youtubeCollection = computed(
    () =>
        ({
            tracks: r.value === null ? [] : r.value.youtube.tracks,
            type: 'search',
            id: 'searchYouTube' + query.value,
            name: `YouTube search "${query.value}"`,
            buttonText: 'Search',
            to: `/search/${query.value}`
        }) as ItemCollection
)
const likedCollection = computed(
    () =>
        ({
            tracks: r.value === null ? [] : r.value.liked.tracks,
            type: 'search',
            id: 'searchLiked' + query.value,
            name: `Filtered liked tracks for "${query.value}"`,
            buttonText: 'Search',
            to: `/search/${query.value}`
        }) as ItemCollection
)

function init() {
    if (query.value === undefined || query.value === null) {
        return
    }
    r.value = search.cachedSearch(query.value).value
    const el = document.querySelector('.router-view')
    if (el !== null) el.scrollTop = 0
}

const query = computed(() => route.params.query?.toString())

watch(route, () => init())
init()
</script>

<style lang="less" scoped>
.search {
    padding: 10px 0 50px 10px;
}

.add-margin {
    padding-right: 10px;
}

.title {
    font-weight: 300;
}

.query {
    font-weight: bold;
}

.center-title {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.center-loader {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 50px;
}
</style>
