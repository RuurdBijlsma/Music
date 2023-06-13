<template>
    <!--         v-if="searchValue !== '' && searchFocused && searchResults"-->
    <div class="search-suggestions"
         v-if="searchResults"
         :style="{
            left: searchX + 'px',
            top: searchY + 'px',
            width: width + 'px'}">
        <div class="sub-list" v-if="searchResults.liked.length > 0">
            <div class="sub-header">
                <v-divider/>
                <div>Library</div>
                <v-divider/>
            </div>
            <track-list-item v-for="track in searchResults.liked" class="track-list-item"
                             :track="track"></track-list-item>
        </div>
        <template v-if="searchResults.liked.length > 6">
            <v-divider/>
            <div class="list-expander">
                <v-btn v-if="expanded.includes(0)" @click="smallify(0)" icon="mdi-chevron-up" size="small" variant="text"></v-btn>
                <v-btn v-else @click="expand(0)" icon="mdi-chevron-down" size="small" variant="text"></v-btn>
            </div>
        </template>
        <div class="sub-list" v-if="searchResults.spotify.tracks.length > 0">
            <div class="sub-header">
                <v-divider/>
                <div>
                    <v-icon class="mr-2">mdi-spotify</v-icon>
                    Spotify
                </div>
                <v-divider/>
            </div>
            <track-list-item v-for="track in searchResults.spotify.tracks" class="track-list-item"
                             :track="track"></track-list-item>
        </div>
        <template v-if="searchResults.spotify.tracks.length > 6">
            <v-divider/>
            <div class="list-expander">
                <v-btn v-if="expanded.includes(1)" @click="smallify(1)" icon="mdi-chevron-up" size="small" variant="text"></v-btn>
                <v-btn v-else @click="expand(1)" icon="mdi-chevron-down" size="small" variant="text"></v-btn>
            </div>
        </template>
        <div class="sub-list" v-if="searchResults.youtube.length > 0">
            <div class="sub-header">
                <v-divider/>
                <div>
                    <v-icon class="mr-2">mdi-youtube</v-icon>
                    YouTube
                </div>
                <v-divider/>
            </div>
            <track-list-item v-for="track in searchResults.youtube" class="track-list-item"
                             :track="track"/>
        </div>
        <template v-if="searchResults.youtube.length > 6">
            <v-divider/>
            <div class="list-expander">
                <v-btn v-if="expanded.includes(2)" @click="smallify(2)" icon="mdi-chevron-up" size="small" variant="text"></v-btn>
                <v-btn v-else @click="expand(2)" icon="mdi-chevron-down" size="small" variant="text"></v-btn>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, toRaw, watch} from "vue";
import {clearInterval} from "timers";
import {useBaseStore} from "../scripts/store/base";
import {storeToRefs} from "pinia";
import {useSpotifyStore} from "../scripts/store/spotify";
import TrackListItem from "./TrackListItem.vue";
import type {SearchResult} from "../scripts/store/search";
import {useSearchStore} from "../scripts/store/search";

// todo search liked tracks met IDB ipv zoals dit

const base = useBaseStore()
const spotify = useSpotifyStore()
const search = useSearchStore()

const {searchValue, searchFocused} = storeToRefs(base)

let lastInputTime = performance.now()
watch(searchValue, () => {
    lastInputTime = performance.now()
});

const expanded = ref([] as number[])
const subListHeight = 355;

function expand(index: number) {
    const subLists = document.querySelectorAll('.sub-list')
    let list = subLists[index] as HTMLElement
    list.style.maxHeight = `${Math.max(list.scrollHeight, subListHeight)}px`

    if (!expanded.value.includes(index)) expanded.value.push(index)
}

function smallify(index: number) {
    const subLists = document.querySelectorAll('.sub-list')
    let list = subLists[index] as HTMLElement
    list.style.maxHeight = `${subListHeight}px`

    if (expanded.value.includes(index)) expanded.value.splice(expanded.value.indexOf(index), 1)
}

let el = null as null | Element;
let searchX = ref(200);
let searchY = ref(45);
let width = ref(500);
let lastSearchedQuery = "";

onMounted(() => {
    el = document.querySelector('.search-field')
    console.log("Search field el: ", el)
    updateSearchPos()
})
let interval: number;
interval = window.setInterval(() => {
    updateSearchPos()
    let now = performance.now();
    // als je 400 ms niks typt, start de auto search
    if (now - lastInputTime > 400 && searchValue.value.length > 1 && searchValue.value !== lastSearchedQuery) {
        performSearch();
        lastSearchedQuery = searchValue.value;
    }
}, 100);

let searchResults = ref(null as SearchResult | null)

async function performSearch() {
    let query = searchValue.value;
    console.log("Perform search for query: " + query);
    searchResults.value = await search.query(query);
    console.log(toRaw(searchResults.value))
}

function updateSearchPos() {
    if (el === null) return;
    let bounds = el.getBoundingClientRect();
    searchX.value = Math.round(bounds.left);
    searchY.value = Math.round(bounds.bottom);
    width.value = Math.round(bounds.width);
}

onBeforeUnmount(() => clearInterval(interval));
</script>

<style scoped lang="scss">
.search-suggestions {
    position: fixed;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    z-index: 8;

    //height: 500px;
    background-color: rgba(128, 128, 128, 0.5);
    backdrop-filter: blur(50px) saturate(100%) brightness(100%);
    box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.15);
    overflow-y: auto;
    max-height: calc(100% - 300px);
    padding-bottom: 4px;
    padding-top: 4px;
}

.search-suggestions::-webkit-scrollbar {
    width: 14px;
    height: 18px;
}

.search-suggestions::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, .1);
    border-radius: 3px;
}

.search-suggestions::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 3px;
}

.search-suggestions::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.6);
}

.dark .search-suggestions {
    background-color: rgba(0, 0, 0, 0.4);
}

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
    max-height: 355px;
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
</style>