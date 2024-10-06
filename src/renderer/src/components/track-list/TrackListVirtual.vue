<template>
    <v-virtual-scroll
        :height="height"
        :items="scrollItems"
        :style="{ paddingTop }"
        class="virtual-scroll"
        item-height="50"
    >
        <template #default="{ item, index }">
            <slot v-if="item === null" />
            <track-list-item
                v-else
                :class="{
                    'odd-item': !isActive(item.id) && index % 2 === 0,
                    active: isActive(item.id)
                }"
                :collection="collection"
                :index="index - 1"
                :number="noImages ? item.track_number : undefined"
                :track="item"
                class="track-list-item"
            />
        </template>
    </v-virtual-scroll>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { computed } from 'vue'
import TrackListItem from './TrackListItem.vue'
import { usePlayerStore } from '../../store/player/player'
import type { ItemCollection } from '../../scripts/types'

const player = usePlayerStore()

const props = defineProps({
    collection: {
        type: Object as PropType<ItemCollection | null>,
        required: true
    },
    tracks: {
        type: Object as PropType<SpotifyApi.TrackObjectFull[] | null>,
        default: () => null
    },
    subtractHeight: {
        type: Number,
        default: () => 0
    },
    paddingTop: {
        type: String,
        default: () => '60px'
    },
    noImages: {
        type: Boolean,
        default: () => false
    },
    height: {
        type: String,
        required: true
    },
    scrollIntoView: {
        type: Object as PropType<SpotifyApi.TrackObjectFull | null>,
        required: false,
        default: () => null
    }
})
const isActive = (id: string) =>
    player.trackId === id && (player.collection?.id ?? '') === props.collection?.id

const scrollItems = computed(() => {
    return [null, ...realTracks.value]
})

const realTracks = computed(() => {
    if (props.tracks !== null) return props.tracks
    return props.collection?.tracks ?? []
})
</script>

<style lang="less" scoped>
.track-list-item.active {
    background: rgba(var(--v-theme-on-background), 1);
    color: rgba(var(--v-theme-background), 1);
    box-shadow: 0 0 12px 0 rgba(var(--v-theme-on-background), 0.3);
}

.track-list-item.odd-item {
    background-color: rgba(var(--v-theme-on-background), 0.06);
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
