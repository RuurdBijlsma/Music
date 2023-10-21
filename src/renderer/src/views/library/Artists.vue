<template>
    <div class="artists pt-4">
        <item-card class="mb-4" v-for="artist in library.saved.artist" :item="artist" />
    </div>
</template>

<script setup lang="ts">
import { useLibraryStore } from "../../store/library";
import ItemCard from "../../components/ItemCard.vue";

const library = useLibraryStore();
</script>

<style scoped lang="less">
.artists {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: space-evenly;
}
</style>
