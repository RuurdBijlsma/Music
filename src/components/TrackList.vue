<template>
    <div class="track-list" v-if="collection !== null"
         :style="{paddingTop}">
        <slot/>
        <track-list-item
            v-for="(item, index) in tracks"
            :collection="collection" :number="noImages ? item.track_number : undefined"
            :index="index"
            :class="{
                    'odd-item': !isActive(item.id) && index % 2 === 0,
                    'active': isActive(item.id)
                }"
            class="track-list-item" :track="item"/>
    </div>
</template>

<script setup lang="ts">
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
    tracks: {
        type: Object as PropType<SpotifyApi.TrackObjectFull[]>,
        required: true,
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
const {trackId} = storeToRefs(player)
const isActive = (id: string) => player.trackId === id && (player.collection?.id ?? '') === props.collection.id
</script>

<style scoped lang="scss">
.track-list {
    overflow-y: auto;
}

.track-list-item.active {
    background: rgba(var(--v-theme-on-background), 1);
    color: rgba(var(--v-theme-background), 1);
    box-shadow: 0 0 12px 0 rgba(var(--v-theme-on-background), 0.3);
}

.track-list-item.odd-item {
    background-color: rgba(var(--v-theme-on-background), .06);
}

.track-list-item {
    padding: 0 20px;
    margin-left: 10px;
    margin-right: 10px;
}

.track-list::-webkit-scrollbar {
    width: 14px;
    height: 18px;
}

.track-list::-webkit-scrollbar-track {
    background: rgba(var(--v-theme-on-background), 0.1);
    border-radius: 3px;
}

.track-list::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-on-background), 0.4);
    border-radius: 3px;
}

.track-list::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-on-background), 0.7);
}
</style>