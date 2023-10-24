<template>
    <router-link
        :class="{ round: item.type === 'artist' }"
        :to="base.itemUrl(item)"
        no-style
        @click.right="base.setContextMenuItem($event, item)"
    >
        <div
            :style="{ backgroundImage: `url(${itemImage(item)})` }"
            class="image"
        >
            <item-play-button
                :color="base.themeColor"
                :item="item"
                class="play-button"
                variant="elevated"
                @click.prevent
            />
        </div>
        <div class="info mt-2">
            <p v-if="!hideName" class="title">{{ itemName }}</p>
            <p v-if="item.type === 'album'" class="description">
                {{ base.albumString(actualItem) }}
            </p>
            <p
                v-else-if="hasItem"
                class="description"
                v-html="base.itemDescription(actualItem)"
            ></p>
        </div>
    </router-link>
</template>

<script lang="ts" setup>
import { useBaseStore } from "../store/base";
import type { Item, ItemCollection } from "../scripts/types";
import type { PropType } from "vue";
import { computed } from "vue";
import ItemPlayButton from "./ItemPlayButton.vue";
import { randomLiked, randomNotFound } from "../scripts/imageSources";

const base = useBaseStore();
const props = defineProps({
    item: {
        type: Object as PropType<Item | ItemCollection>,
        required: true,
    },
    size: {
        type: Number,
        required: false,
        default: () => 200,
    },
    hideName: {
        type: Boolean,
        required: false,
        default: () => false,
    },
});
const itemName = computed(() => props.item.name);
const isCollection = computed(() => "buttonText" in props.item);
const hasItem = computed(() => {
    if (isCollection.value)
        return "context" in props.item && props.item.context;
    return true;
});
const actualItem = computed(() => {
    if ("context" in props.item && props.item.context) {
        return props.item.context;
    }
    return props.item as Item;
});

function itemImage(item: Item | ItemCollection) {
    if ("buttonText" in item) {
        if ("context" in item && item.context)
            return base.itemImage(item.context);
        switch (item.type) {
            case "radio":
                if ("context" in item && item.context)
                    return base.itemImage(item.context);
                if (item.tracks.length === 0) return randomNotFound();
                return base.itemImage(item.tracks[0]);
            case "liked":
                return randomLiked();
            default:
                if (item.tracks.length === 0) return randomNotFound();
                return base.itemImage(item.tracks[0]);
        }
    }
    return base.itemImage(item);
}
</script>

<style lang="less" scoped>
.image {
    border-radius: 10px;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.2);
    height: 12vw;
    aspect-ratio: 1;
    background-size: cover;
    position: relative;
}

.image:hover .play-button {
    opacity: 1;
}

.play-button {
    position: absolute;
    right: 10px;
    bottom: 10px;
    opacity: 0;
    transition: opacity 0.15s !important;
}

.round .image {
    border-radius: 50%;
}

.info {
    width: 12vw;
    font-size: 13px;
    overflow: hidden;
}

.round .info {
    text-align: center;
}

@media only screen and (max-width: 1500px) {
    .info {
        width: 190px;
    }

    .image {
        height: 190px;
    }
}

.title {
    font-size: 13px;
    opacity: 0.9;
    margin-bottom: 0 !important;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.description {
    opacity: 0.7;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
}
</style>
