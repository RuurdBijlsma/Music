<template>
    <div class="simple-player">
        <template v-if="isLoaded">
            <play-button
                @click="togglePlay"
                :loading="loading"
                :load-progress="loadProgress"
                :color="color"
                :playing="playing"
                :size="playButtonSize"
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
            :color="color"
            v-if="isLoaded"
            :current-time="currentTime - startTime"
            :duration="duration"
            @seek="seek"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, PropType, ref, toRaw, watch } from "vue";
import { usePlatformStore } from "../store/electron";
import { useBaseStore } from "../store/base";
import SimpleProgressBar from "./SimpleProgressBar.vue";
import PlayButton from "./PlayButton.vue";
import { useLibraryStore } from "../store/library";

const platform = usePlatformStore();
const base = useBaseStore();
const library = useLibraryStore();
const props = defineProps({
    track: {
        type: Object as PropType<SpotifyApi.TrackObjectFull>,
        required: true,
    },
    endTime: {
        type: Number,
        default: -1,
    },
    startTime: {
        type: Number,
        default: 0,
    },
    instaLoad: {
        type: Boolean,
        default: false,
    },
    color: {
        type: String,
        default: "default",
    },
    autoPlay: {
        type: Boolean,
        default: false,
    },
    playButtonSize: {
        type: Number,
        default: 30,
    },
});

const playing = ref(false);
const currentTime = ref(0);
const loadProgress = ref(0);
const loading = ref(false);
const isLoaded = ref(false);

watch(
    () => props.startTime,
    () => {
        console.log("Start time change");
        console.log("Start time value", toRaw(props.startTime));
        if (currentTime.value < props.startTime) {
            playerElement.currentTime = props.startTime;
        }
    },
);

const endTime = computed(() =>
    props.endTime === -1 ? props.track.duration_ms / 1000 : props.endTime,
);

const duration = computed(() => {
    console.log("Calculated duration", endTime.value - props.startTime);
    return endTime.value - props.startTime;
});

const playerElement = createAudioElement();

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
        if (props.track.duration_ms !== playerElement.duration * 1000)
            library.updateTrackDuration(
                props.track,
                playerElement.duration * 1000,
            );
    });
    element.addEventListener("canplay", () => {
        loading.value = false;
    });
    element.addEventListener("timeupdate", () => {
        if (element.currentTime >= endTime.value) {
            element.pause();
        }
        currentTime.value = element.currentTime;
    });
    return element;
}

async function load(track: SpotifyApi.TrackObjectFull) {
    isLoaded.value = true;
    loading.value = true;
    loadProgress.value = NaN;
    playerElement.volume = 0;
    const id = track.id;

    let onProgress: (percent: number) => void;
    onProgress = (percent) => {
        loadProgress.value = percent;
        if (percent === 100) base.events.off(id + "progress", onProgress);
    };
    base.events.on(id + "progress", onProgress);
    playerElement.src = await platform.getTrackFile(track, false);
    let onFirstPlay = () => 0;
    onFirstPlay = () => {
        playerElement.currentTime = props.startTime;
        if (!props.autoPlay) playerElement.pause();
        playerElement.removeEventListener("canplay", onFirstPlay);
        playerElement.volume = 1;
    };
    playerElement.addEventListener("canplay", onFirstPlay);
}

function seek(percent: number) {
    console.log("seek", percent);
    let result = Math.min(
        endTime.value,
        Math.max(props.startTime, props.startTime + percent * duration.value),
    );
    console.log("setting el time to", result);
    playerElement.currentTime = result;
}

async function togglePlay() {
    if (playing.value) {
        playerElement.pause();
    } else {
        if (playerElement.currentTime >= endTime.value) {
            playerElement.currentTime = props.startTime;
        }
        await playerElement.play();
    }
}

if (props.instaLoad) {
    load(props.track);
}
</script>

<style scoped lang="less">
.simple-player {
    display: flex;
    align-items: center;
    gap: 20px;
}
</style>
