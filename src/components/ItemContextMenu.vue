<template>
    <v-menu :style="{
            transform: `translate(${contextMenu.x}px, ${contextMenu.y}px)`,
        }" :model-value="contextMenu.show" @update:modelValue="contextMenu.show=$event">
        <item-menu :show-descriptor="true" :item="contextMenu.item"/>
    </v-menu>
</template>

<script setup lang="ts">
import {useBaseStore} from "../scripts/store/base";
import {useSpotifyStore} from "../scripts/store/spotify";
import {storeToRefs} from "pinia";
import ItemMenu from "./ItemMenu.vue";

const base = useBaseStore()
const spotify = useSpotifyStore()
const {contextMenu} = storeToRefs(base)

</script>

<style scoped lang="scss">

</style>