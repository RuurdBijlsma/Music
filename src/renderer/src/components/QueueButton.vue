<template>
    <v-menu
        :class="{ dark: theme.current.value.dark }"
        :close-on-content-click="false"
        transition="none"
    >
        <template #activator="{ props }">
            <v-btn rounded v-bind="props" variant="text" @click="delayedScrollToTrack">
                <v-icon>mdi-playlist-play</v-icon>
            </v-btn>
        </template>
        <v-card v-if="collection" class="card-bg">
            <v-card-title class="card-title">{{ collection.name }} </v-card-title>
            <v-divider />
            <track-list
                v-if="player.queue.length < 200"
                :collection="collection"
                :tracks="player.queue"
                class="list-container pb-2"
                padding-top="0"
            />
            <track-list-virtual
                v-else
                :collection="collection"
                :scroll-into-view="focusTrack"
                :tracks="player.queue"
                class="list-container"
                height="500"
                padding-top="10px"
            />
            <v-card-actions v-if="collection.to !== ''">
                <v-btn
                    :color="ui.themeColor"
                    :disabled="route.path === collection.to"
                    :to="collection.to"
                >
                    Go to {{ collection.buttonText }}
                </v-btn>
                <v-btn :color="ui.themeColor" @click="scrollToTrack"> Scroll to track </v-btn>
            </v-card-actions>
        </v-card>
    </v-menu>
</template>

<script lang="ts" setup>
import TrackListVirtual from './track-list/TrackListVirtual.vue'
import TrackList from './track-list/TrackList.vue'
import { usePlayerStore } from '../store/player/player'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import { useTheme } from 'vuetify'
import { useUIStore } from '../store/UI/UIStore'

const player = usePlayerStore()
const ui = useUIStore()
const theme = useTheme()
const route = useRoute()
const { collection } = storeToRefs(player)
const focusTrack = ref(null as SpotifyApi.TrackObjectFull | null)

let smoothScroll = false

function delayedScrollToTrack() {
    smoothScroll = false
    setTimeout(() => {
        scrollToTrack()
        smoothScroll = true
    }, 100)
}

function scrollToTrack() {
    if (player.track === null) return
    focusTrack.value = player.track
    const index = player.queue.findIndex((t) => t.id === player.trackId)
    const container = document.querySelector('.list-container')
    if (container === null) return
    container.scrollTo({
        top: (index - 3) * 50,
        behavior: smoothScroll ? 'smooth' : 'auto'
    })
}
</script>

<style lang="less" scoped>
.card-bg {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(40px) saturate(150%) brightness(120%);
    background-color: rgba(var(--v-theme-background), 0.4);
}

.dark .card-bg {
    backdrop-filter: blur(40px) saturate(150%) brightness(90%);
    background-color: rgba(var(--v-theme-background), 0.6);
}

.card-title {
    opacity: 0.7;
    font-weight: bolder;
}

.list-container {
    max-height: 500px;
    width: 450px;
    overflow-y: auto;
}
</style>
