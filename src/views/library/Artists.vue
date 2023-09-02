<template>
    <div class="artists pt-4">
        <item-card class="mb-4" v-for="artist in spotify.library.artists" :item="artist"/>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import ItemCard from "../../components/ItemCard.vue";

const spotify = useSpotifyStore()
</script>

<style scoped lang="scss">
.artists {
    display: flex;
    flex-wrap: wrap;
    gap:10px;
    justify-content: space-evenly;
}
</style>