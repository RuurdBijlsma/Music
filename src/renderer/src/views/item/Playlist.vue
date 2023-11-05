<template>
    <div v-if="playlist" class="playlist pb-8">
        <track-list
            v-if="collection && collection.tracks.length < 200"
            :collection="collection"
        >
            <playlist-header :collection="collection" />
        </track-list>
        <track-list-virtual
            v-else
            :collection="collection"
            :height="base.windowHeight.toString()"
        >
            <playlist-header :collection="collection" />
        </track-list-virtual>
    </div>
</template>

<script lang="ts" setup>
import { useLibraryStore } from "../../store/library";
import {computed, ref, watch} from "vue";
import { useRoute } from "vue-router";
import { useBaseStore } from "../../store/base";
import TrackListVirtual from "../../components/TrackListVirtual.vue";
import TrackList from "../../components/TrackList.vue";
import PlaylistHeader from "../../components/PlaylistHeader.vue";
import { useSpotifyApiStore } from "../../store/spotify-api";
import { storeToRefs } from "pinia";

const route = useRoute();
const base = useBaseStore();
const library = useLibraryStore();
const spotify = useSpotifyApiStore();
const playlist = ref(null as null | SpotifyApi.PlaylistObjectFull);
const { viewedPlaylistRefreshRequired } = storeToRefs(library);

const collection = computed(() => {
    if (playlist.value === null) return null;
    let tracks = playlist.value.tracks.items
        .filter((t) => t.track !== null)
        .map((t) => t.track as SpotifyApi.TrackObjectFull);
    return base.itemCollection(playlist.value, tracks);
});

async function refresh() {
    playlist.value = await spotify.getPlaylist(loadedId);
    library.viewedPlaylist = playlist.value;
    viewedPlaylistRefreshRequired.value = false;
}

let loadedId = route.params.id as string;
watch(route, async () => {
    if (
        route.path.startsWith("/playlist") &&
        typeof route.params.id === "string" &&
        route.params.id !== loadedId
    ) {
        loadedId = route.params.id;
        await refresh();
    }
});
watch(viewedPlaylistRefreshRequired, () => {
    if (viewedPlaylistRefreshRequired.value) refresh();
});

refresh();
</script>

<style lang="less" scoped></style>
