<template>
    <div class="track-item">
        <v-lazy class="lazy-img" width="70" transition="fade-transition">
            <v-img class="track-img" :src="props.track.album.images[0].url"/>
        </v-lazy>
        <div class="track-info">
            <div class="track-name">{{ props.track.name }}</div>
            <div class="track-artist">{{ props.track.artists.map((a: any) => a.name).join(', ') }}</div>
        </div>
        <v-spacer/>
        <div class="track-duration ml-2">
            {{ base.msToReadable(props.track.duration_ms) }}
        </div>
        <v-btn class="track-options ml-2"
               variant="text" size="30"
               density="compact"
               icon="mdi-dots-horizontal"/>
    </div>
</template>

<script setup lang="ts">
import type {PropType} from "vue";
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import {useBaseStore} from "../scripts/store/base";

const props = defineProps({
    track: {
        type: Object as PropType<TrackObjectFull>,
        required: true
    }
})

const base = useBaseStore();
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
    padding: 0 20px;
    border-radius: 5px;
    margin: 0 10px;
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