<template>
    <v-list density="compact">
        <v-list-subheader v-if="showDescriptor" class="descriptor"
            >{{ descriptor }}
        </v-list-subheader>

        <v-divider v-if="showDescriptor" />

        <v-list-item v-if="canLike && !base.offlineMode" @click="library.toggleLike(item)">
            <template #prepend>
                <v-icon v-if="isLiked" icon="mdi-heart"></v-icon>
                <v-icon v-else icon="mdi-heart-outline"></v-icon>
            </template>
            <v-list-item-title v-if="isLiked"> Remove from library </v-list-item-title>
            <v-list-item-title v-else>Add to library</v-list-item-title>
        </v-list-item>

        <v-menu v-if="!base.offlineMode" location="left">
            <template #activator="{ props }">
                <v-list-item
                    v-if="item.type === 'track' && !item.id.startsWith('yt-')"
                    v-bind="props"
                >
                    <template #prepend>
                        <v-progress-circular
                            v-if="loadAddPlaylist"
                            class="mr-8"
                            indeterminate
                            size="25"
                            width="2"
                        />
                        <v-icon v-else icon="mdi-playlist-plus" />
                    </template>
                    <v-list-item-title>Add to playlist</v-list-item-title>
                </v-list-item>
            </template>
            <v-list density="compact">
                <v-list-item prepend-icon="mdi-playlist-plus" @click="createPlaylist()">
                    <v-list-item-title>Create playlist</v-list-item-title>
                </v-list-item>
                <v-list-item
                    v-for="playlist in library.userPlaylists"
                    @click="addToPlaylist(playlist.id, item as Item)"
                >
                    <template #prepend>
                        <v-avatar rounded>
                            <v-img :src="itemImage(playlist)" />
                        </v-avatar>
                    </template>
                    <v-list-item-title>{{ playlist.name }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

        <v-list-item
            v-if="
                library.viewedPlaylist !== null &&
                item.type === 'track' &&
                canRemoveTrackFromPlaylist(item.id)
            "
            @click="removeFromViewedPlaylist(item.uri)"
        >
            <template #prepend>
                <v-progress-circular
                    v-if="loadRemovePlaylist"
                    class="mr-8"
                    indeterminate
                    size="25"
                    width="2"
                />
                <v-icon v-else icon="mdi-playlist-minus" />
            </template>
            <v-list-item-title>
                Remove from
                {{ library.viewedPlaylist.name }}
            </v-list-item-title>
        </v-list-item>

        <v-list-item
            v-if="item.type === 'track'"
            :exact="true"
            :to="`/radio?id=${radioId()}&seed_tracks=${item.id}`"
        >
            <template #prepend>
                <v-icon icon="mdi-radio-tower" />
            </template>
            <v-list-item-title>Go to track radio</v-list-item-title>
        </v-list-item>

        <v-list-item
            v-if="item.type === 'artist'"
            :exact="true"
            :to="`/radio?id=${radioId()}&seed_artists=${item.id}`"
        >
            <template #prepend>
                <v-icon icon="mdi-radio-tower" />
            </template>
            <v-list-item-title>Go to artist radio</v-list-item-title>
        </v-list-item>

        <v-list-item
            v-if="item.type === 'track' && !route.path.startsWith('/album')"
            :exact="true"
            :to="itemUrl(item.album)"
        >
            <template #prepend>
                <v-icon icon="mdi-album" />
            </template>
            <v-list-item-title>Go to album</v-list-item-title>
        </v-list-item>

        <v-divider v-if="item.type === 'track'" />

        <v-list-item
            v-if="!base.offlineMode && item.type === 'track'"
            class="small-item"
            density="compact"
            @click="library.chooseSource(item)"
        >
            <v-list-item-title class="small-title">Change source </v-list-item-title>
        </v-list-item>
        <v-list-item
            v-if="
                item.type === 'track' &&
                isDownloaded &&
                (player.track === null || player.track.id !== item.id)
            "
            class="small-item"
            density="compact"
            @click="deleteTrack"
        >
            <v-list-item-title class="small-title">Delete file </v-list-item-title>
        </v-list-item>
        <v-list-item
            v-if="
                !base.offlineMode &&
                item.type === 'track' &&
                player.track !== null &&
                isDownloaded &&
                player.track.id === item.id
            "
            class="small-item"
            density="compact"
            @click="player.reloadCurrentTrack"
        >
            <v-list-item-title class="small-title">Reload file </v-list-item-title>
        </v-list-item>
        <v-list-item
            v-if="item.type === 'track' && isLiked"
            class="small-item"
            density="compact"
            @click="editTrack(item)"
        >
            <v-list-item-title class="small-title">Edit track </v-list-item-title>
        </v-list-item>
    </v-list>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { useBaseStore } from '../../store/base'
import { useLibraryStore } from '../../store/library'
import type { Item, ItemCollection } from '../../scripts/types'
import { usePlatformStore } from '../../store/electron'
import { usePlayerStore } from '../../store/player/player'
import { useRoute } from 'vue-router'
import { itemImage, itemUrl, radioId } from '../../scripts/item-utils'
import { useDialogStore } from '../../store/UI/dialogStore'

const props = defineProps({
    item: {
        type: Object as PropType<Item | ItemCollection>,
        required: true
    },
    showDescriptor: {
        type: Boolean,
        default: false
    }
})
const base = useBaseStore()
const dialog = useDialogStore()
const library = useLibraryStore()
const platform = usePlatformStore()
const player = usePlayerStore()
const route = useRoute()
const isDownloaded = ref(false)
const loadAddPlaylist = ref(false)
const loadRemovePlaylist = ref(false)

const canLike = computed(() => {
    return 'type' in props.item && props.item.type !== 'liked'
})

function createPlaylist() {
    dialog.playlist.show = true
    dialog.playlist.startTrack = props.item as SpotifyApi.TrackObjectFull
}

function editTrack(track: SpotifyApi.TrackObjectFull) {
    const likedInfo = library.tracks.find((t) => t.id === track.id)
    if (likedInfo) library.editTrack(likedInfo)
}

onMounted(() => {
    if (props.item.type === 'track')
        platform.trackIsDownloaded(props.item as SpotifyApi.TrackObjectFull).then((v) => {
            isDownloaded.value = v
        })
})

function canRemoveTrackFromPlaylist(trackId: string) {
    if (library.viewedPlaylist === null) return false
    const playlistId = library.viewedPlaylist.id
    // if I can't edit playlist, I can't remove from playlist
    if (
        !library.viewedPlaylist.collaborative &&
        library.viewedPlaylist.owner.id !== library.userInfo.id
    )
        return false
    return (
        playlistId === route.params.id &&
        library.viewedPlaylist.tracks.items.find((t) => t.track.id === trackId) !== undefined
    )
}

async function removeFromViewedPlaylist(trackUri: string) {
    if (library.viewedPlaylist === null) return
    const playlistId = library.viewedPlaylist.id
    loadRemovePlaylist.value = true
    await library.removeFromPlaylist(playlistId, trackUri)
    loadRemovePlaylist.value = false
}

async function addToPlaylist(playlistId: string, track: Item) {
    loadAddPlaylist.value = true
    await library.addToPlaylist(playlistId, track as SpotifyApi.TrackObjectFull)
    loadAddPlaylist.value = false
}

async function deleteTrack() {
    await player.deleteTrack(props.item as SpotifyApi.TrackObjectFull)
    dialog.addSnack('Track file deleted')
    isDownloaded.value = false
}

const descriptor = computed(() => {
    const item = props.item
    if (item.type === 'track') {
        return `${item.name} - ${item.artists.map((a) => a.name).join(', ')}`
    }
    if (item.type === 'playlist') return item.name
    return ''
})

const isLiked = computed(() => {
    const type = props.item.type as 'playlist' | 'artist' | 'album' | 'track' | 'category'
    return library.checkLiked(type, props.item.id)
})
</script>

<style lang="less" scoped>
.descriptor {
    max-width: 250px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.small-item {
    opacity: 0.7;
}

.small-title {
    font-weight: 500;
    font-size: 12px;
}
</style>
