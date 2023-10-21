<template>
    <div class="home">
        <div class="home-title">
            <h1 class="featured-title mb-1">{{ library.view.homePage.featured.title }}</h1>
        </div>
        <horizontal-scroller>
            <highlight-card
                class="mr-4"
                :size="250"
                v-if="highlight"
                :item="highlight" />
            <item-card class="mr-4"
                       :item="playlist"
                       :size="250"
                       hide-name
                       v-for="playlist in otherPlaylists" />
        </horizontal-scroller>

        <template v-if="library.view.homePage.recent.length > 0">
            <div class="home-title mt-4">
                <h2 class="other-title mb-5">Recently Played</h2>
            </div>

            <horizontal-scroller class="mt-1">
                <item-card class="mr-4"
                           v-for="item in library.view.homePage.recent"
                           :item="item" />
            </horizontal-scroller>
        </template>

        <template v-if="library.view.homePage.personalized.length > 0">
            <div class="home-title mt-4">
                <h2 class="other-title mb-5">Made for {{ library.userInfo.name }}</h2>
            </div>

            <horizontal-scroller class="mt-1">
                <item-card class="mr-4"
                           v-for="item in library.view.homePage.personalized"
                           hide-name
                           :item="item" />
            </horizontal-scroller>
        </template>

        <template v-if="library.view.homePage.newReleases.length > 0">
            <div class="home-title mt-4">
                <h2 class="other-title mb-5">New Releases</h2>
            </div>

            <horizontal-scroller class="mt-1 mb-5">
                <item-card class="mr-4"
                           v-for="item in library.view.homePage.newReleases"
                           :title="item.name"
                           :item="item" />
            </horizontal-scroller>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useLibraryStore } from "../store/library";
import { computed } from "vue";
import HighlightCard from "../components/HighlightCard.vue";
import ItemCard from "../components/ItemCard.vue";
import HorizontalScroller from "../components/HorizontalScroller.vue";

const library = useLibraryStore();
library.refreshHomePage();

const highlight = computed(() => library.view.homePage.featured.playlists[0] as SpotifyApi.PlaylistObjectFull);
const otherPlaylists = computed(() => library.view.homePage.featured.playlists.slice(1) as SpotifyApi.PlaylistObjectFull[]);
</script>

<style scoped lang="less">
.home {
    padding-top: 60px;
}

@media (max-width: 930px) {
    .home {
        padding-left: 20px;
    }
}

.home-title {
    width: 100%;
    text-align: center;
    /*outline:1px solid rgba(0,0,0,0.1);*/
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 10px;
}

.featured-title {
    margin-bottom: 0 !important;
    font-size: 23px;
    font-weight: 500;
    opacity: .8;
}

.other-title {
    margin-bottom: 0 !important;
    font-size: 20px;
    font-weight: 500;
    opacity: .8;
}
</style>
