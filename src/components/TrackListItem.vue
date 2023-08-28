<template>
    <div class="track-item" @dblclick="playItem">
        <v-lazy v-if="number === undefined" class="lazy-img" width="70" transition="fade-transition">
            <v-img :cover="true" v-if="track.album.images.length > 0" class="track-img" :src="base.itemImage(track)"/>
            <v-sheet v-else class="track-img"></v-sheet>
        </v-lazy>
        <div v-else class="track-number">
            {{ number }}
        </div>
        <div class="track-info">
            <div class="track-name">{{ track.name }}</div>
            <div class="track-artist">
                <artists-span :artists="track.artists"/>
            </div>
        </div>
        <v-spacer/>
        <div class="track-duration ml-2">
            {{ base.msToReadable(track.duration_ms) }}
        </div>
        <v-menu>
            <template v-slot:activator="{ props }">
                <v-btn class="track-options ml-2"
                       v-bind="props"
                       variant="text" size="30"
                       density="compact"
                       icon="mdi-dots-horizontal"/>
            </template>
            <v-list density="compact">
                <v-list-item @click="spotify.toggleLike('track', track)">
                    <template v-slot:prepend>
                        <v-icon v-if="isLiked" icon="mdi-heart"></v-icon>
                        <v-icon v-else icon="mdi-heart-outline"></v-icon>
                    </template>
                    <v-list-item-title v-if="isLiked">Remove from library</v-list-item-title>
                    <v-list-item-title v-else>Add to library</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
</template>

<script setup lang="ts">
import type {PropType} from "vue";
import {useBaseStore} from "../scripts/store/base";
import {computed, ref, toRaw} from "vue";
import {usePlayerStore} from "../scripts/store/player";
import ArtistsSpan from "./ArtistsSpan.vue";
import {useSpotifyStore} from "../scripts/store/spotify";

const props = defineProps({
    track: {
        type: Object as PropType<SpotifyApi.TrackObjectFull>,
        required: true,
    },
    index: {
        type: Number,
        required: true,
    },
    collection: {
        type: Object as PropType<any>,
        required: true,
    },
    number: {
        type: Number,
        required: false,
    },
    active: {
        type: Boolean,
        default: false,
    },
})
const base = useBaseStore()
const player = usePlayerStore()
const spotify = useSpotifyStore()

const isLiked = computed(() => spotify.checkLiked('track', props.track.id))

function playItem() {
    console.log("Play item", toRaw(props.track))
    player.load(toRaw(props.collection), toRaw(props.index))
}
</script>

<style scoped lang="scss">
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
    opacity: .6;
    display: flex;
}

.track-duration {
    font-weight: 400;
    font-size: 13px;
    opacity: .6;
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
    opacity: .8;
}
</style>