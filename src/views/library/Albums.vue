<template>
    <div class="albums pt-4">
        <item-card class="mb-4" v-for="album in spotify.library.albums" :item="album"/>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import ItemCard from "../../components/ItemCard.vue";

const spotify = useSpotifyStore()
</script>

<style scoped>
.albums {
    display: flex;
    flex-wrap: wrap;
    gap:10px;
    justify-content: space-evenly;
}
</style>