<template>
    <div class="container">
        <v-btn @click="scroll(-1)"
               @dblclick="scroll(-10)"
               v-show="canGoLeft"
               density="compact" class="arrow left" variant="flat"
               icon="mdi-chevron-left"/>
        <div class="horizontal-scroller"
             ref="scrollContainer"
             :style="{'-webkit-mask-image': canGoLeft ? 'linear-gradient(to right, transparent 0%, white 5%)' : 'none'}">
            <slot></slot>
        </div>
        <v-btn @click="scroll(1)"
               @dblclick="scroll(10)"
               v-show="canGoRight"
               density="compact" class="arrow right" variant="flat"
               icon="mdi-chevron-right"/>
    </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";

const canGoLeft = ref(false);
const canGoRight = ref(false);

const scrollContainer = ref(null);

function scroll(direction: number) {
    let el = scrollContainer.value as HTMLElement | null;
    if (el === null) return;
    el.scrollTo({
        left: el.scrollLeft + el.clientWidth * .85 * direction,
        behavior: 'smooth',
    });
}

function checkCanScroll() {
    let el = scrollContainer.value as HTMLElement | null;
    if (el === null) return;
    canGoLeft.value = el.scrollLeft > 0;
    canGoRight.value = el.scrollWidth - (el.scrollLeft + el.clientWidth) > 0;
}

onMounted(() => {
    checkCanScroll();
    let el = scrollContainer.value as HTMLElement | null;
    if (el === null) return;
    el.addEventListener('scroll', () => checkCanScroll());
})

</script>

<style scoped>
.container {
    position: relative;
}

.container:hover .arrow {
    opacity: 1;
}

.arrow {
    position: absolute;
    top: calc(50% - 24px);
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