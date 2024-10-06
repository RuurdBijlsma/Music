<template>
    <div class="spb">
        <div class="music-time-current">
            {{ msToReadable(currentTime * 1000) }}
        </div>
        <div ref="seekContainer" class="container" @mousedown="mouseDown">
            <div class="progress-bar">
                <div
                    :style="{
                        width: `${percent}%`,
                        backgroundColor: getColor
                    }"
                    class="progress"
                ></div>
            </div>
        </div>
        <div class="music-time-total">
            {{ msToReadable(duration * 1000) }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useUIStore } from '../../store/UI/UIStore'
import { msToReadable } from '../../scripts/utils'

const props = defineProps({
    duration: {
        type: Number,
        required: true
    },
    currentTime: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        default: 'default'
    }
})

const getColor = computed(() => {
    if (props.color === 'default') {
        return ui.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
    }
    return props.color
})

const emit = defineEmits(['seek'])
const ui = useUIStore()
const seekContainer = ref(null as null | HTMLElement)

const percent = computed(() => Math.round((10000 * props.currentTime) / props.duration) / 100)

let seekDown = false
const seek = (e: MouseEvent) => {
    if (seekDown) {
        if (seekContainer.value === null) return
        const bounds = seekContainer.value.getBoundingClientRect()
        const x = e.pageX - bounds.left
        const percent = x / bounds.width

        emit('seek', percent)
    }
}
const mouseDown = (e: MouseEvent) => {
    seekDown = true
    seek(e)
}
const mouseMove = (e: MouseEvent) => seek(e)
const mouseUp = () => (seekDown = false)
onMounted(() => {
    document.addEventListener('mousemove', mouseMove, false)
    document.addEventListener('mouseup', mouseUp, false)
})
onUnmounted(() => {
    document.removeEventListener('mousemove', mouseMove)
    document.removeEventListener('mouseup', mouseUp)
})
</script>

<style lang="less" scoped>
.spb {
    display: flex;
    width: 100%;
}

.music-time-current,
.music-time-total {
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
