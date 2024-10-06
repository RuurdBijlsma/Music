<template>
    <div class="home">
        <div class="home-title">
            <h1 class="featured-title mb-1">
                {{ library.view.homePage.featured.title }}
            </h1>
        </div>
        <horizontal-scroller>
            <highlight-card v-if="highlight" :item="highlight" :size="250" class="mr-4" />
            <item-card
                v-for="playlist in otherPlaylists"
                :item="playlist"
                :size="250"
                class="mr-4"
                hide-name
            />
        </horizontal-scroller>

        <template v-if="library.recentPlays.length > 0">
            <div class="home-title mt-4">
                <h2 class="other-title mb-5">Recently Played</h2>
            </div>

            <horizontal-scroller class="mt-1">
                <item-card
                    v-for="itemCollection in library.recentPlays"
                    :item="itemCollection"
                    class="mr-4"
                />
            </horizontal-scroller>
        </template>

        <template v-if="library.view.homePage.personalized.length > 0">
            <div class="home-title mt-4">
                <h2 class="other-title mb-5">Made for {{ library.userInfo.name }}</h2>
            </div>

            <horizontal-scroller class="mt-1">
                <item-card
                    v-for="item in library.view.homePage.personalized"
                    :item="item"
                    class="mr-4"
                    hide-name
                />
            </horizontal-scroller>
        </template>

        <template v-if="library.view.homePage.newReleases.length > 0">
            <div class="home-title mt-4">
                <h2 class="other-title mb-5">New Releases</h2>
            </div>

            <horizontal-scroller class="mt-1 mb-5">
                <item-card
                    v-for="item in library.view.homePage.newReleases"
                    :item="item"
                    :title="item.name"
                    class="mr-4"
                />
            </horizontal-scroller>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { useLibraryStore } from '../store/library'
import { computed } from 'vue'
import HighlightCard from '../components/item/HighlightCard.vue'
import ItemCard from '../components/item/ItemCard.vue'
import HorizontalScroller from '../components/HorizontalScroller.vue'

const library = useLibraryStore()
library.refreshHomePage()

const highlight = computed(
    () => library.view.homePage.featured.playlists[0] as SpotifyApi.PlaylistObjectFull
)
const otherPlaylists = computed(
    () => library.view.homePage.featured.playlists.slice(1) as SpotifyApi.PlaylistObjectFull[]
)
</script>

<style lang="less" scoped>
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
    opacity: 0.8;
}

.other-title {
    margin-bottom: 0 !important;
    font-size: 20px;
    font-weight: 500;
    opacity: 0.8;
}
</style>
