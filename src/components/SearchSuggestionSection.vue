<template>
    <template v-if="!loading">
        <div class="sub-list" v-if="tracks.length > 0" ref="subList">
            <div class="sub-header">
                <v-divider/>
                <div>
                    <slot></slot>
                </div>
                <v-divider/>
            </div>
            <track-list-item v-for="track in tracks" class="track-list-item"
                             :track="track"></track-list-item>
        </div>
        <template v-if="tracks.length > 3">
            <v-divider/>
            <div class="list-expander">
                <v-btn v-if="expanded" @click="smallify()" icon="mdi-chevron-up" size="small"
                       variant="text"></v-btn>
                <v-btn v-else @click="expand()" icon="mdi-chevron-down" size="small" variant="text"></v-btn>
            </div>
        </template>
    </template>
    <div v-else class="loading-circle">
        <v-progress-circular size="40" indeterminate/>
    </div>
</template>

<script setup lang="ts">
import {ref, watch} from "vue";
import type {PropType} from "vue";
import {useBaseStore} from "../scripts/store/base";
import type {Item} from "../scripts/store/base";
import {storeToRefs} from "pinia";
import {useSpotifyStore} from "../scripts/store/spotify";
import TrackListItem from "./TrackListItem.vue";

const subList = ref<HTMLElement | null>(null);

defineProps({
    tracks: {
        type: Object as PropType<Item[]>,
        required: true
    },
    loading: {
        type: Boolean,
        required: false,
        default: () => false,
    },
})

const base = useBaseStore()
const spotify = useSpotifyStore()

const {searchValue} = storeToRefs(base)

let lastInputTime = performance.now()
watch(searchValue, () => {
    lastInputTime = performance.now()
});

const expanded = ref(false)
const subListHeight = 185;

function expand() {
    if (subList.value === null) return
    subList.value.style.maxHeight = `${Math.max(subList.value.scrollHeight, subListHeight)}px`
    expanded.value = true
}

function smallify() {
    if (subList.value === null) return
    subList.value.style.maxHeight = `${subListHeight}px`
    expanded.value = false
}

</script>

<style scoped lang="scss">
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
    max-height: 185px;
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
    padding:40px;
    height:226px;
}
</style>