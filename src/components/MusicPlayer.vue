<template>
    <div class="mp" ref="musicContainer" v-if="player.track !== null">
        <v-spacer></v-spacer>
        <glow-image class="album-art" :src="base.itemImage(player.track)" :width="elWidth / 1.6" :height="elWidth / 1.6"
                    rounding="10px"/>
        <div class="sheet">
            <div class="music-info-text">
                <h2 class="music-title">{{ player.track.name }}</h2>
                <h3 class="music-artist"><artists-span :artists="player.track.artists"></artists-span></h3>
            </div>
            <div class="music-progress">
                <div class="music-time-current">{{ base.msToReadable(player.currentTime * 1000) }}</div>
                <div class="progress-container">

                </div>
                <div class="music-time-total">{{ base.msToReadable(player.duration * 1000) }}</div>
            </div>
            <div class="music-controls">
                <v-btn variant="text" icon size="35">
                    <v-icon size="20">mdi-shuffle</v-icon>
                </v-btn>
                <v-btn variant="text" icon="mdi-skip-previous" size="35"></v-btn>
                <v-btn icon size="60" @click="player.togglePlay">
                    <v-progress-circular :indeterminate="isNaN(player.loadProgress)" :model-value="player.loadProgress"
                                         size="40" v-if="player.loading"></v-progress-circular>
                    <v-icon size="30" v-else-if="player.playing">mdi-pause</v-icon>
                    <v-icon size="30" v-else>mdi-play</v-icon>
                </v-btn>
                <v-btn variant="text" icon="mdi-skip-next" size="35"></v-btn>
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
    </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import GlowImage from "./GlowImage.vue";
import {usePlayerStore} from "../scripts/store/player";
import {useBaseStore} from "../scripts/store/base";
import Artists from "../views/library/Artists.vue";
import ArtistsSpan from "./ArtistsSpan.vue";

const player = usePlayerStore()
const base = useBaseStore()
const volume = ref(0.7);
const elWidth = ref(0);
const musicContainer = ref(null);

function checkElWidth() {
    let el = musicContainer.value as HTMLElement | null;
    if (el === null) return;
    elWidth.value = el.getBoundingClientRect().width;
    // console.log("Width of el = " + elWidth.value);
}

window.addEventListener('resize', () => checkElWidth());
let interval = 0;
onMounted(() => {
    checkElWidth();
    interval = window.setInterval(() => {
        checkElWidth();
    }, 100);
})
</script>

<style scoped>
.mp {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
}

.album-art {
    flex-grow: 0;
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
}

.music-title {
    font-weight: 400;
}

.music-artist {
    font-weight: 300;
    opacity: 0.7;
    font-size: 18px;
}

.music-progress {
    display: flex;
    font-size: 13px;
}

.music-time-current, .music-time-total {
    opacity: 0.7;
    font-weight: 600;
}

.progress-container {
    width: 250px;
    height: 10px;
    background-color: rgba(0, 0, 0, 0.5);
    margin: 5px 20px 20px;
    border-radius: 5px
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