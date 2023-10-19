<template>
    <div class="grab-area">
        <v-sheet rounded class="progress-bg">
            <div :style="{
                backgroundColor: base.themeColor,
                width: fillPercent + '%',
            }" class="progress-filled"></div>
            <div class="progress-thumb" :style="{
                left: `calc(${fillPercent}% - 5px)`,
                backgroundColor: base.themeColor,
            }"></div>
        </v-sheet>
    </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from "../scripts/store/player";
import { computed, onMounted, onUnmounted } from "vue";
import { useBaseStore } from "../scripts/store/base";

const player = usePlayerStore();
const base = useBaseStore();
let seekDown = false;

const fillPercent = computed(() => Math.round(10000 * player.currentTime / player.duration) / 100);

function seek(e: MouseEvent) {
    let grab = document.querySelector(".grab-area") as HTMLElement | null;
    if (grab === null) return;
    let bounds = grab.getBoundingClientRect();
    let x = e.pageX - bounds.left;
    let percent = x / bounds.width;
    player.seekTo(player.duration * percent);
}

function onMove(e: MouseEvent) {
    if (seekDown) seek(e);
}

function onDown(e: MouseEvent) {
    seekDown = true;
    seek(e);
}

function onUp() {
    seekDown = false;
}

onMounted(() => {
    document.addEventListener("mousemove", onMove, false);
    document.addEventListener("mouseup", onUp, false);
    let grab = document.querySelector(".grab-area") as HTMLElement | null;
    if (grab === null) return;
    grab.addEventListener("mousedown", onDown, false);
});
onUnmounted(() => {

});
</script>

<style scoped lang="scss">
.grab-area {
    height: 20px;
    display: flex;
    align-items: center;
    cursor: grab;
}

.grab-area > * {
    pointer-events: none;
}

.grab-area:active {
    cursor: grabbing;
}

.progress-bg {
    width: 100%;
    height: 4px;
    position: relative;
}

.progress-filled {
    width: 50%;
    height: 100%;
    border-radius: 2px;
}

.progress-thumb {
    height: 10px;
    width: 10px;
    border-radius: 50%;
    top: -7px;
    position: relative;
}

</style>