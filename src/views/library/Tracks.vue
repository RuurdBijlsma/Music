<template>
    <div class="playlist">
        <v-virtual-scroll :items="spotify.library.tracks" height="100%" item-height="50">
            <template v-slot:default="{ item, index }">
                <track-list-item :class="{'odd-item': index % 2 === 0}" class="track-list-item" :track="item"/>
            </template>
        </v-virtual-scroll>
<!--        <track-list :tracks="spotify.library.tracks">-->
<!--            <div class="mb-8 playlist-info">-->
<!--                hello my tracks-->
<!--            </div>-->
<!--        </track-list>-->
    </div>
</template>

<script setup lang="ts">
import TrackList from "../../components/TrackList.vue";
import {useSpotifyStore} from "../../scripts/store/spotify";
import TrackListItem from "../../components/TrackListItem.vue";

const spotify = useSpotifyStore();
// spotify.refreshUserData('track');

</script>

<style scoped>
</style>