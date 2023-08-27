<template>
    <div class="mp" ref="musicContainer">
        <template v-if="player.track !== null">
            <v-spacer></v-spacer>
            <glow-image class="album-art" :src="base.itemImage(player.track)" :width="elWidth / 1.6"
                        :height="elWidth / 1.6"
                        rounding="10px"/>
            <div class="sheet">
                <div class="music-info-text">
                    <h2 class="music-title">{{ player.track.name }}</h2>
                    <h3 class="music-artist">
                        <artists-span :artists="player.track.artists"></artists-span>
                    </h3>
                </div>
                <div class="music-progress">
                    <div class="music-time-current">{{ base.msToReadable(player.currentTime * 1000) }}</div>
                    <div class="progress-container">
                        <progress-bar></progress-bar>
                    </div>
                    <div class="music-time-total">{{ base.msToReadable(player.duration * 1000) }}</div>
                </div>
                <div class="music-controls">
                    <v-btn variant="text" icon size="35">
                        <v-icon size="20">mdi-shuffle</v-icon>
                    </v-btn>
                    <v-btn variant="text" icon="mdi-skip-previous" size="35" @click="player.skip(-1)"></v-btn>
                    <v-btn variant="tonal" icon size="60" @click="player.togglePlay">
                        <v-progress-circular :indeterminate="isNaN(player.loadProgress)"
                                             :model-value="player.loadProgress"
                                             size="40" v-if="player.loading"></v-progress-circular>
                        <v-icon size="30" v-else-if="player.playing">mdi-pause</v-icon>
                        <v-icon size="30" v-else>mdi-play</v-icon>
                    </v-btn>
                    <v-btn variant="text" icon="mdi-skip-next" size="35" @click="player.skip(1)"></v-btn>
                    <v-btn variant="text" icon size="35">
                        <v-icon size="20">mdi-repeat</v-icon>
                    </v-btn>
                </div>
            </div>
            <v-spacer></v-spacer>
            <div class="extra-bar-buttons">
                <v-btn rounded variant="text">
                    <v-icon>mdi-heart</v-icon>
                </v-btn>
                <v-btn rounded variant="text">
                    <v-icon>mdi-playlist-play</v-icon>
                </v-btn>
                <div class="volume-slider">
                    <v-btn variant="text" rounded flat>
                        <v-icon>mdi-volume-high</v-icon>
                    </v-btn>
                    <v-slider hide-details :min="0" :max="1" :model-value="volume"></v-slider>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, watch} from "vue";
import GlowImage from "./GlowImage.vue";
import {usePlayerStore} from "../scripts/store/player";
import {useBaseStore} from "../scripts/store/base";
import Artists from "../views/library/Artists.vue";
import ArtistsSpan from "./ArtistsSpan.vue";
import ProgressBar from "./ProgressBar.vue";

const player = usePlayerStore()
const base = useBaseStore()
const volume = ref(0.7);
const elWidth = ref(0);
const musicContainer = ref(null);

function checkElWidth() {
    let el = musicContainer.value as HTMLElement | null;
    if (el === null) return;
    elWidth.value = el.getBoundingClientRect().width;
}


let interval = 0;
onMounted(() => {
    window.addEventListener('resize', checkElWidth);
    checkElWidth();
    interval = window.setInterval(() => checkElWidth(), 100);
})
onUnmounted(() => {
    window.removeEventListener('resize', checkElWidth)
})
</script>

<style scoped>
.mp {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    text-align: center;
}

.album-art {
    box-shadow: 0 8px 20px -3px rgba(0, 0, 0, 0.3);
    position: absolute;
    top: 200px;
}

.sheet {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 400px;
    margin-top: 40px;
    position: absolute;
    top: 500px;
}

.music-info-text {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    margin-bottom: 15px;
    font-size: 20px;
    font-weight: 300;
}

.music-title {
    font-weight: 400;
    text-align: center;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

.music-artist {
    font-weight: 300;
    opacity: 0.7;
    text-align: center;
    font-size: 18px;
}

.music-progress {
    display: flex;
    font-size: 13px;
    position: absolute;
    top: 100px;
}

.music-time-current, .music-time-total {
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
    position: absolute;
    top: 200px;
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