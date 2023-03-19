<template>
    <div class="playlists pt-4">
        <item-card class="mb-4" v-for="playlist in spotify.library.playlists" :item="playlist"/>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import ItemCard from "../../components/ItemCard.vue";

const spotify = useSpotifyStore()
</script>

<style scoped>
.playlists {
    display: flex;
    flex-wrap: wrap;
    gap:10px;
    justify-content: space-evenly;
}
</style>