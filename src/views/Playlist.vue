<template>
    <div class="playlist" v-if="playlist">
        <v-virtual-scroll :items="scrollItems" height="100%" item-height="50">
            <template v-slot:default="{ item, index }">
                <div class="mb-8 playlist-info" v-if="item === null">
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
                <div class="track-item" v-else :class="{'odd-item': index % 2 === 0}">
                    <v-lazy transition="fade-transition">
                        <v-img class="track-img mr-5" :src="item.track.album.images[0].url"/>
                    </v-lazy>
                    <div class="track-info">
                        <div class="track-name">{{ item.track.name }}</div>
                        <div class="track-artist">{{ item.track.artists.map((a: any) => a.name).join(', ') }}</div>
                    </div>
                    <v-spacer/>
                    <div class="track-duration ml-2">
                        {{ base.msToReadable(item.track.duration_ms) }}
                    </div>
                    <v-btn class="track-options ml-2" variant="text" size="30" density="compact"
                           icon="mdi-dots-horizontal"/>
                </div>
            </template>
        </v-virtual-scroll>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../scripts/store/spotify";
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useBaseStore} from "../scripts/store/base";
import GlowImage from "../components/GlowImage.vue";

const route = useRoute()
const base = useBaseStore();

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

const scrollItems = computed(() => {
    if (playlist.value === null) return [null]
    console.log("scrollitems", playlist.value.tracks.items);
    return [null, ...playlist.value.tracks.items]
})
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

.track-item {
    overflow: hidden;
    height: 50px;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: flex;
    flex-direction: row;
    font-size: 14px;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    border-radius: 5px;
    margin: 0 10px;
}

.track-item.odd-item {
    background-color: rgba(0, 0, 0, 0.07);
}

.dark .track-item.odd-item {
    background-color: rgba(255, 255, 255, 0.05);
}

.track-img {
    width: 40px;
    height: 40px;
    margin: 5px;
    border-radius: 5px;
    /*box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.2);*/
    flex-grow: 0;
}

.track-info {
    display: flex;
    flex-direction: column;
    /*flex-shrink: 1;*/
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow-x: hidden;
}

.track-name {
    font-weight: 500;
}

.track-artist {
    font-weight: 400;
    font-size: 13px;
    opacity: .6;
}

.track-duration {
    font-weight: 400;
    font-size: 13px;
    opacity: .6;
    transform: translateX(30px);
    transition: transform 0.15s;
}

.track-item:hover .track-duration {
    transform: translateX(0px);
}

.track-options {
    opacity: 0;
}

.track-item:hover .track-options {
    opacity: .8;
}
</style>