<template>
    <v-virtual-scroll
        :items="scrollItems"
        class="virtual-scroll"
        :style="{paddingTop}"
        :height="height"
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
import {computed} from "vue";
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
        type: Object as PropType<ItemCollection | null>,
        required: true
    },
    tracks: {
        type: Object as PropType<SpotifyApi.TrackObjectFull[] | null>,
        default: () => null,
    },
    subtractHeight: {
        type: Number,
        default: () => 0,
    },
    paddingTop: {
        type: String,
        default: () => '60px',
    },
    noImages: {
        type: Boolean,
        default: () => false,
    },
    height: {
        type: String,
        required: true,
    },
    scrollIntoView: {
        type: Object as PropType<SpotifyApi.TrackObjectFull | null>,
        required: false,
        default: () => null,
    },
})
const {trackId} = storeToRefs(player)
const isActive = (id: string) => player.trackId === id && (player.collection?.id ?? '') === props.collection?.id

const scrollItems = computed(() => {
    return [null, ...realTracks.value]
})

const realTracks = computed(() => {
    if (props.tracks !== null) return props.tracks
    return props.collection?.tracks ?? []
})
</script>

<style scoped lang="scss">
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

.virtual-scroll::-webkit-scrollbar {
    width: 14px;
    height: 18px;
}

.virtual-scroll::-webkit-scrollbar-track {
    background: rgba(var(--v-theme-on-background), 0.1);
    border-radius: 3px;
}

.virtual-scroll::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-on-background), 0.4);
    border-radius: 3px;
}

.virtual-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-on-background), 0.7);
}
</style>