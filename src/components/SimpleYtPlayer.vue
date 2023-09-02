<template>
    <template v-if="isLoaded">
        <v-btn @click="togglePlay" icon variant="tonal"
               density="compact">
            <v-progress-circular :indeterminate="isNaN(loadProgress)"
                                 :model-value="loadProgress"
                                 size="24" v-if="loading"/>
            <v-icon v-else-if="playing">mdi-pause</v-icon>
            <v-icon v-else>mdi-play</v-icon>
        </v-btn>
    </template>
    <v-btn v-else @click="load(track)" icon="mdi-play" variant="tonal"
           density="compact"></v-btn>
    <simple-progress-bar @seek="playerElement.currentTime = $event" :current-time="currentTime" :duration="duration"
                         v-if="isLoaded"/>
</template>

<script setup lang="ts">
import SimpleProgressBar from "./SimpleProgressBar.vue";
import {useSearchStore} from "../scripts/store/search";
import {onUnmounted, ref} from "vue";
import type {PropType} from 'vue'
import EventEmitter from "events";
import {usePlatformStore} from "../scripts/store/electron";

defineProps({
    track: {
        type: Object as PropType<SpotifyApi.TrackObjectFull>,
        required: true
    },
})

const search = useSearchStore()
const platform = usePlatformStore()

const currentTime = ref(0)
const duration = ref(1)
const loadProgress = ref(0)
const playing = ref(false)
const loading = ref(false)
const isLoaded = ref(false)

const playerElement = createAudioElement()
const events = new EventEmitter()

onUnmounted(() => {
    playerElement.src = ''
    playerElement.load()
})

function createAudioElement() {
    let element = document.createElement('audio')
    element.autoplay = true
    element.addEventListener('play', () => {
        playing.value = !element.paused
    })
    element.addEventListener('pause', () => {
        playing.value = !element.paused
    })
    element.addEventListener('durationchange', () => {
        duration.value = element.duration
    })
    element.addEventListener('canplay', () => {
        loading.value = false
    })
    element.addEventListener('timeupdate', () => {
        // console.log("audio timeupdate")
        currentTime.value = element.currentTime
    })
    return element
}

async function load(track: SpotifyApi.TrackObjectFull) {
    isLoaded.value = true
    loading.value = true
    loadProgress.value = NaN
    const id = track.id

    events.on(id + 'progress', progress => {
        loadProgress.value = progress.percent
    })
    playerElement.src = await platform.getTrackFile(track, events)
    console.log(playerElement)
}

async function togglePlay() {
    if (playing.value) {
        playerElement.pause()
    } else {
        await playerElement.play()
    }
}
</script>

<style scoped lang="scss">
</style>