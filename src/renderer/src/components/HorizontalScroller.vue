<template>
    <div class="container">
        <v-btn
            v-show="canGoLeft"
            class="arrow left"
            density="default"
            icon="mdi-chevron-left"
            variant="flat"
            @click="scroll(-1)"
            @dblclick="scroll(-10)"
        />

        <div
            ref="scrollContainer"
            :style="{
                '-webkit-mask-image': canGoLeft
                    ? 'linear-gradient(to right, transparent 0%, white 5%)'
                    : 'none'
            }"
            class="horizontal-scroller"
        >
            <slot></slot>
        </div>

        <v-btn
            v-show="canGoRight"
            class="arrow right"
            density="default"
            icon="mdi-chevron-right"
            variant="flat"
            @click="scroll(1)"
            @dblclick="scroll(10)"
        />
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'

const canGoLeft = ref(false)
const canGoRight = ref(false)
const scrollContainer = ref(null)

function scroll(direction: number) {
    const el = scrollContainer.value as HTMLElement | null
    if (el === null) return
    el.scrollTo({
        left: el.scrollLeft + el.clientWidth * 0.85 * direction,
        behavior: 'smooth'
    })
}

function checkCanScroll() {
    const el = scrollContainer.value as HTMLElement | null
    if (el === null) return
    canGoLeft.value = el.scrollLeft > 0
    canGoRight.value = el.scrollWidth - (el.scrollLeft + el.clientWidth) > 0
}

let el: HTMLElement | null
onMounted(() => {
    checkCanScroll()
    el = scrollContainer.value as HTMLElement | null
    if (el === null) return
    el.addEventListener('scroll', checkCanScroll)
    setTimeout(() => checkCanScroll(), 100)
})
onUnmounted(() => {
    if (el === null) return
    el.removeEventListener('scroll', checkCanScroll)
})
</script>

<style lang="less" scoped>
.container {
    position: relative;
}

.container:hover .arrow {
    opacity: 1;
}

.arrow {
    position: absolute;
    top: calc(50% - 48px);
    z-index: 3;
    opacity: 0;
}

.left {
    left: 0;
}

.right {
    right: 0;
}

.horizontal-scroller {
    width: 100%;
    padding-right: 10px;
    overflow-x: auto;
    display: flex;
    padding-bottom: 5px;
}
</style>
