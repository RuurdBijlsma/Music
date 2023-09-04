<template>
    <v-menu :style="{
            transform: `translate(${contextMenu.x}px, ${contextMenu.y}px)`,
        }" :model-value="contextMenu.show" @update:modelValue="contextMenu.show=$event">
        <item-menu :key="contextMenu.x" :show-descriptor="true" :item="contextMenu.item"/>
    </v-menu>
</template>

<script setup lang="ts">
import {useBaseStore} from "../scripts/store/base";
import {useLibraryStore} from "../scripts/store/library";
import {storeToRefs} from "pinia";
import ItemMenu from "./ItemMenu.vue";
import {onMounted, onUnmounted} from "vue";

const base = useBaseStore()
const library = useLibraryStore()
const {contextMenu} = storeToRefs(base)

const onBlur = () => contextMenu.value.show = false
onMounted(() => {
    window.addEventListener('blur', onBlur, false)
})
onUnmounted(() => {
    window.removeEventListener('blur', onBlur)
})
</script>

<style scoped lang="scss">

</style>