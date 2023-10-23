<template>
    <v-btn :color="color" v-if="shuffle"
           icon="mdi-shuffle" size="40"
           :variant="variant" @click="playItem(true)" />
    <v-btn :color="color" v-else
           size="40" icon :variant="variant"
           @click="togglePlay()">
        <v-progress-circular :indeterminate="isNaN(player.loadProgress)"
                             :model-value="player.loadProgress"
                             size="30" v-if="playLoading || (isItemLoaded && player.loading)" />
        <v-icon v-else-if="isItemPlaying" icon="mdi-pause" />
        <v-icon v-else icon="mdi-play" />
    </v-btn>
</template>

<script setup lang="ts">
import { usePlayerStore } from "../store/player";
import { useSpotifyApiStore } from "../store/spotify-api";
import { Item, ItemCollection } from "../scripts/types";
import { computed, PropType, ref } from "vue";
import { useBaseStore } from "../store/base";

const player = usePlayerStore();
const spotify = useSpotifyApiStore();
const base = useBaseStore();

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
        type: String as PropType<"flat" | "text" | "tonal" | "elevated" | "outlined" | "plain">,
        default: "tonal"
    },
    color: {
        type: String,
        default: "default"
    }
});

const isItemLoaded = computed(() => player.collection && player.collection.id === props.item.id);
const isItemPlaying = computed(() => isItemLoaded.value && player.playing);

const playLoading = ref(false);

function togglePlay() {
    if (isItemLoaded.value) {
        player.togglePlay();
    } else {
        playItem();
    }
}

async function playItem(shuffle = false) {
    playLoading.value = true;

    let collection: ItemCollection;
    if ("buttonText" in props.item) {
        collection = props.item;
    } else {
        let tracks = await spotify.getItemTracks(props.item);
        let c = base.itemCollection(props.item, tracks);
        if (c === null) return;
        collection = c;
    }

    playLoading.value = false;

    if (shuffle) {
        await player.shuffleCollection(collection);
    } else {
        await player.playCollection(collection);
    }
}
</script>

<style scoped lang="less">

</style>
