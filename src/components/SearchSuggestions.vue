<template>
    <div class="search-suggestions"
         v-if="searchValue !== '' && searchFocused"
         :style="{
            left: searchX + 'px',
            top: searchY + 'px',
            width: width + 'px'}">
        <div v-for="track in searchResults.liked">
            <p>{{ track.name }}</p>
            <p>{{ track.artists.map(a=>a.name).join(', ') }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import {clearInterval} from "timers";
import {useBaseStore} from "../scripts/store/base";
import {storeToRefs} from "pinia";
import {useSpotifyStore} from "../scripts/store/spotify";

// todo search liked tracks met IDB ipv zoals dit

const base = useBaseStore();
const spotify = useSpotifyStore();

const {searchValue, searchFocused} = storeToRefs(base);

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
    el = document.querySelector('.search-field');
    console.log("Search field el: ", el);
    updateSearchPos();
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

let searchResults = ref({
    liked: [] as SpotifyApi.TrackObjectFull[],
    artists: [] as SpotifyApi.ArtistObjectSimplified[],
    tracks: [] as SpotifyApi.TrackObjectSimplified[],
    albums: [] as SpotifyApi.AlbumObjectSimplified[],
    playlists: [] as SpotifyApi.PlaylistObjectSimplified[],
})

function performSearch() {
    let query = searchValue.value;
    let lowerQuery = query.toLowerCase();
    console.log("Perform search for query: " + query);
    let liked = [];
    console.log("Searching through:", spotify.library.tracks.length, 'tracks');
    outer:
        for (let i = 0; i < spotify.library.tracks.length; i++) {
            let track = spotify.library.tracks[i];
            console.log('iterate', track.name);
            if (track.name.toLowerCase().includes(lowerQuery)) {
                liked.push(track);
                continue;
            }
            for (let j = 0; j < track.artists.length; j++) {
                if (track.artists[j].name.toLowerCase().includes(lowerQuery)) {
                    liked.push(track);
                    continue outer;
                }
            }
        }
    searchResults.value.liked = liked;
    console.log('liked search results', liked);
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

    height: 500px;
    background-color: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(15px) saturate(300%) brightness(105%);
    box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.15);
}

.dark .search-suggestions {
    background-color: rgba(0, 0, 0, 0.4);
}
</style>