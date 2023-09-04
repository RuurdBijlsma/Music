<template>
    <div class="albums pt-4">
        <item-card class="mb-4" v-for="album in library.saved.album" :item="album"/>
    </div>
</template>

<script setup lang="ts">
import {useLibraryStore} from "../../scripts/store/library";
import ItemCard from "../../components/ItemCard.vue";

const library = useLibraryStore()
</script>

<style scoped lang="scss">
.albums {
    display: flex;
    flex-wrap: wrap;
    gap:10px;
    justify-content: space-evenly;
}
</style>