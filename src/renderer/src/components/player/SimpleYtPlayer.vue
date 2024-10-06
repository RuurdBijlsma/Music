<template>
    <simple-player :auto-play="true" :track="track" class="player" />
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import SimplePlayer from './SimplePlayer.vue'

defineProps({
    track: {
        type: Object as PropType<SpotifyApi.TrackObjectFull>,
        required: true
    }
})
</script>

<style lang="less" scoped>
.player {
    width: 100%;
}
</style>
