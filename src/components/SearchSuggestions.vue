<template>
    <div class="search-suggestions"
         v-show="showSuggestions && searchValue !== null && searchValue !== '' && (likedResult.length > 0 || spotifyResult || ytResult.length > 0)"
         :style="{
            left: searchX + 'px',
            top: searchY + 'px',
            width: width + 'px'}">
        <search-suggestion-section type="Library" :id="'library' + searchValue" :tracks="likedResult"
                                   :loading="likedLoading">
            Library
        </search-suggestion-section>
        <search-suggestion-section type="Spotify" :id="'spotify' + searchValue" :tracks="spotifyResult"
                                   :loading="spotifyLoading">
            <v-icon class="mr-2">mdi-spotify</v-icon>
            Spotify
        </search-suggestion-section>
        <search-suggestion-section type="YouTube" :id="'youtube' + searchValue" :tracks="ytResult" :loading="ytLoading">
            <v-icon class="mr-2">mdi-youtube</v-icon>
            YouTube
        </search-suggestion-section>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, onUnmounted, ref, watch } from "vue";
import { clearInterval } from "timers";
import { useBaseStore } from "../scripts/store/base";
import { storeToRefs } from "pinia";
import { useLibraryStore } from "../scripts/store/library";
import { useSearchStore } from "../scripts/store/search";
import SearchSuggestionSection from "./SearchSuggestionSection.vue";


const base = useBaseStore();
const library = useLibraryStore();
const search = useSearchStore();
const showSuggestions = ref(false);

const {
    likedResult,
    ytResult,
    spotifyResult,
    likedLoading,
    ytLoading,
    spotifyLoading,
    searchValue,
} = storeToRefs(search);

document.addEventListener("mousedown", onClick, false);
onUnmounted(() => document.removeEventListener("mousedown", onClick));

function onClick(e: MouseEvent) {
    let searchSuggestions = document.querySelector(".search-suggestions") as HTMLElement;
    let searchBox = document.querySelector(".search-field") as HTMLElement;
    let target = e.target as HTMLElement;
    showSuggestions.value = searchSuggestions.contains(target) || searchBox.contains(target);
}

let lastInputTime = performance.now();
watch(searchValue, () => {
    lastInputTime = performance.now();
});

let el = null as null | Element;
let searchX = ref(200);
let searchY = ref(45);
let width = ref(500);
let lastSearchedQuery = "";

onMounted(() => {
    el = document.querySelector(".search-field");
    updateSearchPos();
});
let interval: number;
interval = window.setInterval(() => {
    updateSearchPos();
    let now = performance.now();
    // als je 750 ms niks typt, start de auto search
    if (now - lastInputTime > 750 && searchValue.value !== lastSearchedQuery) {
        lastInputTime = now;
        search.performSearch();
        lastSearchedQuery = searchValue.value;
    }
}, 375);
onBeforeUnmount(() => clearInterval(interval));


function updateSearchPos() {
    if (el === null) return;
    let bounds = el.getBoundingClientRect();
    searchX.value = Math.round(bounds.left);
    searchY.value = Math.round(bounds.bottom);
    width.value = Math.round(bounds.width);
}

</script>

<style scoped lang="scss">
.search-suggestions {
    position: fixed;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    z-index: 8;

    //height: 500px;
    background-color: rgba(var(--v-theme-background), 0.5);
    backdrop-filter: blur(50px) saturate(100%) brightness(120%);
    box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.15);
    overflow-y: auto;
    max-height: calc(100% - 300px);
    padding-bottom: 4px;
    padding-top: 4px;
}

.dark .search-suggestions {
    background-color: rgba(var(--v-theme-background), 0.7);
    backdrop-filter: blur(50px) saturate(100%) brightness(80%);
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