<template>
    <v-btn
        v-if="shuffle"
        :color="color"
        :variant="variant"
        icon="mdi-shuffle"
        size="40"
        @click="playItem(true)"
    />
    <v-btn v-else :color="color" :variant="variant" icon size="40" @click="togglePlay()">
        <v-progress-circular
            v-if="playLoading || (isItemLoaded && player.loading)"
            :indeterminate="isNaN(player.loadProgress)"
            :model-value="player.loadProgress"
            size="30"
        />
        <v-icon v-else-if="isItemPlaying" icon="mdi-pause" />
        <v-icon v-else icon="mdi-play" />
    </v-btn>
</template>

<script lang="ts" setup>
import { usePlayerStore } from '../../store/player/player'
import { useSpotifyApiStore } from '../../store/spotify-api'
import { Item, ItemCollection } from '../../scripts/types'
import { computed, PropType, ref } from 'vue'
import { itemCollection } from '../../scripts/item-utils'

const player = usePlayerStore()
const spotify = useSpotifyApiStore()

const props = defineProps({
    item: {
        type: Object as PropType<Item | ItemCollection>,
        required: true
    },
    shuffle: {
        type: Boolean,
        default: false
    },
    variant: {
        type: String as PropType<'flat' | 'text' | 'tonal' | 'elevated' | 'outlined' | 'plain'>,
        default: 'tonal'
    },
    color: {
        type: String,
        default: 'default'
    }
})

const isItemLoaded = computed(() => player.collection && player.collection.id === props.item.id)
const isItemPlaying = computed(() => isItemLoaded.value && player.playing)

const playLoading = ref(false)

function togglePlay() {
    if (isItemLoaded.value) {
        player.togglePlay()
    } else {
        playItem()
    }
}

async function playItem(shuffle = false) {
    playLoading.value = true

    let collection: ItemCollection
    if ('buttonText' in props.item) {
        collection = props.item
    } else {
        const tracks = await spotify.getItemTracks(props.item)
        const c = itemCollection(props.item, tracks)
        if (c === null) return
        collection = c
    }

    playLoading.value = false

    if (shuffle) {
        await player.shuffleCollection(collection)
    } else {
        await player.playCollection(collection)
    }
}
</script>

<style lang="less" scoped></style>
