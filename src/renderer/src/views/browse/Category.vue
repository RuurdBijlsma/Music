<template>
    <div class="category" v-if="category">
        <h1 class="page-title">{{ category.name }}</h1>
        <v-divider class="mt-4 mb-8" />
        <div class="playlist-grid" v-if="playlists">
            <item-card v-for="playlist in playlists" :item="playlist"></item-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useSpotifyApiStore } from "../../store/spotify-api";
import { useRoute } from "vue-router";
import ItemCard from "../../components/ItemCard.vue";

const category = ref(null as null | SpotifyApi.CategoryObject);
const playlists = ref(null as null | SpotifyApi.PlaylistObjectFull[]);
const spotify = useSpotifyApiStore();
const route = useRoute();

async function refresh() {
    let id = route.params.id as string | undefined;
    if (id === null || id === undefined) return;

    let result = await spotify.getCategory(id);
    category.value = result.category;
    playlists.value = result.playlists.filter(p => p !== null);
}

refresh();
watch(route, () => refresh());
</script>
<style scoped>
.category {
    padding: 80px 30px 30px;
}

.playlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
    min-width: 186px;
    gap: 20px;
    justify-items: center;
}
</style>
