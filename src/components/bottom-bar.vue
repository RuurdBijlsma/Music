<template>
    <v-sheet rounded elevation="4" class="bottom-bar">
        <div class="music-info">
            <v-img class="album-art"></v-img>
            <div class="music-info-text">
                <p class="music-title">Capricorn</p>
                <p class="music-artist">Elderbrook</p>
            </div>
        </div>
        <div class="music-controls">
            <v-btn variant="text" icon size="35">
                <v-icon size="15">mdi-shuffle</v-icon>
            </v-btn>
            <v-btn variant="text" icon size="35">
                <v-icon size="15">mdi-previous</v-icon>
            </v-btn>
            <v-btn variant="text" icon size="45">
                <v-icon size="30">mdi-play</v-icon>
            </v-btn>
            <v-btn variant="text" icon size="35">
                <v-icon size="15">mdi-next</v-icon>
            </v-btn>
            <v-btn variant="text" icon size="35">
                <v-icon size="15">mdi-repeat</v-icon>
            </v-btn>
        </div>
        <div class="music-progress">
            <div class="music-time">
                2:34 / 4:31
            </div>
            <div class="progress-container">

            </div>
        </div>
        <div class="extra-bar-buttons">
            <v-btn rounded variant="text">
                <v-icon>mdi-heart</v-icon>
            </v-btn>
            <v-btn rounded variant="text">
                <v-icon>mdi-playlist</v-icon>
            </v-btn>
        </div>
        <div class="volume-slider">
            <v-btn variant="text" rounded flat>
                <v-icon>mdi-volume-high</v-icon>
            </v-btn>
            <v-slider hide-details :min="0" :max="1" :model-value="volume"></v-slider>
        </div>
    </v-sheet>
</template>

<script setup>
import {ref} from "vue";

let volume = ref(0.7);
</script>

<style scoped>
.bottom-bar {
    background-color: rgba(255,255,255,0.6);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: calc(100% - 20px);
    height: 70px;
    backdrop-filter: blur(30px);
    padding:10px;
    align-items: center;
}
.volume-slider{
    display: flex;
    flex-direction: row;
    align-items: center;
    height:100%;
    justify-content: space-between;
    width:150px;
}
</style>