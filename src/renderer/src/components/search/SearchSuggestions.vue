<template>
    <div
        v-show="showSuggestions"
        :style="{
            left: searchX + 'px',
            top: searchY + 'px',
            width: width + 'px'
        }"
        class="search-suggestions"
    >
        <div v-if="!hasValidSearch" class="recent-searches">
            <template v-if="search.recentSearches.length !== 0">
                <v-list-subheader>Recent searches</v-list-subheader>
                <v-list-item
                    v-for="recent in search.recentSearches"
                    :exact="true"
                    :to="`/search/${recent}`"
                    rounded
                >
                    <v-list-item-title>{{ recent }}</v-list-item-title>
                </v-list-item>
            </template>
        </div>
        <template v-else-if="r !== null">
            <search-suggestion-section
                :id="'library' + searchValue"
                :loading="r.liked.loading"
                :tracks="r.liked.tracks"
                type="Library"
            >
                Library
            </search-suggestion-section>
            <search-suggestion-section
                :id="'spotify' + searchValue"
                :loading="r.spotify.loading"
                :tracks="r.spotify.data.tracks"
                type="Spotify"
            >
                <v-icon class="mr-2">mdi-spotify</v-icon>
                Spotify
            </search-suggestion-section>
            <search-suggestion-section
                :id="'youtube' + searchValue"
                :loading="r.youtube.loading"
                :tracks="r.youtube.tracks"
                type="YouTube"
            >
                <v-icon class="mr-2">mdi-youtube</v-icon>
                YouTube
            </search-suggestion-section>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSearchStore } from '../../store/search'
import SearchSuggestionSection from './SearchSuggestionSection.vue'
import { useRoute } from 'vue-router'

const search = useSearchStore()

const { suggestionResults, searchValue, showSuggestions } = storeToRefs(search)

const r = computed(() => suggestionResults.value)

const hasValidSearch = computed(() => {
    if (r.value === null) return false
    if (searchValue.value === null) return false
    return searchValue.value.trim().length >= 3
})

document.addEventListener('mousedown', onClick, false)
onUnmounted(() => document.removeEventListener('mousedown', onClick))

function onClick(e: MouseEvent) {
    const searchSuggestions = document.querySelector('.search-suggestions') as HTMLElement
    const searchBox = document.querySelector('.search-field') as HTMLElement
    const target = e.target as HTMLElement
    showSuggestions.value = searchSuggestions.contains(target) || searchBox.contains(target)
}

let lastInputTime = performance.now()
watch(searchValue, () => {
    search.clearSuggestions()
    lastInputTime = performance.now()
})

const route = useRoute()
watch(route, () => (showSuggestions.value = false))

let el = null as null | Element
const searchX = ref(200)
const searchY = ref(45)
const width = ref(500)
let lastSearchedQuery = ''

onMounted(() => {
    el = document.querySelector('.search-field')
    updateSearchPos()
})
let interval: number
interval = window.setInterval(() => {
    updateSearchPos()
    const now = performance.now()
    // als je 750 ms niks typt, start de auto search
    if (now - lastInputTime > 750 && searchValue.value !== lastSearchedQuery) {
        lastInputTime = now
        search.suggestionResults = search.cachedSearch(searchValue.value).value
        lastSearchedQuery = searchValue.value
    }
}, 375)
onBeforeUnmount(() => clearInterval(interval))

function updateSearchPos() {
    if (el === null) return
    const bounds = el.getBoundingClientRect()
    searchX.value = Math.round(bounds.left)
    searchY.value = Math.round(bounds.bottom)
    width.value = Math.round(bounds.width)
}
</script>

<style lang="less" scoped>
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
    background: rgba(0, 0, 0, 0.1);
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

.recent-searches {
    padding: 0 20px 20px;
}
</style>
