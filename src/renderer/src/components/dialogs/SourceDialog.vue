<template>
    <v-dialog v-model="source.show" :class="{ dark: ui.isDark }" :scrollable="true" width="auto">
        <div class="translucent">
            <v-card-title class="main-title pt-5 mb-3">
                Choose a YouTube source video
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text
                :style="{
                    overflowY: source.loading ? 'hidden' : 'auto',
                    alignItems: source.loading ? 'center' : 'left'
                }"
                class="card-content"
            >
                <v-progress-circular v-if="source.loading" indeterminate size="100" />
                <template v-else>
                    <div v-for="(item, i) in source.items" class="yt-card mb-5">
                        <v-img
                            :src="getImg(item)"
                            class="image"
                            height="200"
                            max-width="355"
                            min-width="355"
                        >
                            <p class="duration">
                                {{ item.length.simpleText }}
                            </p>
                            <p v-if="youtubeSource === item.id" class="selected">Active</p>
                        </v-img>
                        <div class="info-content">
                            <h3 class="title mb-1">{{ item.title }}</h3>
                            <div class="channel mt-2">
                                <v-avatar :color="randomColor(item.id)"
                                    >{{ item.channelTitle[0] }}
                                </v-avatar>
                                <span class="ml-4">{{ item.channelTitle }}</span>
                            </div>
                            <spacer></spacer>
                            <div class="actions mt-4">
                                <v-btn
                                    v-if="youtubeSource !== item.id"
                                    variant="tonal"
                                    @click="activate(item)"
                                >
                                    activate
                                </v-btn>
                                <simple-yt-player
                                    v-if="spotifyTracks[i]"
                                    :track="spotifyTracks[i]"
                                ></simple-yt-player>
                            </div>
                        </div>
                    </div>
                </template>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-btn :block="true" :color="ui.themeColor" @click="source.show = false"
                    >Dismiss
                </v-btn>
            </v-card-actions>
        </div>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useTheme } from 'vuetify'
import { useSearchStore } from '../../store/search'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import SimpleYtPlayer from '../player/SimpleYtPlayer.vue'
import { useLibraryStore } from '../../store/library'
import { YouTubeSearchResult } from '../../scripts/types'
import Spacer from '../Spacer.vue'
import { useUIStore } from '../../store/UI/UIStore'
import { useDialogStore } from '../../store/UI/dialogStore'

const theme = useTheme()
const search = useSearchStore()
const ui = useUIStore()
const library = useLibraryStore()
const dialog = useDialogStore()
const { source } = storeToRefs(dialog)

function activate(item: any) {
    library.activateSource(item.id)
}

function getImg(item: YouTubeSearchResult) {
    return item.thumbnail.thumbnails[item.thumbnail.thumbnails.length - 1].url
}

let lastSourceTrackId = ''
const spotifyTracks = ref([] as SpotifyApi.TrackObjectFull[])
watch(
    () => source.value.items,
    () => {
        onTracksChange()
    }
)
onTracksChange()

const youtubeSource = computed(() => source.value.trackData?.metadata.youTubeSource)

function onTracksChange() {
    if (source.value.spotifyTrack && source.value.spotifyTrack?.id !== lastSourceTrackId) {
        lastSourceTrackId = source.value.spotifyTrack?.id
        spotifyTracks.value = source.value.items.map(search.ytSearchResultToTrack)
    }
}

const randomColor = (id: string) => {
    const random = parseInt(id.substring(2, 6), 36) / 1679616
    if (theme.current.value.dark) {
        return 'hsl(' + 360 * random + ',' + (25 + 70 * random) + '%,' + (25 + 10 * random) + '%)'
    } else {
        return 'hsl(' + 360 * random + ',' + (25 + 70 * random) + '%,' + (75 + 10 * random) + '%)'
    }
}
</script>

<style lang="less" scoped>
.translucent {
    backdrop-filter: blur(40px) saturate(150%) brightness(130%);
    background-color: rgba(var(--v-theme-background), 0.5);
    border-radius: 8px;
    box-shadow: 0 4px 2px 0 rgba(0, 0, 0, 0.2);
}

.dark .translucent {
    backdrop-filter: blur(40px) saturate(150%) brightness(70%) !important;
    background-color: rgba(var(--v-theme-background), 0.7) !important;
}

.main-title {
    text-align: center;
}

.card-content {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    overflow-y: auto;
    max-height: calc(100vh - 300px);
    overflow-x: hidden;
}

.card-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
}

.card-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
}

.yt-card {
    display: flex;
    gap: 20px;
    width: 100%;
}

.image {
    border-radius: 7px;
    box-shadow: 0 4px 2px 0 rgba(0, 0, 0, 0.2);
    background-color: black;
}

.duration,
.selected {
    position: absolute;
    border-radius: 5px;
    padding: 4px 8px;
    font-size: 12px;
    text-transform: uppercase;
}

.duration {
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.8);
}

.selected {
    top: 10px;
    left: 10px;
    background-color: #179b4e;
}

.info-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px 5px;
}

.title {
    font-size: 20px;
    font-weight: 500;
    opacity: 0.9;
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: calc(100% - 50px);
}

.channel {
    display: flex;
    align-items: center;
}

.description {
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow-y: hidden;
    font-size: 14px;
    opacity: 0.8;
}

.actions {
    display: flex;
    gap: 20px;
    align-items: center;
}

h1,
h2,
h3,
h4 {
    text-align: left;
}
</style>
