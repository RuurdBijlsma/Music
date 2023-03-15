<template>
    <div class="highlight-featured mr-2" :style="{ minHeight: (props.size + 2) + 'px' }">
        <div class="card-info">

            <router-link no-style :to="base.itemUrl(props.item)">
                <h2 class="card-title">{{ props.item.name }}</h2>
            </router-link>
            <p class="card-description mt-3">
                {{ props.item.description }}
            </p>
            <v-spacer/>
            <div class="buttons mt-3">
                <v-btn size="40" class="mr-3" icon="mdi-play" variant="tonal"/>
                <v-btn size="40" icon="mdi-shuffle" variant="tonal"/>
            </div>
        </div>
        <v-spacer></v-spacer>
        <router-link :to="base.itemUrl(props.item)">
            <div class="card-image"
                 :style="{backgroundImage: `url(${base.itemImage(props.item)})`, minHeight: (props.size + 2) + 'px'}"/>
        </router-link>
    </div>
</template>

<script setup lang="ts">
import {useBaseStore} from "../scripts/store/base"
import type {Item} from '../scripts/store/base'
import type {PropType} from "vue"

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
})

</script>

<style scoped>
.highlight-featured {
    max-width: 800px;
    height: calc((100vw - 500px) / 4);
    display: flex;
    flex-direction: row;

    background-color: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(100px) saturate(300%) brightness(105%);
    border-radius: 10px;
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.2);
}

.card-image {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    background-size: cover;
    aspect-ratio: 1;
    height: calc((100vw - 500px) / 4);
}

.card-info {
    min-width: 210px;
    padding: 20px;
    display: flex;
    flex-direction: column;
}

.card-title {
    white-space: nowrap;
    height: 40px;
    text-overflow: ellipsis;
}

.card-description {
    overflow-y: auto;
    width: 100%;
    word-wrap: anywhere;
    opacity: 0.7;
}
</style>