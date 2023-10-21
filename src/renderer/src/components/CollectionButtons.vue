<template>
    <div class="play-buttons mb-1" v-if="collection">
        <v-divider />
        <v-btn icon="mdi-play-outline" variant="text" @click="player.playCollection(collection)" />
        <v-btn icon="mdi-shuffle" variant="text" @click="player.shuffleCollection(collection)" />
        <v-btn v-if="showFilter" icon="mdi-filter-outline" variant="text" />
        <like-button icon-button v-if="likeItem" variant="no-theme" :item="likeItem" />
        <v-divider />
    </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from "../store/player";
import type { PropType } from "vue";
import type { Item, ItemCollection } from "../scripts/types";
import LikeButton from "./LikeButton.vue";

defineProps({
    collection: {
        type: Object as PropType<ItemCollection | null>,
        required: true
    },
    likeItem: {
        type: Object as PropType<Item | null>,
        default: () => null
    },
    showFilter: {
        type: Boolean,
        default: false
    }
});

const player = usePlayerStore();
</script>

<style scoped lang="less">
.play-buttons {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
}
</style>
