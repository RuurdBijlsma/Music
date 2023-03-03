<template>
    <div class="mp">
        <v-spacer></v-spacer>
        <v-img class="album-art" src="img/cover2.jpg" width="500" height="500"></v-img>
        <div class="sheet">
            <div class="music-info-text">
                <h2 class="music-title">Capricorn</h2>
                <h3 class="music-artist">Elderbrook</h3>
            </div>
            <div class="music-progress">
                <div class="music-time-current">2:34</div>
                <div class="progress-container">

                </div>
                <div class="music-time-total">4:31</div>
            </div>
            <div class="music-controls">
                <v-btn variant="text" icon size="35">
                    <v-icon size="20">mdi-shuffle</v-icon>
                </v-btn>
                <v-btn variant="text" icon="mdi-skip-previous" size="35"></v-btn>
                <v-btn icon size="60">
                    <v-icon size="30">mdi-play</v-icon>
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

<script setup>
import {ref} from "vue";

let volume = ref(0.7);
</script>

<style scoped>
.mp {
    display: flex;
    flex-direction: column;
    padding: 10px;
    align-items: center;
}

.album-art {
    flex-grow: 0;
    border-radius: 10px;
    box-shadow: 0 8px 20px -3px rgba(0, 0, 0, 0.3);
}

.sheet {
    background-color: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(100px) saturate(250%);

    border-radius: 5px;
    box-shadow: 0 3px 4px 0 rgba(0, 0, 0, 0.2);

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