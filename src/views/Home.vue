<template>
    <div class="home">
        <div class="home-title">
            <h1 class="featured-title mb-1">{{ spotify.view.homePage.featured.title }}</h1>
        </div>
        <horizontal-scroller>
            <highlight-card
                v-if="highlight"
                :title="highlight.name"
                :img="highlight.images[0].url"
                :description="highlight.description"/>
            <item-card class="ml-2 mr-2"
                       v-for="playlist in otherPlaylists"
                       :img="playlist.images[0].url"
                       :description="playlist.description"/>
        </horizontal-scroller>

        <template v-if="spotify.view.homePage.recent.length > 0">
            <div class="home-title mt-4">
                <h2 class="other-title mb-5">Recently Played</h2>
            </div>

            <horizontal-scroller class="mt-1">
                <item-card class="ml-2 mr-2"
                           v-for="item in spotify.view.homePage.recent"
                           :img="item.images[0].url"
                           :description="item.description"/>
            </horizontal-scroller>
        </template>

        <template v-if="spotify.view.homePage.personalized.length > 0">
            <div class="home-title mt-4">
                <h2 class="other-title mb-5">Made for {{ spotify.userInfo.name }}</h2>
            </div>

            <horizontal-scroller class="mt-1">
                <item-card class="ml-2 mr-2"
                           v-for="item in spotify.view.homePage.personalized"
                           :img="item.images[0].url"
                           :description="item.description"/>
            </horizontal-scroller>
        </template>

        <template v-if="spotify.view.homePage.newReleases.length > 0">
            <div class="home-title mt-4">
                <h2 class="other-title mb-5">New Releases</h2>
            </div>

            <horizontal-scroller class="mt-1 mb-5">
                <item-card class="ml-2 mr-2"
                           v-for="item in spotify.view.homePage.newReleases"
                           :title="item.name"
                           :img="item.images[0].url"
                           :description="`${caps(item.album_type)} • ${item.artists.map(a => a.name).join(', ')}`"/>
            </horizontal-scroller>
        </template>
    </div>
</template>

<script setup>
import {useSpotifyStore} from "../scripts/store/spotify";
import {computed} from "vue";
import HighlightCard from "../components/HighlightCard.vue";
import ItemCard from "../components/ItemCard.vue";
import HorizontalScroller from "../components/HorizontalScroller.vue";

const spotify = useSpotifyStore();
spotify.refreshHomePage();

const highlight = computed(() => spotify.view.homePage.featured.playlists[0])
const otherPlaylists = computed(() => spotify.view.homePage.featured.playlists.slice(1))

const caps = (str) => {
    return str[0].toUpperCase() + str.slice(1);
}
</script>

<style scoped>
.home {
    /*padding: 10px 20px;*/
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