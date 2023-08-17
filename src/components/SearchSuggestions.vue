<template>
    <div class="search-suggestions"
         v-show="showSuggestions && searchValue !== '' && (likedResult.length > 0 || spotifyResult || ytResult.length > 0)"
         :style="{
            left: searchX + 'px',
            top: searchY + 'px',
            width: width + 'px'}">
        <search-suggestion-section :tracks="likedResult" :loading="likedLoading">
            Library
        </search-suggestion-section>
        <search-suggestion-section :tracks="spotifyResult" :loading="spotifyLoading">
            <v-icon class="mr-2">mdi-spotify</v-icon>
            Spotify
        </search-suggestion-section>
        <search-suggestion-section :tracks="ytResult" :loading="ytLoading">
            <v-icon class="mr-2">mdi-youtube</v-icon>
            YouTube
        </search-suggestion-section>
    </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, onUnmounted, ref, watch} from "vue";
import {clearInterval} from "timers";
import {useBaseStore} from "../scripts/store/base";
import type {Item} from '../scripts/store/base'
import {storeToRefs} from "pinia";
import {useSpotifyStore} from "../scripts/store/spotify";
import {useSearchStore} from "../scripts/store/search";
import SearchSuggestionSection from "./SearchSuggestionSection.vue";


const base = useBaseStore()
const spotify = useSpotifyStore()
const search = useSearchStore()
const showSuggestions = ref(false)
document.addEventListener('mousedown', onClick, false);
onUnmounted(() => document.removeEventListener('mousedown', onClick))

function onClick(e: MouseEvent) {
    let searchSuggestions = document.querySelector(".search-suggestions") as HTMLElement
    let searchBox = document.querySelector('.search-field') as HTMLElement
    let target = e.target as HTMLElement
    showSuggestions.value = searchSuggestions.contains(target) || searchBox.contains(target);
}

const {searchValue} = storeToRefs(base)

let lastInputTime = performance.now()
watch(searchValue, () => {
    lastInputTime = performance.now()
});

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
        lastInputTime = now;
        performSearch();
        lastSearchedQuery = searchValue.value;
    }
}, 200);

let ytResult = ref([] as SpotifyApi.TrackObjectFull[])
let spotifyResult = ref([] as SpotifyApi.TrackObjectFull[])
let likedResult = ref([] as SpotifyApi.TrackObjectFull[])
let ytLoading = ref(false)
let spotifyLoading = ref(false)
let likedLoading = ref(false)

async function performSearch() {
    ytLoading.value = true
    spotifyLoading.value = true
    likedLoading.value = true
    let query = searchValue.value;
    console.log("Perform search for query: " + query);
    search.addToRecentSearches(query)
    search.searchSpotify(query).then(res => {
        spotifyLoading.value = false
        if (res.tracks)
            spotifyResult.value = res.tracks.items
    })
    search.searchYouTube(query).then(res => {
        ytLoading.value = false
        ytResult.value = res
    })
    search.searchLikedTracks(query).then(res => {
        likedLoading.value = false
        likedResult.value = res
    })
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
</style>