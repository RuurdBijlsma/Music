<template>
    <div class="left-nav">
        <v-btn
            :icon="route.path === '/' ? 'mdi-play-box' : 'mdi-play-box-outline'"
            class="nav-1-btn nav-button"
            rounded
            to="/"
            variant="text"
        ></v-btn>
        <span :class="{ active: route.path === '/' }" class="button-text nav-1-text"
            >Listen Now</span
        >
        <v-btn
            :icon="route.path === '/browse' ? 'mdi-library' : 'mdi-library-outline'"
            class="nav-2-btn nav-button"
            rounded
            to="/browse"
            variant="text"
        ></v-btn>
        <span :class="{ active: route.path === '/browse' }" class="button-text nav-2-text"
            >Browse</span
        >
        <v-btn
            :icon="route.path === '/library' ? 'mdi-music-note' : 'mdi-music-note-outline'"
            class="nav-3-btn nav-button"
            rounded
            to="/library"
            variant="text"
        />
        <span :class="{ active: route.path === '/library' }" class="button-text nav-3-text"
            >Library</span
        >
        <v-btn
            :icon="playlistsExpanded ? 'mdi-chevron-up' : 'mdi-playlist-play'"
            :style="{
                transform: playlistsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }"
            class="nav-4-btn nav-button"
            rounded
            variant="text"
            @click="playlistsExpanded = !playlistsExpanded"
        />
        <span :class="{ active: playlistsExpanded }" class="button-text nav-4-text">Playlists</span>
        <div
            :style="{
                opacity: playlistsExpanded ? '1' : '0',
                transform: playlistsExpanded ? 'scaleY(1) translateY(0%)' : 'scaleY(.7)',
                pointerEvents: playlistsExpanded ? 'auto' : 'none'
            }"
            class="pinned-playlists"
        >
            <v-tooltip
                v-for="playlist in library.saved.playlist"
                :text="playlist.name"
                location="right"
            >
                <template #activator="{ props }">
                    <v-btn height="64" max-width="64" v-bind="props" variant="text">
                        <router-link :to="itemUrl(playlist)">
                            <v-avatar rounded size="50">
                                <v-img :src="itemImage(playlist)"></v-img>
                            </v-avatar>
                        </router-link>
                    </v-btn>
                </template>
            </v-tooltip>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import { useLibraryStore } from '../../store/library'
import { itemImage, itemUrl } from '../../scripts/item-utils'

const route = useRoute()
const library = useLibraryStore()
const playlistsExpanded = ref(false)
</script>

<style lang="less" scoped>
.left-nav {
    position: fixed;
    left: 0;
    top: 50px;
    width: 70px;
    height: calc(100% - 50px);
    box-shadow: 1px 0 1px 0 rgba(0, 0, 0, 0.1);
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 20px;
    z-index: 3;
    backdrop-filter: blur(40px) saturate(150%);
    background-color: rgba(var(--v-theme-background), 0.3);
}

.dark .left-nav {
    background-color: rgba(var(--v-theme-background), 0.5);
}

.nav-button {
    transform: translateY(0);
}

.nav-button:hover {
    transform: translateY(-5px);
}

.nav-button.v-btn--active {
    transform: translateY(-5px);
}

.button-text {
    font-size: 11px;
    font-weight: 400;
    margin-top: -10px;
    opacity: 0;
    transform: translateY(-10px);
    transition: 0.3s;
    pointer-events: none;
}

.nav-1-btn:hover + .nav-1-text {
    opacity: 0.6;
    transform: translateY(0px);
}

.nav-2-btn:hover + .nav-2-text {
    opacity: 0.6;
    transform: translateY(0px);
}

.nav-3-btn:hover + .nav-3-text {
    opacity: 0.6;
    transform: translateY(0px);
}

.nav-4-btn:hover + .nav-4-text {
    opacity: 0.6;
    transform: translateY(0px);
}

.button-text.active {
    opacity: 0.8;
    transform: translateY(0px);
}

.pinned-playlists {
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: center;
    transform-origin: top center;
    transition:
        transform 0.3s,
        opacity 0.2s;
    overflow-y: auto;
}

.pinned-playlists::-webkit-scrollbar {
    width: 0;
}
</style>
