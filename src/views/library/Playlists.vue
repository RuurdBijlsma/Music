<template>
    <div class="playlists pt-4">
        <item-card class="mb-4" v-for="playlist in library.saved.playlist" :item="playlist" />
    </div>
</template>

<script setup lang="ts">
import { useLibraryStore } from "../../scripts/store/library";
import ItemCard from "../../components/ItemCard.vue";

const library = useLibraryStore();
</script>

<style scoped lang="scss">
.playlists {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: space-evenly;
}
</style>