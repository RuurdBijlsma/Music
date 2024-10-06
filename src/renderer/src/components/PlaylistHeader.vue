<template>
    <div v-if="playlist" class="mb-8 playlist-info">
        <glow-image
            :height="250"
            :src="itemImage(playlist)"
            :width="250"
            class="mb-4"
            rounding="5px"
        />
        <spacer />
        <h1 :title="playlist.name" class="playlist-name">
            {{ playlist.name }}
        </h1>
        <p class="playlist-stats">
            Created by
            <router-link
                :style="{ color: ui.themeColor }"
                :to="itemUrl(playlist.owner)"
                class="user-url"
                >{{ playlist.owner.display_name }}
            </router-link>
            • {{ tracks.length }} Track{{ tracks.length === 1 ? '' : 's' }} •
            {{ approximateDuration(totalDurationMs) }} •
            {{ followerString }}
        </p>
        <collection-buttons :collection="collection" :like-item="playlist" />
        <p class="text-center">{{ playlist.description }}</p>
    </div>
</template>

<script lang="ts" setup>
import type { ComputedRef, PropType } from 'vue'
import { computed } from 'vue'
import type { ItemCollection } from '../scripts/types'
import GlowImage from '../components/GlowImage.vue'
import CollectionButtons from './CollectionButtons.vue'
import Spacer from './Spacer.vue'
import { useUIStore } from '../store/UI/UIStore'
import { approximateDuration } from '../scripts/utils'
import { itemImage, itemUrl } from '../scripts/item-utils'

const props = defineProps({
    collection: {
        type: Object as PropType<ItemCollection | null>,
        required: true
    }
})
const ui = useUIStore()

const followerString = computed(() => {
    if (playlist.value === null) return '0 followers'
    const followers = playlist.value.followers
    if (followers.total === 0) return 'No followers'
    if (followers.total > 1000000) {
        const followerMillions = Math.round(followers.total / 1000000)
        return followerMillions + 'M follower' + (followerMillions === 1 ? '' : 's')
    }
    return followers.total.toLocaleString() + ' follower' + (followers.total === 1 ? '' : 's')
})
const playlist = computed(() => props.collection?.context as SpotifyApi.PlaylistObjectFull | null)
const tracks = computed(() => props.collection?.tracks ?? [])
const totalDurationMs: ComputedRef<number> = computed(() => {
    if (tracks.value === null) return 0
    return tracks.value.reduce((a, b) => a + b.duration_ms, 0)
})
</script>

<style lang="less" scoped>
.playlist-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-weight: 300;
    height: 490px;
}

.playlist-name {
    font-weight: 400;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
    font-size: 29px;
    overflow-y: hidden;
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
