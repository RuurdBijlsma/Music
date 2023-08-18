<template>
    <v-virtual-scroll
        :items="scrollItems"
        class="virtual-scroll"
        :style="{paddingTop: paddingTop}"
        :height="(pageHeight - subtractHeight).toString()"
        item-height="50">
        <template v-slot:default="{ item, index }">
            <slot v-if="item === null"/>
            <track-list-item :collection="collection" :number="noImages ? item.track_number : undefined" v-else
                             :index="index - 1"
                             :class="{'odd-item': index % 2 === 0}"
                             class="track-list-item" :track="item"/>
        </template>
    </v-virtual-scroll>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import type {PropType, Ref} from "vue";
import TrackListItem from "./TrackListItem.vue";
import {useBaseStore} from "../scripts/store/base";

const base = useBaseStore();
const props = defineProps({
    collection: {
        type: Object as PropType<any>,
        required: true
    },
    type: {
        type: String,
        default: "playlist",
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

const pageHeight = ref(window.innerHeight);
window.addEventListener('resize', () => {
    pageHeight.value = window.innerHeight;
})
const scrollItems = computed(() => {
    // console.log("CHECK", props.collection.value)
    return [null, ...props.collection.tracks]
})
</script>

<style scoped lang="scss">
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