<template>
    <div v-if="player.track !== null" ref="musicContainer" class="mp">
        <spacer></spacer>
        <glow-image
            :height="lowWindow ? elWidth / 2.5 : elWidth / 2"
            :src="itemImage(player.track)"
            :width="lowWindow ? elWidth / 2.5 : elWidth / 2"
            class="album-art"
            rounding="10px"
        />
        <div class="sheet">
            <div class="music-info-text">
                <h2 class="music-title">{{ player.track.name }}</h2>
                <h3 class="music-artist">
                    <artists-span :artists="player.track.artists"></artists-span>
                </h3>
            </div>
            <div class="music-progress">
                <div class="music-time-current">
                    {{ msToReadable(player.currentTime * 1000) }}
                </div>
                <div class="progress-container">
                    <progress-bar />
                </div>
                <div class="music-time-total">
                    {{ msToReadable(player.duration * 1000) }}
                </div>
            </div>
            <div class="music-controls">
                <v-btn
                    :color="player.shuffle ? ui.themeColor : 'default'"
                    :variant="ui.themeTooSimilarToFg && player.shuffle ? 'tonal' : 'text'"
                    icon
                    size="35"
                    @click="player.toggleShuffle"
                >
                    <v-icon size="20">mdi-shuffle</v-icon>
                </v-btn>
                <v-btn
                    icon="mdi-skip-previous"
                    size="35"
                    variant="text"
                    @click="player.skip(-1)"
                ></v-btn>
                <play-button
                    :icon-size="30"
                    :load-progress="player.loadProgress"
                    :loading="player.loading"
                    :playing="player.playing"
                    :size="60"
                    @click="player.togglePlay"
                ></play-button>
                <v-btn
                    icon="mdi-skip-next"
                    size="35"
                    variant="text"
                    @click="player.skip(1)"
                ></v-btn>
                <v-btn
                    :color="player.repeat ? ui.themeColor : 'default'"
                    :variant="ui.themeTooSimilarToFg && player.repeat ? 'tonal' : 'text'"
                    icon
                    size="35"
                    @click="player.toggleRepeat"
                >
                    <v-icon size="20">mdi-repeat</v-icon>
                </v-btn>
            </div>
        </div>
        <spacer></spacer>
        <div class="extra-bar-buttons">
            <like-button :item="player.track" variant="fill" />
            <queue-button />
            <div class="volume-slider">
                <v-slider
                    v-model="player.volume"
                    :max="1"
                    :min="0"
                    :prepend-icon="
                        player.volume < 0.2
                            ? 'mdi-volume-low'
                            : player.volume < 0.7
                              ? 'mdi-volume-medium'
                              : 'mdi-volume-high'
                    "
                    density="compact"
                    hide-details
                    thumb-size="10"
                    track-size="1"
                    @wheel.passive="handleScroll"
                    @click:prepend="toggleMute"
                ></v-slider>
            </div>
            <v-menu>
                <template #activator="{ props }">
                    <v-btn class="track-options ml-2" rounded v-bind="props" variant="text">
                        <v-icon>mdi-dots-horizontal</v-icon>
                    </v-btn>
                </template>
                <item-menu :item="player.track" />
            </v-menu>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import GlowImage from '../GlowImage.vue'
import { usePlayerStore } from '../../store/player/player'
import ArtistsSpan from '../ArtistsSpan.vue'
import LikeButton from '../item/LikeButton.vue'
import QueueButton from '../QueueButton.vue'
import ItemMenu from '../item/ItemMenu.vue'
import Spacer from '../Spacer.vue'
import PlayButton from './PlayButton.vue'
import { useUIStore } from '../../store/UI/UIStore'
import { msToReadable } from '../../scripts/utils'
import { itemImage } from '../../scripts/item-utils'
import ProgressBar from './ProgressBar.vue'
import { storeToRefs } from 'pinia'

const player = usePlayerStore()
const ui = useUIStore()

const { windowWidth } = storeToRefs(ui)
const elWidth = ref(0)
const musicContainer = ref(null)

let volumeBeforeMute = 1
const lowWindow = computed(() => ui.windowHeight < 820)

function handleScroll(e: WheelEvent) {
    const newVolume = player.volume - e.deltaY / 3000
    player.volume = Math.max(0, Math.min(1, newVolume))
}

function toggleMute() {
    if (player.volume > 0) {
        volumeBeforeMute = player.volume
        player.volume = 0
    } else {
        player.volume = volumeBeforeMute
    }
}

function checkElWidth() {
    const el = musicContainer.value as HTMLElement | null
    if (el === null) return
    elWidth.value = el.getBoundingClientRect().width
}

let interval = 0
watch(windowWidth, () => checkElWidth())
checkElWidth()
onMounted(() => {
    interval = window.setInterval(() => checkElWidth(), 100)
})
onUnmounted(() => clearInterval(interval))
</script>

<style lang="less" scoped>
.mp {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    text-align: center;
}

.album-art {
    box-shadow: 0 8px 20px -3px rgba(0, 0, 0, 0.3);
}

.sheet {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 400px;
    margin-top: 40px;
}

.music-info-text {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    margin-bottom: 15px;
    font-size: 20px;
    font-weight: 300;
    height: 127px;
}

.music-title {
    overflow-y: hidden;
    font-weight: 400;
    text-align: center;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

@media (max-height: 820px) {
    .sheet {
        margin-top: 10px !important;
    }

    .music-info-text {
        font-size: 15px;
        margin-bottom: 0;
    }

    .music-artist {
        font-size: 16px !important;
    }
}

.music-artist {
    font-weight: 300;
    opacity: 0.7;
    text-align: center;
    font-size: 18px;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: calc((100vw - 70px) / 2 - 80px);
    max-width: 700px;
}

.music-progress {
    display: flex;
    font-size: 13px;
}

.music-time-current,
.music-time-total {
    opacity: 0.7;
    font-weight: 600;
    width: 35px;
    text-align: left;
    padding-top: 38px;
}

.progress-container {
    width: 300px;
    height: 100px;
    margin-left: 10px;
    margin-right: 10px;
}

.extra-bar-buttons {
    display: flex;
}

.music-controls {
    width: 250px;
    justify-content: space-evenly;
    display: flex;
    align-items: center;
}

.volume-slider {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    justify-content: space-between;
    width: 150px;
}
</style>
