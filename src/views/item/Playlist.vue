<template>
    <div class="playlist" v-if="playlist">
        <track-list :collection="collection" v-if="collection.tracks.length < 200">
<!--            <h1>hoi</h1>-->
            <playlist-header :collection="collection"/>
        </track-list>
        <track-list-virtual v-else :collection="collection">
            <playlist-header :collection="collection"/>
        </track-list-virtual>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useBaseStore} from "../../scripts/store/base";
import TrackListVirtual from "../../components/TrackListVirtual.vue";
import type {ItemCollection} from "../../scripts/types";
import TrackList from "../../components/TrackList.vue";
import PlaylistHeader from "../../components/PlaylistHeader.vue";

const route = useRoute()
const base = useBaseStore();
const spotify = useSpotifyStore()
const playlist = ref(null as null | SpotifyApi.PlaylistObjectFull);

const collection = computed(() => {
    let tracks = [] as SpotifyApi.TrackObjectFull[]
    if (playlist.value !== null) {
        tracks = playlist.value.tracks.items.map(t => t.track as SpotifyApi.TrackObjectFull)
    }
    return {
        id: playlist.value?.id ?? 'playlist',
        tracks,
        type: "playlist",
        context: playlist.value,
    } as ItemCollection
})

let loadedId = route.params.id as string;
watch(route, async () => {
    if (route.path.startsWith('/playlist') && typeof route.params.id === 'string' && route.params.id !== loadedId) {
        loadedId = route.params.id;
        playlist.value = await spotify.getPlaylist(loadedId);
    }
})
spotify.getPlaylist(loadedId).then(r => {
    playlist.value = r;
    console.log("Playlist", r);
})

</script>

<style scoped lang="scss">
</style>