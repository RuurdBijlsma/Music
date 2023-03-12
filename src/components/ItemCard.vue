<template>
    <router-link no-style :to="base.itemUrl(props.item)">
        <div class="image"
             :style="{backgroundImage: `url(${base.itemImage(props.item)})`, minHeight: (props.size - 37) + 'px'}"/>
        <div class="info mt-2" :style="{minWidth: (props.size - 37) + 'px'}">
            <p class="title" v-if="!hideName">{{ props.item.name }}</p>
            <p class="description" v-html="base.itemDescription(props.item)"></p>
        </div>
    </router-link>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {Item, useBaseStore} from "../scripts/store/base";

const base = useBaseStore();
const props = defineProps({
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

<style scoped>
.image {
    border-radius: 10px;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.2);
    height: calc((100vw - 500px) / 4 - 39px);
    aspect-ratio: 1;
    background-size: cover;
    min-height: 163px;
}

.info {
    width: calc((100vw - 500px) / 4 - 39px);
    font-size: 13px;
    overflow: hidden;
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