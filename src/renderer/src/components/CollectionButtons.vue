<template>
    <div class="play-buttons mb-1" v-if="collection">
        <v-divider />
        <v-btn icon="mdi-play-outline" variant="text" @click="player.playCollection(collection)" />
        <v-btn icon="mdi-shuffle" variant="text" @click="player.shuffleCollection(collection)" />
        <v-btn v-if="showFilter" icon="mdi-filter-outline" variant="text" />
        <like-button icon-button v-if="likeItem" variant="no-theme" :item="likeItem" />
        <v-tooltip text="Go to artist radio" location="top">
            <template v-slot:activator="{ props }">
                <v-btn v-bind="props"
                       variant="text"
                       icon="mdi-radio-tower"
                       v-if="collection.context && collection.type === 'artist'"
                       :to="`/radio?id=${base.radioId()}&seed_artists=${collection.context.id}`" />
            </template>
        </v-tooltip>
        <v-divider />
    </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from "../store/player";
import type { PropType } from "vue";
import type { Item, ItemCollection } from "../scripts/types";
import LikeButton from "./LikeButton.vue";
import { useBaseStore } from "../store/base";

const base = useBaseStore();
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
