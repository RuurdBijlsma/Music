<template>
    <div class="album" v-if="album">
        <track-list :collection="collection" type="album" no-images :tracks="collection.tracks">
            <div class="mb-8 album-info">
                <glow-image
                    rounding="5px"
                    :width="250"
                    :height="250"
                    class="mb-4"
                    :src="album.images[0].url"/>
                <v-spacer/>
                <h1>{{ album.name }}</h1>
                <h2 class="artist-names">
                    <router-link v-for="artist in album.artists"
                                 class="user-url"
                                 :to="base.itemUrl(artist)">
                        {{ artist.name }}
                    </router-link>
                </h2>
                <p class="album-stats">
                    {{ album.release_date.substring(0, 4) }} • {{ tracks.length }} Track{{
                        tracks.length === 1 ? '' : 's'
                    }} •
                    {{ base.approximateDuration(totalDurationMs) }}
                </p>
                <div class="play-buttons mt-2 mb-2">
                    <v-divider/>
                    <v-btn color="primary" icon="mdi-play-outline" variant="text"/>
                    <v-btn color="primary" icon="mdi-shuffle" variant="text"/>
                    <v-btn color="primary" icon="mdi-heart-outline" variant="text"/>
                    <v-divider/>
                </div>
                <p class="album-genres">{{ album.genres.join(', ') }}</p>
            </div>
        </track-list>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useBaseStore} from "../../scripts/store/base";
import GlowImage from "../../components/GlowImage.vue";
import type {ItemCollection} from "../../scripts/types";
import TrackList from "../../components/TrackList.vue";

const route = useRoute()
const base = useBaseStore();
const spotify = useSpotifyStore();
const album = ref(null as null | SpotifyApi.AlbumObjectFull);
let loadedId = route.params.id as string;
const collection = computed(() => {
    return {
        id: album.value?.id ?? 'album',
        tracks: album.value?.tracks.items ?? [],
        type: "album",
        context: album.value,
        name: album.value?.name ?? 'Album',
        buttonText: "Album",
        to: base.itemUrl(album.value)
    } as ItemCollection
})
watch(route, async () => {
    if (route.path.startsWith('/album') && typeof route.params.id === 'string' && route.params.id !== loadedId) {
        loadedId = route.params.id
        album.value = await spotify.api.getAlbum(loadedId);
    }
})

spotify.api.getAlbum(loadedId).then((r: SpotifyApi.SingleAlbumResponse) => {
    for (let item of r.tracks.items) {
        //@ts-ignore
        item.album = {
            images: [...r.images]
        }
    }
    album.value = r;
    console.log("album", r);
});
const tracks = computed((): SpotifyApi.TrackObjectFull[] => {
    if (album.value === null) return [];
    return album.value.tracks.items as SpotifyApi.TrackObjectFull[];
});
const totalDurationMs = computed(() => {
    return tracks.value.reduce((a, b) => a + b.duration_ms, 0);
});

</script>

<style scoped lang="scss">
.album-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-weight: 300;
    height: 485px;
}

.album-info > h1 {
    font-weight: 400;
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
    opacity: .7;
}

.play-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 5px;
}

.artist-names {
    font-weight: 300;
}

.album-genres {
    text-transform: uppercase;
    font-weight: 400;
    font-size: 12px;
    opacity: .7;
}
</style>