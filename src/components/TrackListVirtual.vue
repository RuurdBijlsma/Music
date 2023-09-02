<template>
    <v-virtual-scroll
        :items="scrollItems"
        class="virtual-scroll"
        :style="{paddingTop: paddingTop}"
        :height="(pageHeight - subtractHeight).toString()"
        item-height="50">
        <template v-slot:default="{ item, index }">
            <slot v-if="item === null"/>
            <track-list-item :collection="collection" :number="noImages ? item.track_number : undefined"
                             v-else
                             :index="index - 1"
                             :class="{
                                 'odd-item': !isActive(item.id) && index % 2 === 0,
                                 'active': isActive(item.id)
                             }"
                             class="track-list-item" :track="item"/>
        </template>
    </v-virtual-scroll>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import type {PropType} from "vue";
import TrackListItem from "./TrackListItem.vue";
import {useBaseStore} from "../scripts/store/base";
import {usePlayerStore} from "../scripts/store/player";
import {useTheme} from "vuetify";
import type {ItemCollection} from "../scripts/types";
import {storeToRefs} from "pinia";

const base = useBaseStore();
const player = usePlayerStore()
const theme = useTheme()

const props = defineProps({
    collection: {
        type: Object as PropType<ItemCollection>,
        required: true
    },
    subtractHeight: {
        type: Number,
        default: () => 0,
    },
    paddingTop: {
        type: String,
        default: () => '60px',
    },
    itemHeight: {
        type: Boolean,
        default: () => false,
    },
    noImages: {
        type: Boolean,
        default: () => false,
    },
})
const {trackId} = storeToRefs(player)
const isActive = (id: string) =>  player.trackId === id && (player.collection?.id ?? '') === props.collection.id

const pageHeight = ref(window.innerHeight);
onMounted(() => {
    window.addEventListener('resize', handleWindowResize)
})
onUnmounted(() => {
    window.removeEventListener('resize', handleWindowResize)
})

function handleWindowResize() {
    pageHeight.value = window.innerHeight;
}

const scrollItems = computed(() => {
    return [null, ...props.collection.tracks]
})
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

.virtual-scroll::-webkit-scrollbar {
    width: 14px;
    height: 18px;
}

.virtual-scroll::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, .1);
    border-radius: 3px;
}

.virtual-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 3px;
}

.virtual-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.6);
}
</style>