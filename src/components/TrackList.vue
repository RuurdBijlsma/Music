<template>
    <div class="track-list" v-if="collection !== null"
         :style="{paddingTop: paddingTop}">
        <slot/>
        <track-list-item
            v-for="(item, index) in tracks"
            :collection="collection" :number="noImages ? item.track_number : undefined"
            :index="index"
            :class="{
                 'odd-item': !isActive(index) && index % 2 === 0,
                 'active': isActive(index)
             }"
            class="track-list-item" :track="item"/>
    </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {PropType} from "vue";
import TrackListItem from "./TrackListItem.vue";
import {useBaseStore} from "../scripts/store/base";
import {usePlayerStore} from "../scripts/store/player";
import {useTheme} from "vuetify";
import type {ItemCollection} from "../scripts/types";

const base = useBaseStore();
const player = usePlayerStore()
const props = defineProps({
    collection: {
        type: Object as PropType<ItemCollection>,
        required: true
    },
    noImages: {
        type: Boolean,
        default: () => false,
    },
    paddingTop: {
        type: String,
        default: () => '60px',
    },
})
const theme = useTheme()
const isActive = (index: number) => {
    return player.collectionIndex === index && (player.collection?.id ?? '') === props.collection.id
}
const tracks = computed(() => props.collection.tracks)
</script>

<style scoped lang="scss">
.track-list-item.active {
    background-color: rgba(0, 0, 0, 0.9);
    color: white;
    box-shadow: 0 0 12px 0 rgba(0, 0, 0, 0.3);
}

.dark .track-list-item.active {
    background-color: white;
    color: black;
    box-shadow: 0 0 12px 0 rgba(255, 255, 255, 0.3);
}

.track-list-item.odd-item {
    background-color: rgba(0, 0, 0, 0.07);
}

.dark .track-list-item.odd-item {
    background-color: rgba(255, 255, 255, 0.05);
}

.track-list-item {
    padding: 0 20px;
    margin-left: 10px;
    margin-right: 10px;
}

.track-list {
    overflow-y: auto;
}

.track-list::-webkit-scrollbar {
    width: 14px;
    height: 18px;
}

.track-list::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, .1);
    border-radius: 3px;
}

.track-list::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 3px;
}

.track-list::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.6);
}
</style>