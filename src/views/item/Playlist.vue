<template>
    <div class="playlist" v-if="playlist">
        <track-list :collection="collection" v-if="collection && collection.tracks.length < 200">
            <playlist-header :collection="collection"/>
        </track-list>
        <track-list-virtual v-else :collection="collection" :height="base.pageHeight.toString()">
            <playlist-header :collection="collection"/>
        </track-list-virtual>
    </div>
</template>

<script setup lang="ts">
import {useLibraryStore} from "../../scripts/store/library";
import {computed, ref, toRaw, watch} from "vue";
import {useRoute} from "vue-router";
import {useBaseStore} from "../../scripts/store/base";
import TrackListVirtual from "../../components/TrackListVirtual.vue";
import TrackList from "../../components/TrackList.vue";
import PlaylistHeader from "../../components/PlaylistHeader.vue";
import {useSpotifyApiStore} from "../../scripts/store/spotify-api";

const route = useRoute()
const base = useBaseStore()
const library = useLibraryStore()
const spotify = useSpotifyApiStore()
const playlist = ref(null as null | SpotifyApi.PlaylistObjectFull);

const collection = computed(() => {
    if (playlist.value === null) return null
    let tracks = playlist.value.tracks.items.map(t => t.track as SpotifyApi.TrackObjectFull)
    return base.itemCollection(playlist.value, tracks)
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