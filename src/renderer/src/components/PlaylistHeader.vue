<template>
    <div v-if="playlist" class="mb-8 playlist-info">
        <glow-image
            :height="250"
            :src="base.itemImage(playlist)"
            :width="250"
            class="mb-4"
            rounding="5px"
        />
        <spacer />
        <h1>{{ playlist.name }}</h1>
        <p class="playlist-stats">
            Created by
            <router-link
                :style="{ color: ui.themeColor }"
                :to="base.itemUrl(playlist.owner)"
                class="user-url"
                >{{ playlist.owner.display_name }}
            </router-link>
            • {{ tracks.length }} Track{{ tracks.length === 1 ? "" : "s" }} •
            {{ base.approximateDuration(totalDurationMs) }} •
            {{ followerString }}
        </p>
        <collection-buttons :collection="collection" :like-item="playlist" />
        <p class="text-center">{{ playlist.description }}</p>
    </div>
</template>

<script lang="ts" setup>
import type { ComputedRef, PropType } from "vue";
import { computed } from "vue";
import { useBaseStore } from "../store/base";
import type { ItemCollection } from "../scripts/types";
import GlowImage from "../components/GlowImage.vue";
import CollectionButtons from "./CollectionButtons.vue";
import Spacer from "./Spacer.vue";
import {useUIStore} from "../store/UIStore";

const props = defineProps({
    collection: {
        type: Object as PropType<ItemCollection | null>,
        required: true,
    },
});
const base = useBaseStore();
const ui = useUIStore();

const followerString = computed(() => {
    if (playlist.value === null) return "0 followers";
    let followers = playlist.value.followers;
    if (followers.total === 0) return "No followers";
    if (followers.total > 1000000) {
        let followerMillions = Math.round(followers.total / 1000000);
        return (
            followerMillions +
            "M follower" +
            (followerMillions === 1 ? "" : "s")
        );
    }
    return (
        followers.total.toLocaleString() +
        " follower" +
        (followers.total === 1 ? "" : "s")
    );
});
const playlist = computed(
    () => props.collection?.context as SpotifyApi.PlaylistObjectFull | null,
);
const tracks = computed(() => props.collection?.tracks ?? []);
const totalDurationMs: ComputedRef<number> = computed(() => {
    if (tracks.value === null) return 0;
    return tracks.value.reduce((a, b) => a + b.duration_ms, 0);
});
</script>

<style lang="less" scoped>
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
    opacity: 0.7;
}
</style>
