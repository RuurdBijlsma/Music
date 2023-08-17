<template>
    <div class="artist" v-if="artist">
        <div class="mb-2 artist-info">
            <glow-image
                :effect-scale="1.3"
                rounding="125px"
                :width="250"
                :height="250"
                class="mb-4"
                :src="artist.images[0].url"/>
            <v-spacer/>
            <h1>{{ artist.name }}</h1>
            <p>{{ followerString }}</p>
            <p class="genres">{{ artist.genres.join(' / ') }}</p>
            <div class="play-buttons mt-2 mb-2">
                <v-divider/>
                <v-btn color="primary" icon="mdi-play-outline" variant="text"/>
                <v-btn color="primary" icon="mdi-shuffle" variant="text"/>
                <v-btn color="primary" icon="mdi-heart-outline" variant="text"/>
                <v-divider/>
            </div>
        </div>
        <div>
            <track-list-item v-for="(track, index) in topTracks"
                             :class="{'odd-item': index % 2 === 1}"
                             class="track-list-item"
                             :track="track"></track-list-item>
        </div>
        <div class="sub-header mt-6 mb-5">
            <v-divider/>
            <p class="top-tracks-text ml-4 mr-4">Albums</p>
            <v-divider/>
        </div>
        <div>
            <horizontal-scroller v-if="albums" class="mt-4 albums-grid">
                <template v-for="(album, i) in albums">
                    <highlight-card :item="album"
                                    class="mr-4"
                                    v-if="i === 0"/>
                    <item-card :item="album"
                               class="mr-4"
                               v-else/>
                </template>
            </horizontal-scroller>
        </div>
        <div class="sub-header mt-6 mb-5">
            <v-divider/>
            <p class="top-tracks-text ml-4 mr-4">Related artists</p>
            <v-divider/>
        </div>
        <div>
            <horizontal-scroller v-if="relatedArtists" class="mt-4 albums-grid">
                <template v-for="(relatedArtist, i) in relatedArtists">
                    <item-card :item="relatedArtist"
                               class="mr-4"/>
                </template>
            </horizontal-scroller>
        </div>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useBaseStore} from "../../scripts/store/base";
import GlowImage from "../../components/GlowImage.vue";
import TrackListItem from "../../components/TrackListItem.vue";
import ItemCard from "../../components/ItemCard.vue";
import HighlightCard from "../../components/HighlightCard.vue";
import HorizontalScroller from "../../components/HorizontalScroller.vue";

const route = useRoute()
const base = useBaseStore();
const spotify = useSpotifyStore();

const artist = ref(null as null | SpotifyApi.SingleArtistResponse)
const albums = ref(null as null | SpotifyApi.AlbumObjectSimplified[])
const relatedArtists = ref(null as null | SpotifyApi.ArtistObjectSimplified[])
const topTracks = ref(null as null | SpotifyApi.TrackObjectFull[])

let loadedId = route.params.id as string;
reloadArtist(loadedId);

watch(route, async () => {
    if (route.path.startsWith('/artist') && typeof route.params.id === 'string' && route.params.id !== loadedId) {
        loadedId = route.params.id;
        reloadArtist(loadedId);
        let el = document.querySelector('.router-view');
        if (el !== null)
            el.scrollTop = 0;
    }
})

function reloadArtist(id: string) {
    spotify.api.getArtist(id).then(r => {
        artist.value = r;
        console.log("Artist", r);
    });
    spotify.api.getArtistAlbums(id).then(r => {
        albums.value = r.items;
        console.log("getArtistAlbums", r);
    });
    spotify.api.getArtistRelatedArtists(id).then(r => {
        relatedArtists.value = r.artists;
        console.log("getArtistRelatedArtists", r);
    });
    spotify.api.getArtistTopTracks(id, spotify.userInfo.country).then(r => {
        topTracks.value = r.tracks;
        console.log("getArtistTopTracks", r);
    });
}

const followerString = computed(() => {
    if (artist.value === null) return '0 followers';
    if (artist.value.followers.total > 1000000) {
        let followerMillions = Math.round(artist.value.followers.total / 1000000);
        return followerMillions + 'M follower' + (followerMillions === 1 ? '' : 's');
    }
    return artist.value.followers.total.toLocaleString() + ' follower' + (artist.value.followers.total === 1 ? '' : 's');
})
// const totalDurationMs = computed(() => {
//     return tracks.value.reduce((a, b) => a + b.duration_ms, 0);
// });

</script>

<style scoped lang="scss">
.artist {
    padding-top: 100px;
    padding-bottom: 100px;
}

.artist-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: 300;
    height: 485px;
    padding: 20px;
}

.genres {
    text-transform: uppercase;
    opacity: .7;
    text-align: center;
    font-size: 12px;
}

.artist-info > h1 {
    font-weight: 400;
}

.user-url {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
}

.user-url:hover {
    text-decoration: underline;
}

.artist-stats {
    font-size: 13px;
    font-weight: 400;
    opacity: .7;
}

.play-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 5px;
}

.top-tracks {

}

.top-tracks-text {
    text-align: center;
    opacity: .7;
    text-transform: uppercase;
    font-weight: 400;
    font-size: 13px;
    white-space: nowrap;
}

.sub-header {
    display: flex;
    align-items: center;
}

.track-list-item.odd-item {
    background-color: rgba(0, 0, 0, 0.07);
}

.dark .track-list-item.odd-item {
    background-color: rgba(255, 255, 255, 0.05);
}
</style>