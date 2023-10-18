<template>
    <div class="album pb-5" v-if="album">
        <track-list :collection="collection" type="album" no-images>
            <div class="mb-8 album-info">
                <glow-image
                    rounding="5px"
                    :width="250"
                    :height="250"
                    class="mb-4"
                    :src="album.images[0].url" />
                <spacer />
                <h1>{{ album.name }}</h1>
                <h2 class="artist-names">
                    <template v-for="(artist, i) in album.artists">
                        <router-link class="user-url"
                                     :to="base.itemUrl(artist)">
                            {{ artist.name }}
                        </router-link>
                        <span v-if="i < album.artists.length - 1">, </span>
                    </template>
                </h2>
                <p class="album-stats">
                    {{ album.release_date.substring(0, 4) }} • {{ tracks.length }} Track{{
                        tracks.length === 1 ? "" : "s"
                    }} •
                    {{ base.approximateDuration(totalDurationMs) }}
                </p>
                <collection-buttons :collection="collection" :like-item="album" />
                <p class="album-genres">{{ album.genres.join(", ") }}</p>
            </div>
        </track-list>
    </div>
</template>

<script setup lang="ts">
import { useLibraryStore } from "../../scripts/store/library";
import { computed, ref, toRaw, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBaseStore } from "../../scripts/store/base";
import GlowImage from "../../components/GlowImage.vue";
import TrackList from "../../components/TrackList.vue";
import CollectionButtons from "../../components/CollectionButtons.vue";
import { usePlayerStore } from "../../scripts/store/player";
import { useSpotifyApiStore } from "../../scripts/store/spotify-api";
import Spacer from "../../components/Spacer.vue";

const route = useRoute();
const router = useRouter();
const base = useBaseStore();
const library = useLibraryStore();
const spotify = useSpotifyApiStore();
const player = usePlayerStore();
const album = ref(null as null | SpotifyApi.AlbumObjectFull);
let loadedId = route.params.id as string;
const collection = computed(() => {
    if (album.value === null) return null;
    return base.itemCollection(album.value);
});

const loadTrackId = computed(() => route.query.play);

const checkForLoadTrackId = () => {
    console.log("CHECK 1", loadTrackId.value);
    if (loadTrackId.value && album.value !== null) {
        let albumTrack = album.value.tracks.items.find(t => t.id === loadTrackId.value) as SpotifyApi.TrackObjectFull | undefined;
        console.log("CHECK FOR LOAD TRACK ID", loadTrackId.value, toRaw(album.value.tracks.items));
        if (albumTrack && collection.value !== null) {
            player.load(collection.value, albumTrack);
            router.replace({ query: {} });
        }
    }
};
const updateAlbum = async () => {
    console.warn("Getting album from SPOTIFY");
    let responseAlbum = await spotify.getAlbum(loadedId);
    for (let item of responseAlbum.tracks.items) {
        //@ts-ignore
        item.album = {
            images: [...responseAlbum.images]
        };
    }
    album.value = responseAlbum;
    console.log(responseAlbum);
    checkForLoadTrackId();
};
watch(route, async () => {
    if (route.path.startsWith("/album") && typeof route.params.id === "string" && route.params.id !== loadedId) {
        loadedId = route.params.id;
        await updateAlbum();
    }
});

updateAlbum().then();
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