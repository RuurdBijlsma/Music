<template>
    <canvas class="progress-canvas"></canvas>
</template>

<script setup lang="ts">
import {usePlayerStore} from "../scripts/store/player";
import {onMounted, onUnmounted} from "vue";
import {storeToRefs} from "pinia";

const player = usePlayerStore()
let canvas: HTMLCanvasElement | null = null
const {mouseActive, mouseHoverPercent} = storeToRefs(player)

function seek(e: MouseEvent) {
    if (canvas === null) return
    let bounds = canvas.getBoundingClientRect()
    let x = e.pageX - bounds.left
    let percent = x / bounds.width
    mouseHoverPercent.value = percent
    player.seekTo(player.duration * percent)
}

function canvasDown(e: MouseEvent) {
    seek(e)
    mouseActive.value = true
}

function canvasUp(e: MouseEvent) {
    mouseActive.value = false
}

function canvasMove(e: MouseEvent) {
    if (mouseActive.value) {
        seek(e)
    }
}

onMounted(() => {
    canvas = document.querySelector('.progress-canvas')
    if (canvas !== null) {
        canvas.addEventListener('mousedown', canvasDown, false)
        document.addEventListener('mouseup', canvasUp, false)
        document.addEventListener('mousemove', canvasMove, false)
    }
})
onUnmounted(() => {
    if (canvas !== null) {
        canvas.removeEventListener('mousedown', canvasDown)
    }
    document.removeEventListener('mouseup', canvasUp, false)
    document.removeEventListener('mousemove', canvasMove, false)
})
</script>

<style scoped>
.progress-canvas {
    width: 300px;
    height: 100px;
    cursor: grab;
}

.progress-canvas:active {
    cursor: grabbing;
}
</style>