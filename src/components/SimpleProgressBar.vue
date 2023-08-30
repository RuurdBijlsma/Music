<template>
    <div class="spb">
        <div class="music-time-current">{{ base.msToReadable(currentTime * 1000) }}</div>
        <div class="container">
            <div class="progress-bar">
                <div class="progress" :style="{
                    width: `${percent}%`,
                    backgroundColor: base.themeColor.value,
                }"></div>
            </div>
        </div>
        <div class="music-time-total">{{ base.msToReadable(duration * 1000) }}</div>
    </div>
</template>

<script setup lang="ts">
import {useBaseStore} from "../scripts/store/base";
import {computed, onMounted, onUnmounted} from "vue";

const props=defineProps({
    duration: {
        type: Number,
        required: true
    },
    currentTime: {
        type: Number,
        required: true
    },
})
const emit = defineEmits(['seek'])
const base = useBaseStore()

const percent = computed(() => Math.round(10000 * props.currentTime / props.duration) / 100)

let el: HTMLElement | null = null
let seekDown = false
const seek = (e: MouseEvent) => {
    if (el === null) return
    if (seekDown) {
        let bounds = el.getBoundingClientRect()
        let x = e.pageX - bounds.left
        let percent = x / bounds.width

        emit('seek',percent*props.duration)
    }
}
const mouseDown = (e: MouseEvent) => {
    seekDown = true;
    seek(e)
}
const mouseMove = (e: MouseEvent) => seek(e)
const mouseUp = () => seekDown = false
onMounted(() => {
    el = document.querySelector('.container')
    if (el !== null) {
        el.addEventListener('mousedown', mouseDown, false)
        document.addEventListener('mousemove', mouseMove, false)
        document.addEventListener('mouseup', mouseUp, false)
    }
})
onUnmounted(() => {
    if (el !== null) {
        el.removeEventListener('mousedown', mouseDown)
    }
    document.removeEventListener('mousemove', mouseMove)
    document.removeEventListener('mouseup', mouseUp)
})
</script>

<style scoped lang="scss">
.spb {
    display: flex;
    width: 100%;
}

.music-time-current, .music-time-total {
    opacity: 0.7;
    font-weight: 500;
    font-size: 12px;
    width: 35px;
    text-align: left;
}

.container {
    height: 15px;
    width: 100%;
    display: flex;
    align-items: center;
    cursor: grab;
    flex-grow: 1;
    margin-right: 15px;
    margin-left: 10px;
}

.container:active {
    cursor: grabbing;
}

.progress-bar {
    pointer-events: none;
    background-color: rgb(var(--v-theme-background));
    border-radius: 2px;
    width: 100%;
    height: 4px;
}

.progress {
    width: 40%;
    height: 100%;
}
</style>