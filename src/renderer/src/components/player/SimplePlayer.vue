<template>
    <div class="simple-player">
        <template v-if="isLoaded">
            <play-button
                :color="color"
                :load-progress="loadProgress"
                :loading="loading"
                :playing="playing"
                :size="playButtonSize"
                density="compact"
                @click="togglePlay"
            ></play-button>
        </template>
        <v-btn
            v-else
            density="compact"
            icon="mdi-play"
            variant="tonal"
            @click="load(track)"
        ></v-btn>
        <simple-progress-bar
            v-if="isLoaded"
            :color="color"
            :current-time="currentTime - startTime"
            :duration="duration"
            @seek="seek"
        />
    </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, PropType, ref, watch } from 'vue'
import { usePlatformStore } from '../../store/electron'
import { useBaseStore } from '../../store/base'
import SimpleProgressBar from './SimpleProgressBar.vue'
import PlayButton from './PlayButton.vue'

const platform = usePlatformStore()
const base = useBaseStore()
const props = defineProps({
    track: {
        type: Object as PropType<SpotifyApi.TrackObjectFull>,
        required: true
    },
    endTime: {
        type: Number,
        default: -1
    },
    startTime: {
        type: Number,
        default: 0
    },
    instaLoad: {
        type: Boolean,
        default: false
    },
    color: {
        type: String,
        default: 'default'
    },
    autoPlay: {
        type: Boolean,
        default: false
    },
    playButtonSize: {
        type: Number,
        default: 30
    }
})

const playing = ref(false)
const currentTime = ref(0)
const loadProgress = ref(0)
const loading = ref(false)
const isLoaded = ref(false)

watch(
    () => props.startTime,
    () => {
        if (currentTime.value < props.startTime) {
            playerElement.currentTime = props.startTime
        }
    }
)

const endTime = computed(() =>
    props.endTime === -1 ? props.track.duration_ms / 1000 : props.endTime
)

const duration = computed(() => {
    return endTime.value - props.startTime
})

const playerElement = createAudioElement()

function createAudioElement() {
    const element = document.createElement('audio')
    element.autoplay = true
    element.addEventListener('play', () => {
        playing.value = !element.paused
    })
    element.addEventListener('pause', () => {
        playing.value = !element.paused
    })
    element.addEventListener('durationchange', () => {
        if (props.track.duration_ms !== playerElement.duration * 1000) {
            // todo update track duration maybe?
        }
    })
    element.addEventListener('canplay', () => {
        loading.value = false
    })
    element.addEventListener('timeupdate', () => {
        if (element.currentTime >= endTime.value) {
            element.pause()
        }
        currentTime.value = element.currentTime
    })
    return element
}

async function load(track: SpotifyApi.TrackObjectFull) {
    isLoaded.value = true
    loading.value = true
    loadProgress.value = NaN
    playerElement.volume = 0
    const id = track.id

    let onProgress: (percent: number) => void
    onProgress = (percent) => {
        loadProgress.value = percent
        if (percent === 100) base.events.off(id + 'progress', onProgress)
    }
    base.events.on(id + 'progress', onProgress)
    playerElement.src = await platform.getTrackFile(track)
    let onFirstPlay = () => {}
    onFirstPlay = () => {
        playerElement.currentTime = props.startTime
        if (!props.autoPlay) playerElement.pause()
        playerElement.removeEventListener('canplay', onFirstPlay)
        playerElement.volume = 1
    }
    playerElement.addEventListener('canplay', onFirstPlay)
}

function seek(percent: number) {
    playerElement.currentTime = Math.min(
        endTime.value,
        Math.max(props.startTime, props.startTime + percent * duration.value)
    )
}

async function togglePlay() {
    if (playing.value) {
        playerElement.pause()
    } else {
        if (playerElement.currentTime >= endTime.value) {
            playerElement.currentTime = props.startTime
        }
        await playerElement.play()
    }
}

onUnmounted(() => {
    playerElement.src = ''
    playerElement.load()
})

if (props.instaLoad) {
    load(props.track)
}
</script>

<style lang="less" scoped>
.simple-player {
    display: flex;
    align-items: center;
    gap: 20px;
}
</style>
