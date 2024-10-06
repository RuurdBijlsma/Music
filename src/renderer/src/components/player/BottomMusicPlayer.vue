<template>
    <div v-if="player.track !== null" ref="musicContainer" class="mp">
        <glow-image
            :height="100"
            :src="itemImage(player.track)"
            :width="100"
            class="first-section"
            rounding="10px"
        />
        <div class="second-section">
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
                    <compact-progress-bar class="progress-bar" />
                </div>
                <div class="music-time-total">
                    {{ msToReadable(player.duration * 1000) }}
                </div>
            </div>
        </div>
        <div class="third-section">
            <div class="music-controls">
                <v-btn
                    :color="player.shuffle ? ui.themeColor : 'default'"
                    :variant="ui.themeTooSimilarToFg && player.shuffle ? 'tonal' : 'text'"
                    icon
                    size="20"
                    @click="player.toggleShuffle"
                >
                    <v-icon size="14">mdi-shuffle</v-icon>
                </v-btn>
                <v-btn
                    icon="mdi-skip-previous"
                    size="25"
                    variant="text"
                    @click="player.skip(-1)"
                ></v-btn>
                <v-btn icon size="30" variant="text" @click="player.togglePlay">
                    <v-progress-circular
                        v-if="player.loading"
                        :indeterminate="isNaN(player.loadProgress)"
                        :model-value="player.loadProgress"
                        size="25"
                    ></v-progress-circular>
                    <v-icon v-else-if="player.playing" size="30">mdi-pause </v-icon>
                    <v-icon v-else size="30">mdi-play</v-icon>
                </v-btn>
                <v-btn
                    icon="mdi-skip-next"
                    size="25"
                    variant="text"
                    @click="player.skip(1)"
                ></v-btn>
                <v-btn
                    :color="player.repeat ? ui.themeColor : 'default'"
                    :variant="ui.themeTooSimilarToFg && player.repeat ? 'tonal' : 'text'"
                    icon
                    size="20"
                    @click="player.toggleRepeat"
                >
                    <v-icon size="14">mdi-repeat</v-icon>
                </v-btn>
            </div>
            <div class="extra-bar-buttons">
                <like-button :item="player.track" variant="fill" />
                <queue-button />
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
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import GlowImage from '../GlowImage.vue'
import { usePlayerStore } from '../../store/player/player'
import ArtistsSpan from '../ArtistsSpan.vue'
import LikeButton from '../item/LikeButton.vue'
import QueueButton from '../QueueButton.vue'
import ItemMenu from '../item/ItemMenu.vue'
import CompactProgressBar from './CompactProgressBar.vue'
import { useUIStore } from '../../store/UI/UIStore'
import { itemImage } from '../../scripts/item-utils'
import { msToReadable } from '../../scripts/utils'

const player = usePlayerStore()
const ui = useUIStore()
const musicContainer = ref(null)
</script>

<style lang="less" scoped>
.mp {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 10px;
    justify-content: space-between;
}

.first-section {
    box-shadow: 0 8px 20px -3px rgba(0, 0, 0, 0.3);
}

.second-section {
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
    flex-grow: 1;
    margin-right: -25px;
    overflow: hidden;
}

.music-info-text {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    font-size: 13px;
    font-weight: 300;
    width: 100%;
}

.music-title {
    font-weight: 400;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
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
    width: 100%;
    padding-left: 10px;
    padding-right: 10px;
    justify-content: space-between;
    margin-top: 20px;
}

.music-time-current,
.music-time-total {
    opacity: 0.7;
    font-weight: 600;
    width: 35px;
    text-align: left;
}

.progress-container {
    width: 100%;
    margin-left: 10px;
    margin-right: 10px;
}

.progress-bar {
    flex-grow: 1;
    margin-top: 1px;
}

.third-section {
    display: flex;
    flex-direction: column;
    height: calc(100% - 10px);
    justify-content: center;
    gap: 20px;
    margin-top: 10px;
}

.extra-bar-buttons {
    display: flex;
    flex-direction: row;
    gap: 2px;
    justify-content: right;
    transform: scale(0.85);
    margin-right: -10px;
}

.music-controls {
    justify-content: right;
    margin-right: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
}
</style>
