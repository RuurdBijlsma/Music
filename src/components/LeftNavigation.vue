<template>
    <div class="left-nav">
        <v-btn class="nav-1-btn nav-button"
               :icon="route.path === '/' ? 'mdi-play-box' : 'mdi-play-box-outline'"
               rounded
               variant="text"
               to="/"></v-btn>
        <span class="button-text nav-1-text"
              :class="{active: route.path === '/'}">Listen Now</span>
        <v-btn class="nav-2-btn nav-button"
               :icon="route.path === '/browse' ? 'mdi-library' : 'mdi-library-outline'"
               rounded
               variant="text"
               to="/browse"></v-btn>
        <span class="button-text nav-2-text"
              :class="{active: route.path === '/browse'}">Browse</span>
        <v-btn class="nav-3-btn nav-button"
               variant="text"
               :icon="route.path === '/library' ? 'mdi-music-note' : 'mdi-music-note-outline'"
               rounded
               to="/library" />
        <span class="button-text nav-3-text"
              :class="{active: route.path === '/library'}">Library</span>
        <v-btn class="nav-4-btn nav-button"
               :style="{
                            transform: playlistsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                       }"
               variant="text"
               @click="playlistsExpanded = !playlistsExpanded"
               :icon="playlistsExpanded ? 'mdi-chevron-up' : 'mdi-playlist-play'"
               rounded />
        <span class="button-text nav-4-text"
              :class="{active: playlistsExpanded}">Playlists</span>
        <div class="pinned-playlists" :style="{
                    opacity: playlistsExpanded ? '1' : '0',
                    transform: playlistsExpanded ? 'scaleY(1) translateY(0%)' : 'scaleY(.7)',
                    pointerEvents: playlistsExpanded ? 'auto' : 'none'
                }">
            <v-tooltip location="right" :text="playlist.name" v-for="playlist in library.saved.playlist">
                <template v-slot:activator="{ props }">
                    <v-btn variant="text" v-bind="props" height="64" max-width="64">
                        <router-link :to="base.itemUrl(playlist)">
                            <v-avatar rounded size="50">
                                <v-img :src="base.itemImage(playlist)"></v-img>
                            </v-avatar>
                        </router-link>
                    </v-btn>
                </template>
            </v-tooltip>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref } from "vue";
import { useBaseStore } from "../scripts/store/base";
import { useLibraryStore } from "../scripts/store/library";

const route = useRoute();
const base = useBaseStore();
const library = useLibraryStore();
const playlistsExpanded = ref(false);
</script>

<style scoped lang="scss">


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
    transition: .3s;
    pointer-events: none;
}

.nav-1-btn:hover + .nav-1-text {
    opacity: .6;
    transform: translateY(0px);
}

.nav-2-btn:hover + .nav-2-text {
    opacity: .6;
    transform: translateY(0px);
}

.nav-3-btn:hover + .nav-3-text {
    opacity: .6;
    transform: translateY(0px);
}

.nav-4-btn:hover + .nav-4-text {
    opacity: .6;
    transform: translateY(0px);
}

.button-text.active {
    opacity: .8;
    transform: translateY(0px);
}

.pinned-playlists {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    transform-origin: top center;
    transition: transform 0.3s, opacity 0.2s;
    overflow-y: auto;
}

.pinned-playlists::-webkit-scrollbar {
    width: 0;
}
</style>