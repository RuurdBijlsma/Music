<template>
    <canvas class="progress-canvas"></canvas>
</template>

<script setup lang="ts">
import {usePlayerStore} from "../scripts/store/player";
import {onMounted, onUnmounted} from "vue";
import {storeToRefs} from "pinia";

const player = usePlayerStore()
let canvas: HTMLCanvasElement | null = null
const {mouseActive, mouseHoverPercent, mouseHover} = storeToRefs(player)

function seek(e: MouseEvent) {
    if (canvas === null) return
    let bounds = canvas.getBoundingClientRect()
    let x = e.pageX - bounds.left
    let percent = x / bounds.width
    mouseHoverPercent.value = percent
    if (mouseActive.value) {
        player.seekTo(player.duration * percent)
    }
}

const canvasDown = (e: MouseEvent) => {
    mouseActive.value = true
    seek(e)
}

const canvasUp = () => mouseActive.value = false;
const canvasMove = (e: MouseEvent) => seek(e);
const mouseEnter = () => mouseHover.value = true
const mouseLeave = () => mouseHover.value = false

onMounted(() => {
    canvas = document.querySelector('.progress-canvas')
    if (canvas !== null) {
        canvas.addEventListener('mousedown', canvasDown, false)
        document.addEventListener('mouseup', canvasUp, false)
        document.addEventListener('mousemove', canvasMove, false)
        canvas.addEventListener('mouseenter', mouseEnter, false)
        canvas.addEventListener('mouseleave', mouseLeave, false)
    }
})
onUnmounted(() => {
    if (canvas !== null) {
        canvas.removeEventListener('mousedown', canvasDown)
        canvas.removeEventListener('mouseenter', mouseEnter)
        canvas.removeEventListener('mouseleave', mouseLeave)
    }
    document.removeEventListener('mouseup', canvasUp)
    document.removeEventListener('mousemove', canvasMove)
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