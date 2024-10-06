<template>
    <v-text-field
        v-model="search.searchValue"
        :clearable="true"
        append-inner-icon="mdi-magnify"
        class="search-field"
        density="compact"
        hide-details
        no-drag
        placeholder="Search tracks, artists, playlists, and more"
        spellcheck="false"
        variant="solo"
        @keydown.enter="goToSearch"
    >
    </v-text-field>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useSearchStore } from '../../store/search'

const router = useRouter()
const search = useSearchStore()

function goToSearch() {
    router.push(`/search/${search.searchValue}`)
    const input = document.querySelector('.search-field input') as HTMLInputElement | null
    if (input === null) return
    input.blur()
}
</script>

<style lang="less" scoped>
.search-field {
    height: 40px;
    -webkit-app-region: no-drag;
    width: 300px;
    flex-grow: 2;
    position: relative;
}

.search-field:deep(input) {
    height: 40px;
}

.search-field:deep(.v-field--variant-solo) {
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    height: 40px;
}

.dark .search-field:deep(.v-field--variant-solo) {
    background-color: rgba(0, 0, 0, 0.3);
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.15);
}
</style>
