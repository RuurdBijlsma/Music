<template>
    <div
        class="track-item"
        @dblclick="playItem"
        @click.right="dialog.setContextMenuItem($event, track)"
    >
        <v-lazy
            v-if="number === undefined"
            class="lazy-img"
            transition="fade-transition"
            width="70"
        >
            <v-img
                v-if="track.album?.images?.length > 0"
                :cover="true"
                :src="itemImage(track)"
                class="track-img"
            />
            <v-sheet v-else class="track-img"></v-sheet>
        </v-lazy>
        <div v-else class="track-number">
            {{ number }}
        </div>
        <div class="track-info">
            <div class="track-name">{{ track.name }}</div>
            <div class="track-artist">
                <artists-span :artists="track.artists" />
            </div>
        </div>
        <spacer />
        <div class="track-duration ml-2">
            {{ msToReadable(track.duration_ms) }}
        </div>
        <v-menu>
            <template #activator="{ props }">
                <v-btn
                    class="track-options ml-2"
                    density="compact"
                    icon="mdi-dots-horizontal"
                    size="30"
                    v-bind="props"
                    variant="text"
                />
            </template>
            <item-menu :item="track" />
        </v-menu>
    </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { usePlayerStore } from '../../store/player/player'
import ArtistsSpan from '../ArtistsSpan.vue'
import ItemMenu from '../item/ItemMenu.vue'
import type { ItemCollection } from '../../scripts/types'
import Spacer from '../Spacer.vue'
import { msToReadable } from '../../scripts/utils'
import { itemImage } from '../../scripts/item-utils'
import { useDialogStore } from '../../store/UI/dialogStore'

const props = defineProps({
    track: {
        type: Object as PropType<SpotifyApi.TrackObjectFull>,
        required: true
    },
    index: {
        type: Number,
        required: true
    },
    collection: {
        type: Object as PropType<ItemCollection | null>,
        required: true
    },
    number: {
        type: Number,
        required: false
    }
})
const dialog = useDialogStore()
const player = usePlayerStore()

function playItem() {
    if (props.collection !== null) player.load(props.collection, props.track)
}
</script>

<style lang="less" scoped>
.track-item {
    overflow: hidden;
    height: 50px;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: flex;
    flex-direction: row;
    font-size: 14px;
    justify-content: space-between;
    align-items: center;
    border-radius: 5px;
}

.lazy-img {
    flex-grow: 0;
}

.track-img {
    width: 40px;
    height: 40px;
    margin: 5px 20px 5px 5px;
    border-radius: 5px;
    /*box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.2);*/
}

.track-number {
    text-align: left;
    width: 40px;
    height: 40px;
    justify-content: start;
    align-items: center;
    display: flex;
    margin-left: 10px;
}

.track-info {
    display: flex;
    flex-direction: column;
    /*flex-shrink: 1;*/
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow-x: hidden;
    width: calc(100% - 110px);
}

.track-name {
    font-weight: 500;
}

.track-artist {
    font-weight: 400;
    font-size: 13px;
    opacity: 0.6;
    display: flex;
}

.track-duration {
    font-weight: 400;
    font-size: 13px;
    opacity: 0.6;
    transform: translateX(30px);
    transition: transform 0.15s;
}

.track-item:hover .track-duration {
    transform: translateX(0px);
}

.track-options {
    opacity: 0;
}

.track-item:hover .track-options {
    opacity: 0.8;
}
</style>
