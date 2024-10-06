<template>
    <div v-if="album" class="album pb-5">
        <track-list :collection="collection" no-images type="album">
            <div class="mb-8 album-info">
                <glow-image
                    :height="250"
                    :src="itemImage(album)"
                    :width="250"
                    class="mb-4"
                    rounding="5px"
                />
                <spacer />
                <h1 :title="album.name" class="album-name">{{ album.name }}</h1>
                <h2 class="artist-names">
                    <template v-for="(artist, i) in album.artists">
                        <router-link :to="itemUrl(artist)" class="user-url">
                            {{ artist.name }}
                        </router-link>
                        <span v-if="i < album.artists.length - 1">, </span>
                    </template>
                </h2>
                <p class="album-stats">
                    {{ album.release_date.substring(0, 4) }} • {{ tracks.length }} Track{{
                        tracks.length === 1 ? '' : 's'
                    }}
                    •
                    {{ approximateDuration(totalDurationMs) }}
                </p>
                <collection-buttons :collection="collection" :like-item="album" />
                <p class="album-genres">{{ album.genres.join(', ') }}</p>
            </div>
        </track-list>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlowImage from '../../components/GlowImage.vue'
import TrackList from '../../components/track-list/TrackList.vue'
import CollectionButtons from '../../components/CollectionButtons.vue'
import { usePlayerStore } from '../../store/player/player'
import { useSpotifyApiStore } from '../../store/spotify-api'
import Spacer from '../../components/Spacer.vue'
import { itemCollection, itemImage, itemUrl } from '../../scripts/item-utils'
import { approximateDuration } from '../../scripts/utils'

const route = useRoute()
const router = useRouter()
const spotify = useSpotifyApiStore()
const player = usePlayerStore()
const album = ref(null as null | SpotifyApi.AlbumObjectFull)
let loadedId = route.params.id as string
const collection = computed(() => {
    if (album.value === null) return null
    return itemCollection(album.value)
})

const loadTrackId = computed(() => route.query.play)

const checkForLoadTrackId = () => {
    if (loadTrackId.value && album.value !== null) {
        const albumTrack = album.value.tracks.items.find((t) => t.id === loadTrackId.value) as
            | SpotifyApi.TrackObjectFull
            | undefined
        if (albumTrack && collection.value !== null) {
            player.load(collection.value, albumTrack)
            router.replace({ query: {} })
        }
    }
}
const updateAlbum = async () => {
    const responseAlbum = await spotify.getAlbum(loadedId)
    for (const item of responseAlbum.tracks.items) {
        //@ts-ignore
        item.album = {
            images: [...responseAlbum.images]
        }
    }
    album.value = responseAlbum
    checkForLoadTrackId()
}
watch(route, async () => {
    if (
        route.path.startsWith('/album') &&
        typeof route.params.id === 'string' &&
        route.params.id !== loadedId
    ) {
        loadedId = route.params.id
        await updateAlbum()
    }
})

updateAlbum().then()
const tracks = computed((): SpotifyApi.TrackObjectFull[] => {
    if (album.value === null) return []
    return album.value.tracks.items as SpotifyApi.TrackObjectFull[]
})
const totalDurationMs = computed(() => tracks.value.reduce((a, b) => a + b.duration_ms, 0))
</script>

<style lang="less" scoped>
.album-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-weight: 300;
    height: 490px;
}

.album-name {
    font-weight: 400;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
    font-size: 29px;
    overflow-y: hidden;
}

.user-url {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
}

.user-url:hover {
    text-decoration: underline;
}

.album-stats {
    font-size: 13px;
    font-weight: 400;
    opacity: 0.7;
}

.artist-names {
    font-weight: 300;
}

.album-genres {
    text-transform: uppercase;
    font-weight: 400;
    font-size: 12px;
    opacity: 0.7;
}
</style>
