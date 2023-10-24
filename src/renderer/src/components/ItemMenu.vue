<template>
    <v-list density="compact">
        <v-list-subheader v-if="showDescriptor" class="descriptor">{{ descriptor }}</v-list-subheader>
        <v-list-item @click="library.toggleLike(item)">
            <template v-slot:prepend>
                <v-icon v-if="isLiked" icon="mdi-heart"></v-icon>
                <v-icon v-else icon="mdi-heart-outline"></v-icon>
            </template>
            <v-list-item-title v-if="isLiked">Remove from library</v-list-item-title>
            <v-list-item-title v-else>Add to library</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="item.type==='track'" @click="library.chooseSource(item)">
            <template v-slot:prepend>
                <v-icon icon="mdi-youtube" />
            </template>
            <v-list-item-title>Choose different source</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="item.type==='track' && isDownloaded"
                     @click="deleteTrack">
            <template v-slot:prepend>
                <v-icon icon="mdi-trash-can" />
            </template>
            <v-list-item-title>Delete file</v-list-item-title>
        </v-list-item>
        <v-list-item @click="player.reloadCurrentTrack"
                     v-if="item.type==='track' && player.track !== null && isDownloaded && player.track.id === item.id">
            <template v-slot:prepend>
                <v-icon icon="mdi-reload" />
            </template>
            <v-list-item-title>Reload track file</v-list-item-title>
        </v-list-item>

        <v-menu location="left">
            <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" v-if="item.type==='track'">
                    <template v-slot:prepend>
                        <v-progress-circular v-if="loadAddPlaylist" class="mr-8" indeterminate size="25" width="2" />
                        <v-icon v-else icon="mdi-playlist-plus" />
                    </template>
                    <v-list-item-title>Add to playlist</v-list-item-title>
                </v-list-item>
            </template>
            <v-list density="compact">
                <v-list-item v-for="playlist in library.userPlaylists"
                             @click="addToPlaylist(playlist.id, item)">
                    <template v-slot:prepend>
                        <v-avatar rounded>
                            <v-img :src="base.itemImage(playlist)" />
                        </v-avatar>
                    </template>
                    <v-list-item-title>{{ playlist.name }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

        <v-list-item
            v-if="library.viewedPlaylist !== null && item.type==='track' && canRemoveTrackFromPlaylist(item.id)"
            @click="removeFromViewedPlaylist(item.uri)">
            <template v-slot:prepend>
                <v-progress-circular v-if="loadRemovePlaylist" class="mr-8" indeterminate size="25" width="2" />
                <v-icon v-else icon="mdi-playlist-minus" />
            </template>
            <v-list-item-title>Remove from {{ library.viewedPlaylist.name }}</v-list-item-title>
        </v-list-item>

        <v-list-item :exact="true" v-if="item.type === 'track'" :to="`/radio?id=${base.radioId()}&seed_tracks=${item.id}`">
            <template v-slot:prepend>
                <v-icon icon="mdi-radio-tower" />
            </template>
            <v-list-item-title>Go to track radio</v-list-item-title>
        </v-list-item>

        <v-list-item :exact="true" v-if="item.type === 'artist'" :to="`/radio?id=${base.radioId()}&seed_artists=${item.id}`">
            <template v-slot:prepend>
                <v-icon icon="mdi-radio-tower" />
            </template>
            <v-list-item-title>Go to artist radio</v-list-item-title>
        </v-list-item>

        <v-list-item :exact="true" v-if="item.type === 'track' && !route.path.startsWith('/album')" :to="base.itemUrl(item.album)">
            <template v-slot:prepend>
                <v-icon icon="mdi-album" />
            </template>
            <v-list-item-title>Go to album</v-list-item-title>
        </v-list-item>
    </v-list>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { PropType } from "vue";
import { useBaseStore } from "../store/base";
import { useLibraryStore } from "../store/library";
import type { Item } from "../scripts/types";
import { usePlatformStore } from "../store/electron";
import { usePlayerStore } from "../store/player";
import { useRoute } from "vue-router";

const props = defineProps({
    item: {
        type: Object as PropType<Item>,
        required: true
    },
    showDescriptor: {
        type: Boolean,
        default: false
    }
});
const base = useBaseStore();
const library = useLibraryStore();
const platform = usePlatformStore();
const player = usePlayerStore();
const route = useRoute();
const isDownloaded = ref(false);
const loadAddPlaylist = ref(false);
const loadRemovePlaylist = ref(false);
onMounted(() => {
    if (props.item.type === "track")
        platform.trackIsDownloaded(props.item as SpotifyApi.TrackObjectFull).then(v => {
            isDownloaded.value = v;
        });
});

function canRemoveTrackFromPlaylist(trackId: string) {
    if (library.viewedPlaylist === null) return false;
    const playlistId = library.viewedPlaylist.id;
    // if I can't edit playlist, I can't remove from playlist
    if(!library.viewedPlaylist.collaborative && library.viewedPlaylist.owner.id !== library.userInfo.id)
        return false;
    return playlistId === route.params.id && library.viewedPlaylist.tracks.items.find(t => t.track.id === trackId) !== undefined;
}

async function removeFromViewedPlaylist(trackUri: string) {
    if (library.viewedPlaylist === null) return;
    const playlistId = library.viewedPlaylist.id;
    loadRemovePlaylist.value = true;
    await library.removeFromPlaylist(playlistId, trackUri);
    loadRemovePlaylist.value = false;
}

async function addToPlaylist(playlistId: string, track: Item) {
    loadAddPlaylist.value = true;
    await library.addToPlaylist(playlistId, track as SpotifyApi.TrackObjectFull);
    loadAddPlaylist.value = false;
}

async function deleteTrack() {
    await player.deleteTrack(props.item as SpotifyApi.TrackObjectFull);
    isDownloaded.value = false;
}

const descriptor = computed(() => {
    const item = props.item;
    if (item.type === "track") {
        return `${item.name} - ${item.artists.map(a => a.name).join(", ")}`;
    }
    if (item.type === "playlist")
        return item.name;
    return "";
});

const isLiked = computed(() => library.checkLiked(props.item.type, props.item.id));

</script>

<style scoped lang="less">
.descriptor {
    max-width: 250px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
