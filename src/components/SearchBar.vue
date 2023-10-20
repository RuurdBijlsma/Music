<template>
    <v-text-field
        no-drag
        spellcheck="false"
        class="search-field"
        hide-details density="compact"
        v-model="search.searchValue"
        append-inner-icon="mdi-magnify"
        placeholder="Search tracks, artists, playlists, and more"
        @keydown.enter="goToSearch"
        :clearable="true"
        variant="solo">
    </v-text-field>
</template>

<script setup lang="ts">
import { useBaseStore } from "../scripts/store/base";
import { useRouter } from "vue-router";
import { useSearchStore } from "../scripts/store/search";

const base = useBaseStore();
const router = useRouter();
const search = useSearchStore();

function goToSearch(){
    router.push(`/search?q=${search.searchValue}`);
}
</script>

<style scoped lang="scss">
.search-field {
    -webkit-app-region: no-drag;
    width: 300px;
    flex-grow: 2;
    position: relative;
}

.search-field:deep(.v-field--variant-solo) {
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
}

.dark .search-field:deep(.v-field--variant-solo) {
    background-color: rgba(0, 0, 0, 0.3);
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.15);
}
</style>