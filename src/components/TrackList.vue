<template>
    <v-virtual-scroll :items="scrollItems" height="100%" item-height="50">
        <template v-slot:default="{ item, index }">
            <slot v-if="item === null"/>
            <track-list-item v-else :class="{'odd-item': index % 2 === 0}" class="track-list-item" :track="item"/>
        </template>
    </v-virtual-scroll>
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {PropType} from "vue";
import TrackListItem from "./TrackListItem.vue";
import TrackObjectFull = SpotifyApi.TrackObjectFull;

const props = defineProps({
    tracks: {
        type: Object as PropType<TrackObjectFull[]>,
        required: true
    }
})

const scrollItems = computed(() => [null, ...props.tracks])
</script>

<style scoped lang="scss">
.track-list-item.odd-item {
    background-color: rgba(0, 0, 0, 0.07);
}

.dark .track-list-item.odd-item {
    background-color: rgba(255, 255, 255, 0.05);
}
</style>