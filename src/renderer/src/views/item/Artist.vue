<template>
    <div v-if="loadedId.startsWith('yt-')" class="mt-15">
        <h1>Unfortunately YouTube™️ artist pages are not supported.</h1>
    </div>
    <div v-else-if="artist" class="artist">
        <div class="mb-2 artist-info">
            <glow-image
                :effect-scale="1.3"
                :height="250"
                :src="itemImage(artist)"
                :width="250"
                class="mb-4"
                rounding="125px"
                @click.right="dialog.setContextMenuItem($event, artist)"
            />
            <spacer />
            <h1 :title="artist.name" class="artist-name">{{ artist.name }}</h1>
            <p>{{ followerString }}</p>
            <p class="genres">{{ artist.genres.join(' / ') }}</p>
            <collection-buttons :collection="collection" :like-item="artist" />
        </div>
        <track-list :collection="collection" padding-top="0" />
        <div class="sub-header mt-6 mb-5">
            <v-divider />
            <p class="top-tracks-text ml-4 mr-4">Albums</p>
            <v-divider />
        </div>
        <div>
            <horizontal-scroller v-if="albums" class="mt-4 albums-grid">
                <template v-for="(album, i) in albums">
                    <highlight-card v-if="i === 0" :item="album" class="mr-4" />
                    <item-card v-else :item="album" class="mr-4" />
                </template>
            </horizontal-scroller>
        </div>
        <div class="sub-header mt-6 mb-5">
            <v-divider />
            <p class="top-tracks-text ml-4 mr-4">Related artists</p>
            <v-divider />
        </div>
        <div>
            <horizontal-scroller v-if="relatedArtists" class="mt-4 albums-grid">
                <template v-for="relatedArtist in relatedArtists">
                    <item-card :item="relatedArtist" class="mr-4" />
                </template>
            </horizontal-scroller>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GlowImage from '../../components/GlowImage.vue'
import ItemCard from '../../components/item/ItemCard.vue'
import HighlightCard from '../../components/item/HighlightCard.vue'
import HorizontalScroller from '../../components/HorizontalScroller.vue'
import TrackList from '../../components/track-list/TrackList.vue'
import CollectionButtons from '../../components/CollectionButtons.vue'
import { useSpotifyApiStore } from '../../store/spotify-api'
import Spacer from '../../components/Spacer.vue'
import { baseDb } from '../../scripts/database'
import { itemCollection, itemImage } from '../../scripts/item-utils'
import { useDialogStore } from '../../store/UI/dialogStore'

const route = useRoute()
const dialog = useDialogStore()
const spotify = useSpotifyApiStore()

const artist = ref(null as null | SpotifyApi.ArtistObjectFull)
const albums = ref(null as null | SpotifyApi.AlbumObjectFull[])
const relatedArtists = ref(null as null | SpotifyApi.ArtistObjectFull[])
const topTracks = ref(null as null | SpotifyApi.TrackObjectFull[])

const collection = computed(() => {
    if (artist.value === null) return null
    return itemCollection(artist.value, topTracks.value)
})

let loadedId = route.params.id as string
reloadArtist(loadedId)

watch(route, async () => {
    if (
        route.path.startsWith('/artist') &&
        typeof route.params.id === 'string' &&
        route.params.id !== loadedId
    ) {
        loadedId = route.params.id
        reloadArtist(loadedId).then()
        const el = document.querySelector('.router-view')
        if (el !== null) el.scrollTop = 0
    }
})

async function reloadArtist(id: string) {
    if (id.startsWith('yt-')) {
        return
    }
    await baseDb
    spotify.getArtist(id).then((r) => {
        artist.value = r
    })
    spotify.getArtistAlbums(id).then((r) => {
        albums.value = r.items as SpotifyApi.AlbumObjectFull[]
    })
    spotify.getArtistRelatedArtists(id).then((r) => {
        relatedArtists.value = r.artists
    })
    spotify.getArtistTopTracks(id).then((r) => {
        topTracks.value = r.tracks
    })
}

const followerString = computed(() => {
    if (artist.value === null) return '0 followers'
    if (artist.value.followers.total === 0) return 'No followers'
    if (artist.value.followers.total > 1000000) {
        const followerMillions = Math.round(artist.value.followers.total / 1000000)
        return followerMillions + 'M follower' + (followerMillions === 1 ? '' : 's')
    }
    return (
        artist.value.followers.total.toLocaleString() +
        ' follower' +
        (artist.value.followers.total === 1 ? '' : 's')
    )
})
// const totalDurationMs = computed(() => {
//     return tracks.value.reduce((a, b) => a + b.duration_ms, 0);
// });
</script>

<style lang="less" scoped>
.artist {
    padding-top: 100px;
    padding-bottom: 100px;
}

.artist-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: 300;
    height: 490px;
    padding: 20px;
}

.artist-name {
    font-weight: 400;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
    font-size: 29px;
    overflow-y: hidden;
}

.genres {
    text-transform: uppercase;
    opacity: 0.7;
    text-align: center;
    font-size: 12px;
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
    opacity: 0.7;
}

.top-tracks-text {
    text-align: center;
    opacity: 0.7;
    text-transform: uppercase;
    font-weight: 400;
    font-size: 13px;
    white-space: nowrap;
}

.sub-header {
    display: flex;
    align-items: center;
}
</style>
