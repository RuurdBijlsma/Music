<template>
    <div class="playlist" v-if="playlist">
        <track-list :tracks="tracks">
            <div class="mb-8 playlist-info">
                <glow-image
                    rounding="5px"
                    :width="250"
                    :height="250"
                    class="mb-4"
                    :src="playlist.images[0].url"/>
                <v-spacer/>
                <h1>{{ playlist.name }}</h1>
                <p class="playlist-stats">
                    Created by
                    <router-link class="user-url" :to="base.itemUrl(playlist.owner)">{{
                            playlist.owner.display_name
                        }}
                    </router-link>
                    • {{ tracks.length }} Track{{ tracks.length === 1 ? '' : 's' }} •
                    {{ base.approximateDuration(totalDurationMs) }} • {{ followerString }}
                </p>
                <div class="play-buttons mt-2 mb-2">
                    <v-divider/>
                    <v-btn color="primary" icon="mdi-play-outline" variant="text"/>
                    <v-btn color="primary" icon="mdi-shuffle" variant="text"/>
                    <v-btn color="primary" icon="mdi-heart-outline" variant="text"/>
                    <v-divider/>
                </div>
                <p>{{ playlist.description }}</p>
            </div>
        </track-list>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useBaseStore} from "../../scripts/store/base";
import GlowImage from "../../components/GlowImage.vue";
import TrackList from "../../components/TrackList.vue";
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import TrackObjectFull = SpotifyApi.TrackObjectFull;

const route = useRoute()
const base = useBaseStore();
const spotify = useSpotifyStore();
const playlist = ref(null as null | SpotifyApi.SinglePlaylistResponse);
let loadedId = route.params.id as string;
watch(route, async () => {
    if (route.params.id !== loadedId)
        playlist.value = await spotify.api.getPlaylist(loadedId);
    console.log("route params change");
})
spotify.api.getPlaylist(loadedId).then((r: any) => {
    playlist.value = r;
    console.log("Playlist", r);
});
const tracks = computed(() => {
    if (playlist.value === null) return [];
    return playlist.value.tracks.items.map((t: PlaylistTrackObject) => t.track as TrackObjectFull)
});
const followerString = computed(() => {
    if (playlist.value === null) return '0 followers';
    if (playlist.value.followers.total > 1000000) {
        return Math.round(playlist.value.followers.total / 1000000) + 'M followers';
    }
    return playlist.value.followers.total.toLocaleString() + ' follower' + (playlist.value.followers.total === 1 ? '' : 's');
})
const totalDurationMs = computed(() => {
    return tracks.value.reduce((a, b) => a + b.duration_ms, 0);
});

</script>

<style scoped lang="scss">
.playlist-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-weight: 300;
    height: 485px;
}

.playlist-info > h1 {
    font-weight: 400;
}

.user-url {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
}

.user-url:hover {
    text-decoration: underline;
}

.playlist-stats {
    font-size: 13px;
    font-weight: 400;
    opacity: .7;
}

.play-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 5px;
}
</style>