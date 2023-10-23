<template>
    <div class="browse">
        <div class="generate-radio">
            <h2>
                <v-icon class="mr-4" size="30" icon="mdi-radio-tower"></v-icon>
                Want to create your own radio?
            </h2>
            <v-btn :color="base.themeColor" class="generate-button mt-3" variant="tonal" to="/tune">Generate Custom Radio
            </v-btn>
        </div>
        <div class="categories">
            <v-divider />
            <h2 class="mb-2 mt-1 text-center">Curated lists</h2>
            <v-divider class="mb-8" />
            <div class="category-grid">
                <router-link
                    class="category"
                    v-for="category in categories"
                    no-style
                    :to="base.itemUrl(category)">
                    <div class="image"
                         :style="{backgroundImage: `url(${category.icons[0].url})`}">
                    </div>
                    <div class="info mt-2">
                        <p class="title">{{ category.name }}</p>
                    </div>
                </router-link>
            </div>
        </div>
        <div class="genres mt-3">
            <v-divider />
            <h2 class="mb-2 mt-1 text-center">Genres</h2>
            <v-divider class="mb-8" />
            <div class="genre-grid">
                <v-chip
                    class="genre"
                    :to="`/radio?id=${base.radioId()}&seed_genres=${genre.replace(/ /gi, '-').toLowerCase()}`"
                    v-for="genre in genres"
                >{{ genre }}
                </v-chip>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useSpotifyApiStore } from "../../store/spotify-api";
import { ref } from "vue";
import { executeCached } from "../../scripts/utils";
import { baseDb, useBaseStore } from "../../store/base";

const base = useBaseStore();
const spotify = useSpotifyApiStore();
const genres = ref(null as null | string[]);
const categories = ref(null as null | SpotifyApi.CategoryObject[]);

async function refresh() {
    const result = await executeCached<{
        categories: Array<SpotifyApi.CategoryObject>,
        genres: Array<string>
    }>(await baseDb,
        async () => await spotify.getBrowsePage(),
        "browsePage",
        1000 * 60 * 60 * 24
    );
    categories.value = result.categories;
    genres.value = result.genres;
}

refresh();
</script>

<style scoped>
.browse {
    padding: 80px 30px 30px;
}

.generate-radio {
    width: 100%;
    height: 160px;
    position: relative;
    padding: 20px 40px;
    margin-bottom: 30px;
    border-radius: 10px;

    background-color: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(100px) saturate(300%) brightness(105%);
    box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.15);
}

.dark .generate-radio {
    background-color: rgba(0, 0, 0, 0.4);
}

.generate-button {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: calc(100% - 40px) !important;
}

.image {
    border-radius: 10px;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.2);
    height: 12vw;
    aspect-ratio: 1;
    background-size: cover;
    position: relative;
}

.image:hover {
    opacity: 1;
}

.info {
    width: 12vw;
    font-size: 13px;
    overflow: hidden;
}

@media only screen and (max-width: 1500px) {
    .info {
        width: 190px;
    }

    .image {
        height: 190px;
    }
}

.category {
    margin-bottom: 20px;
}

.title {
    font-size: 13px;
    opacity: .9;
    margin-bottom: 0 !important;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
    min-width: 186px;
    justify-items: center;
}

.genre-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 17px;
}

</style>
