<template>
    <track-list-expander :collection="collection" :tracks="collection.tracks" :loading="loading" show-header>
        <slot></slot>
    </track-list-expander>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";
import type { ItemCollection } from "../scripts/types";
import { useSearchStore } from "../store/search";
import TrackListExpander from "./TrackListExpander.vue";

const props = defineProps({
    tracks: {
        type: Object as PropType<SpotifyApi.TrackObjectFull[]>,
        required: true
    },
    loading: {
        type: Boolean,
        required: false,
        default: () => false
    },
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
});

const search = useSearchStore();
const query = search.searchValue;

const collection = computed(() => ({
    tracks: props.tracks,
    type: "search",
    id: "search" + props.id,
    name: `${props.type} search results for "${query}"`,
    buttonText: "Search",
    to: `/search?q=${query}`
} as ItemCollection));


</script>

<style scoped lang="less">
</style>
