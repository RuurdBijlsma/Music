<template>
    <div class="grab-area">
        <v-sheet class="progress-bg" rounded>
            <div
                :style="{
                    backgroundColor: ui.themeColor,
                    width: fillPercent + '%'
                }"
                class="progress-filled"
            ></div>
            <div
                :style="{
                    left: `calc(${fillPercent}% - 5px)`,
                    backgroundColor: ui.themeColor
                }"
                class="progress-thumb"
            ></div>
        </v-sheet>
    </div>
</template>

<script lang="ts" setup>
import { usePlayerStore } from '../../store/player/player'
import { computed, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '../../store/UI/UIStore'

const player = usePlayerStore()
const ui = useUIStore()
let seekDown = false

const fillPercent = computed(() => Math.round((10000 * player.currentTime) / player.duration) / 100)

function seek(e: MouseEvent) {
    const grab = document.querySelector('.grab-area') as HTMLElement | null
    if (grab === null) return
    const bounds = grab.getBoundingClientRect()
    const x = e.pageX - bounds.left
    const percent = x / bounds.width
    player.seekTo(player.duration * percent)
}

function onMove(e: MouseEvent) {
    if (seekDown) seek(e)
}

function onDown(e: MouseEvent) {
    seekDown = true
    seek(e)
}

function onUp() {
    seekDown = false
}

onMounted(() => {
    document.addEventListener('mousemove', onMove, false)
    document.addEventListener('mouseup', onUp, false)
    const grab = document.querySelector('.grab-area') as HTMLElement | null
    if (grab === null) return
    grab.addEventListener('mousedown', onDown, false)
})
onUnmounted(() => {})
</script>

<style lang="less" scoped>
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
