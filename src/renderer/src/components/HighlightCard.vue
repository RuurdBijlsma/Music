<template>
    <div
        class="highlight-featured mr-2"
        @click.right="base.setContextMenuItem($event, item)"
    >
        <div class="card-info">
            <div class="card-text">
                <router-link :to="base.itemUrl(item)" no-style>
                    <h2 class="card-title">{{ itemName }}</h2>
                </router-link>
                <p class="card-description mt-3">
                    <template v-if="item.type !== 'album'"
                        >{{ base.itemDescription(item) }}
                    </template>
                    <template v-else>{{ base.albumString(item) }}</template>
                </p>
            </div>
            <spacer />
            <div class="buttons mt-3">
                <item-play-button
                    :color="base.themeColor"
                    :item="item"
                    class="mr-3"
                />
                <item-play-button
                    :color="base.themeColor"
                    :item="item"
                    :shuffle="true"
                />
            </div>
        </div>
        <spacer></spacer>
        <router-link :to="base.itemUrl(item)">
            <div
                :style="{ backgroundImage: `url(${base.itemImage(item)})` }"
                class="card-image"
            />
        </router-link>
    </div>
</template>

<script lang="ts" setup>
import { useBaseStore } from "../store/base";
import type { PropType } from "vue";
import { computed } from "vue";
import type { Item } from "../scripts/types";
import Spacer from "./Spacer.vue";
import ItemPlayButton from "./ItemPlayButton.vue";

const base = useBaseStore();
const props = defineProps({
    item: {
        type: Object as PropType<Item>,
        required: true,
    },
    size: {
        type: Number,
        required: false,
        default: () => 200,
    },
});
const itemName = computed(() => props.item.name);
</script>

<style lang="less" scoped>
.highlight-featured {
    width: 30vw;
    height: calc(12vw + 50px);

    display: flex;
    flex-direction: row;
    border-radius: 10px;

    background-color: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(100px) saturate(300%) brightness(105%);
    box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.15);
}

.dark .highlight-featured {
    background-color: rgba(0, 0, 0, 0.4);
}

h2 {
    font-weight: bolder;
    text-align: left;
}

.card-image {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    background-size: cover;
    aspect-ratio: 1;
    height: calc(12vw + 50px);
    background-position: center;
}

@media only screen and (max-width: 1500px) {
    .highlight-featured {
        width: 500px;
        height: 230px;
    }

    .card-image {
        height: 230px;
    }
}

.card-info {
    min-width: 210px;
    padding: 20px;
    display: flex;
    flex-direction: column;
}

.card-text {
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 4; /* number of lines to show */
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow-y: auto;
}

.card-title {
    /*white-space: nowrap;*/
    /*height: 40px;*/
}

.card-description {
    overflow-y: auto;
    width: 100%;
    word-wrap: anywhere;
    opacity: 0.7;
}

@media only screen and (max-width: 1500px) {
    /*.card-description {*/
    /*    text-overflow: ellipsis;*/
    /*    display: -webkit-box;*/
    /*    -webkit-line-clamp: 3; !* number of lines to show *!*/
    /*    line-clamp: 3;*/
    /*    -webkit-box-orient: vertical;*/
    /*}*/
}
</style>
