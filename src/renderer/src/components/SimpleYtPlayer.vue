<template>
    <template v-if="isLoaded">
        <play-button
            @click="togglePlay"
            :loading="loading"
            :load-progress="loadProgress"
            :playing="playing"
            :size="30"
            density="compact"
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
        :current-time="currentTime"
        :duration="duration"
        @seek="playerElement.currentTime = $event * duration"
    />
</template>

<script lang="ts" setup>
import SimpleProgressBar from "./SimpleProgressBar.vue";
import type { PropType } from "vue";
import { onUnmounted, ref } from "vue";
import { usePlatformStore } from "../store/electron";
import { useBaseStore } from "../store/base";
import PlayButton from "./PlayButton.vue";

defineProps({
    track: {
        type: Object as PropType<SpotifyApi.TrackObjectFull>,
        required: true,
    },
});

const platform = usePlatformStore();
const base = useBaseStore();

const currentTime = ref(0);
const duration = ref(1);
const loadProgress = ref(0);
const playing = ref(false);
const loading = ref(false);
const isLoaded = ref(false);

const playerElement = createAudioElement();

onUnmounted(() => {
    playerElement.src = "";
    playerElement.load();
});

function createAudioElement() {
    let element = document.createElement("audio");
    element.autoplay = true;
    element.addEventListener("play", () => {
        playing.value = !element.paused;
    });
    element.addEventListener("pause", () => {
        playing.value = !element.paused;
    });
    element.addEventListener("durationchange", () => {
        duration.value = element.duration;
    });
    element.addEventListener("canplay", () => {
        loading.value = false;
    });
    element.addEventListener("timeupdate", () => {
        currentTime.value = element.currentTime;
    });
    return element;
}

async function load(track: SpotifyApi.TrackObjectFull) {
    isLoaded.value = true;
    loading.value = true;
    loadProgress.value = NaN;
    const id = track.id;

    let onProgress: (percent: number) => void;
    onProgress = (percent) => {
        loadProgress.value = percent;
        if (percent === 100) base.events.off(id + "progress", onProgress);
    };
    base.events.on(id + "progress", onProgress);
    playerElement.src = await platform.getTrackFile(track, false);
}

async function togglePlay() {
    if (playing.value) {
        playerElement.pause();
    } else {
        await playerElement.play();
    }
}
</script>

<style lang="less" scoped></style>
