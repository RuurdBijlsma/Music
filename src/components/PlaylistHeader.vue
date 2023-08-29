<template>
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
            <router-link :style="{color:base.themeColor.value}" class="user-url"
                         :to="base.itemUrl(playlist.owner)">{{
                    playlist.owner.display_name
                }}
            </router-link>
            • {{ tracks.length }} Track{{ tracks.length === 1 ? '' : 's' }} •
            {{ base.approximateDuration(totalDurationMs) }} • {{ followerString }}
        </p>
        <div class="play-buttons mt-2 mb-2">
            <v-divider/>
            <v-btn :color="base.themeColor.value" icon="mdi-play-outline" variant="text"/>
            <v-btn :color="base.themeColor.value" icon="mdi-shuffle" variant="text"/>
            <v-btn :color="base.themeColor.value" icon="mdi-heart-outline" variant="text"/>
            <v-divider/>
        </div>
        <p>{{ playlist.description }}</p>
    </div>
</template>

<script setup lang="ts">
import type {PropType} from "vue";
import {useBaseStore} from "../scripts/store/base";
import {computed} from "vue";
import type {ItemCollection} from "../scripts/types";
import GlowImage from "../components/GlowImage.vue";

const props = defineProps({
    collection: {
        type: Object as PropType<ItemCollection>,
        required: true
    },
})
const base = useBaseStore()
const followerString = computed(() => {
    if (props.collection === null) return '0 followers';
    let followers = playlist.value.followers
    if (followers.total > 1000000) {
        let followerMillions = Math.round(followers.total / 1000000);
        return followerMillions + 'M follower' + (followerMillions === 1 ? '' : 's');
    }
    return followers.total.toLocaleString() + ' follower' + (followers.total === 1 ? '' : 's');
})
const playlist = computed(() => props.collection.context as SpotifyApi.PlaylistObjectFull)
const tracks = computed(() => props.collection.tracks)
const totalDurationMs = computed(() => {
    if (tracks.value === null)
        return 0
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
    transition: color 1s;
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