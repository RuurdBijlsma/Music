<template>
    <div class="radio">
        <div class="radio-info">
            <h1 class="page-title">{{ radioName }}</h1>

            <h4 v-if="radioGenres !== ''" class="radio-params">
                {{ radioGenres }}
            </h4>
            <h4 v-if="radioName === 'Artist radio'" class="radio-params">
                <span v-if="artists.length === 0">Loading artists...</span>
                <artists-span :artists="artists" />
            </h4>

            <p class="radio-stats">
                {{ tracks.length }} Track{{ tracks.length === 1 ? '' : 's' }} •
                {{ approximateDuration(totalDurationMs) }}
            </p>
            <collection-buttons :collection="collection" />
        </div>

        <div v-if="loading" class="text-center mt-10 mb-10">
            Creating radio...
            <v-progress-linear :indeterminate="true" />
        </div>
        <track-list :collection="collection" padding-top="20px" />
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Item, ItemCollection } from '../../scripts/types'
import TrackList from '../../components/track-list/TrackList.vue'
import { useSpotifyApiStore } from '../../store/spotify-api'
import CollectionButtons from '../../components/CollectionButtons.vue'
import ArtistsSpan from '../../components/ArtistsSpan.vue'
import { approximateDuration } from '../../scripts/utils'

const route = useRoute()
const spotify = useSpotifyApiStore()

const tracks = ref([] as SpotifyApi.TrackObjectFull[])
const artists = ref([] as SpotifyApi.ArtistObjectFull[])

const loading = ref(false)
const radioGenres = computed(() => {
    let info = ''
    if (route.query.hasOwnProperty('seed_genres')) {
        const genres = route.query['seed_genres'] as string
        info = genres
            .split(',')
            .map((a) => a.toUpperCase())
            .join(' / ')
    }
    return info
})

async function refresh() {
    loading.value = true
    artists.value = []
    const options: any = route.query
    for (const key in options) {
        if (!options.hasOwnProperty(key)) continue
        if (!isNaN(+options[key])) {
            options[key] = +options[key]
        }
    }

    const radio = await spotify.getRadioTracks(options)
    tracks.value = radio.tracks as SpotifyApi.TrackObjectFull[]
    loading.value = false

    const artistsIds = radio.seeds.filter((s) => s.type.toLowerCase() === 'artist').map((s) => s.id)
    if (artistsIds.length > 0)
        spotify.getCachedArtists(artistsIds).then((r) => {
            artists.value = r
        })
}

const radioName = computed(() => {
    let radioName = 'Custom Radio'
    if (route.query.hasOwnProperty('seed_genres')) radioName = 'Genre radio'
    if (route.query.hasOwnProperty('seed_tracks')) radioName = 'Song radio'
    if (route.query.hasOwnProperty('seed_artists')) radioName = 'Artist radio'
    return radioName
})

const totalDurationMs = computed(() => tracks.value.reduce((a, b) => a + b.duration_ms, 0))

const collection = computed(() => {
    let context: Item | undefined
    if (radioName.value === 'Artist radio') {
        context = artists.value.length === 0 ? undefined : artists.value[0]
    } else if (radioName.value === 'Song radio') {
        context = tracks.value.length === 0 ? undefined : tracks.value[0]
    }
    let prefixName: string = ''
    if (radioName.value === 'Artist radio') {
        prefixName = artists.value.length === 0 ? '' : '"' + artists.value[0].name + '" '
    } else if (radioName.value === 'Song radio') {
        prefixName = tracks.value.length === 0 ? '' : '"' + tracks.value[0].name + '" '
    } else if (radioName.value === 'Genre radio') {
        prefixName = '"' + radioGenres.value + '" '
    }

    return {
        id: 'radio' + JSON.stringify(route.query),
        tracks: tracks.value ?? [],
        type: 'radio',
        context,
        name: prefixName + radioName.value,
        buttonText: radioName.value,
        to: route.fullPath
    } as ItemCollection
})

refresh()
watch(route, () => {
    if (route.path.startsWith('/radio')) refresh()
})
</script>

<style scoped>
.radio {
    padding: 80px 30px 30px;
}

.radio-info {
    text-align: center;
}

.radio-params {
    opacity: 0.7;
    font-weight: 500;
}

.radio-stats {
    font-size: 13px;
    font-weight: 400;
    opacity: 0.7;
}
</style>
