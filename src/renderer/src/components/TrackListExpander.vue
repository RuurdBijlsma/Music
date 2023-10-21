<template>
    <template v-if="!loading">
        <div class="sub-list" v-if="tracks.length > 0" ref="subList" :style="{
            maxHeight: sublistMaxHeight + 'px',
        }">
            <div class="sub-header mt-1 mb-1" v-if="showHeader">
                <v-divider />
                <div>
                    <slot></slot>
                </div>
                <v-divider />
            </div>
            <track-list padding-top="0" :collection="collection" :tracks="collection.tracks" />
        </div>
        <template v-if="tracks.length > 3">
            <v-divider />
            <div class="list-expander">
                <v-btn v-if="expanded" @click="smallify()" icon="mdi-chevron-up" size="small"
                       variant="text"></v-btn>
                <v-btn v-else @click="expand()" icon="mdi-chevron-down" size="small" variant="text"></v-btn>
            </div>
        </template>
    </template>
    <div v-else class="loading-circle">
        <v-progress-circular size="40" indeterminate />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { PropType } from "vue";
import TrackList from "./TrackList.vue";
import type { ItemCollection } from "../scripts/types";

const subList = ref<HTMLElement | null>(null);

const props = defineProps({
    tracks: {
        type: Object as PropType<SpotifyApi.TrackObjectFull[]>,
        required: true
    },
    loading: {
        type: Boolean,
        required: false,
        default: () => false
    },
    collection: {
        type: Object as PropType<ItemCollection>,
        required: true
    },
    showAmount: {
        type: Number,
        required: false,
        default: 4
    },
    showHeader: {
        type: Boolean,
        default: false
    }
});

const expanded = ref(false);
const collapsedHeight = computed(() => props.showAmount * 50 + (props.showHeader ? 28 : 0));
let sublistMaxHeight = ref(collapsedHeight.value);

function expand() {
    if (subList.value === null) return;
    console.log("expand", subList.value.scrollHeight);
    sublistMaxHeight.value = Math.max(subList.value.scrollHeight, collapsedHeight.value);
    expanded.value = true;
}

function smallify() {
    if (subList.value === null) return;
    sublistMaxHeight.value = collapsedHeight.value;
    expanded.value = false;
}

</script>

<style scoped lang="less">
.sub-header {
    display: flex;
    align-items: center;
    padding: 0 20px;
}

.sub-header > div {
    padding: 0 20px;
    flex-grow: 2;
    width: 100%;
    font-size: 13px;
    font-weight: 400;
    opacity: .7;
    text-align: center;
}

.sub-list {
    overflow-y: hidden;
    transition: .5s;
}

.list-expander {
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: center;
}

.track-list-item {
    //width: 100%;
    margin-left: 10px;
    margin-right: 10px;
    margin-bottom: 6px;
}

.track-list-item:last-child {
    margin-bottom: 0;
}

.loading-circle {
    display: flex;
    justify-content: center;
    padding: 40px;
    height: 226px;
}
</style>
