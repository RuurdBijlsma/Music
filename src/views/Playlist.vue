<template>
    <div class="playlist" v-if="playlist">
        <track-list :tracks="tracks">
            <div class="mb-8 playlist-info">
                <glow-image
                    rounding="5px"
                    :width="250"
                    :height="250"
                    class="mb-4"
                    :src="playlist.images[0].url"/>
                <v-spacer/>
                <h1>{{ playlist.name }}</h1>
                <p class="text-center">{{ playlist.description }}</p>
                <v-spacer/>
            </div>
        </track-list>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../scripts/store/spotify";
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useBaseStore} from "../scripts/store/base";
import GlowImage from "../components/GlowImage.vue";
import TrackList from "../components/TrackList.vue";
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import TrackObjectFull = SpotifyApi.TrackObjectFull;

const route = useRoute()

const spotify = useSpotifyStore();
const playlist = ref(null as null | SpotifyApi.SinglePlaylistResponse);
let loadedId = route.params.id as string;
watch(route, async () => {
    if (route.params.id !== loadedId)
        playlist.value = await spotify.api.getPlaylist(loadedId);
    console.log("route params change");
})
spotify.api.getPlaylist(loadedId).then((r: any) => {
    playlist.value = r;
    console.log("Playlist", r);
});
const tracks = computed(() => {
    if (playlist.value === null) return [];
    return playlist.value.tracks.items.map((t: PlaylistTrackObject) => t.track as TrackObjectFull)
});

</script>

<style scoped>
.playlist {
}

.playlist-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-weight: 300;
    height: 430px;
}

.playlist-info > h1 {
    font-weight: 400;
}
</style>