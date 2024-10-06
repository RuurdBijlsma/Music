<template>
    <canvas class="progress-canvas"></canvas>
</template>

<script lang="ts" setup>
import { usePlayerStore } from '../../store/player/player'
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'

const player = usePlayerStore()
let canvas: HTMLCanvasElement | null = null
const { mouseActive, mouseHoverPercent, mouseHover } = storeToRefs(player)

function seek(e: MouseEvent) {
    if (canvas === null) return
    const bounds = canvas.getBoundingClientRect()
    const x = e.pageX - bounds.left
    const percent = x / bounds.width
    mouseHoverPercent.value = percent
    if (mouseActive.value) {
        player.seekTo(player.duration * percent)
    }
}

const canvasDown = (e: MouseEvent) => {
    mouseActive.value = true
    seek(e)
}

const canvasUp = () => (mouseActive.value = false)
const canvasMove = (e: MouseEvent) => seek(e)
const mouseEnter = () => (mouseHover.value = true)
const mouseLeave = () => (mouseHover.value = false)

onMounted(() => {
    if (player.track !== null)
        // player.initializeCanvas(player.playerElement.src, player.track);
        player.initializeCanvas()

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

<style lang="less" scoped>
.progress-canvas {
    width: 300px;
    height: 100px;
    cursor: grab;
}

.progress-canvas:active {
    cursor: grabbing;
}
</style>
