<template>
    <router-link no-style :to="base.itemUrl(item)" :class="{round: item.type === 'artist'}">
        <div class="image"
             :style="{backgroundImage: `url(${base.itemImage(item)})`}"/>
        <div class="info mt-2">
            <p class="title" v-if="!hideName">{{ item.name }}</p>
            <p class="description" v-if="item.type === 'album'">{{base.albumString(item)}}</p>
            <p class="description" v-else v-html="base.itemDescription(item)"></p>
        </div>
    </router-link>
</template>

<script setup lang="ts">
import {useBaseStore} from "../scripts/store/base"
import type {Item} from "../scripts/types";
import type {PropType} from "vue";

const base = useBaseStore();
defineProps({
    item: {
        type: Object as PropType<Item>,
        required: true
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
})
</script>

<style scoped lang="scss">
.image {
    border-radius: 10px;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.2);
    height: 12vw;
    aspect-ratio: 1;
    background-size: cover;
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
    opacity: .9;
    margin-bottom: 0 !important;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.description {
    opacity: .7;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
}
</style>