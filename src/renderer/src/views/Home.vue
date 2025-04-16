<template>
  <div class="home">
    <template v-if="library.view.homePage.personalized.length > 0">
      <div class="home-title mt-4">
        <h2 class="other-title mb-5">Made for {{ library.userInfo.name }}</h2>
      </div>

      <horizontal-scroller class="mt-1">
        <highlight-card
          class="mr-4"
          :size="250"
          v-if="highlight"
          :item="highlight"
        ></highlight-card>
        <item-card v-for="item in otherPlaylists" :item="item" class="mr-4" hide-name />
      </horizontal-scroller>
    </template>

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
import ItemCard from '../components/item/ItemCard.vue'
import HorizontalScroller from '../components/HorizontalScroller.vue'
import HighlightCard from '@renderer/components/item/HighlightCard.vue'
import { computed } from 'vue'

const randomIndex = computed(() =>
  Math.floor(Math.random() * library.view.homePage.personalized.length)
)
const highlight = computed(
  () => library.view.homePage.personalized[randomIndex.value] as SpotifyApi.PlaylistObjectFull
)
const otherPlaylists = computed(
  () =>
    library.view.homePage.personalized.filter(
      (_, i) => i !== randomIndex.value
    ) as SpotifyApi.PlaylistObjectFull[]
)

const library = useLibraryStore()
library.refreshHomePage()
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

.featured-title {
  margin-bottom: 0 !important;
  font-size: 23px;
  font-weight: 500;
  opacity: 0.8;
}

.home-title {
  width: 100%;
  text-align: center;
  /*outline:1px solid rgba(0,0,0,0.1);*/
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
}

.other-title {
  margin-bottom: 0 !important;
  font-size: 20px;
  font-weight: 500;
  opacity: 0.8;
}
</style>
