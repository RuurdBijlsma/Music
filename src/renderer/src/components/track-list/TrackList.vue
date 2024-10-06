<template>
    <div v-if="collection !== null" :style="{ paddingTop }" class="track-list">
        <slot />
        <track-list-item
            v-for="(item, index) in realTracks"
            :class="{
                'odd-item': !isActive(item.id) && index % 2 === 0,
                active: isActive(item.id)
            }"
            :collection="collection"
            :index="index"
            :number="noImages ? item.track_number : undefined"
            :track="item"
            class="track-list-item"
        />
    </div>
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
    noImages: {
        type: Boolean,
        default: () => false
    },
    paddingTop: {
        type: String,
        default: () => '60px'
    }
})
const isActive = (id: string) =>
    player.trackId === id && (player.collection?.id ?? '') === props.collection?.id

const realTracks = computed(() => {
    if (props.tracks !== null) return props.tracks
    return props.collection?.tracks ?? []
})
</script>

<style lang="less" scoped>
.track-list {
    overflow-y: auto;
}

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
