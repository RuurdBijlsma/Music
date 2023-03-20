<template>
    <div class="user" v-if="user">
        <div class="user-info">
            <glow-image
                :effect-scale="1.4"
                rounding="125px"
                :width="250"
                :height="250"
                :src="userImage"/>
            <h1 class="mt-14">{{ user.display_name }}</h1>
            <p>{{ followerString }}</p>
        </div>
        <div class="sub-header mt-6 mb-5">
            <v-divider/>
            <p class="top-tracks-text ml-4 mr-4">Saved Playlists</p>
            <v-divider/>
        </div>
        <div>
            <horizontal-scroller v-if="playlists" class="mt-4 albums-grid">
                <template v-for="(playlist, i) in playlists">
                    <highlight-card v-if="i === 0" :item="playlist" class="mr-4"/>
                    <item-card :item="playlist" class="mr-4" v-else/>
                </template>
            </horizontal-scroller>
        </div>
    </div>
</template>

<script setup lang="ts">
import {useSpotifyStore} from "../../scripts/store/spotify";
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useBaseStore} from "../../scripts/store/base";
import GlowImage from "../../components/GlowImage.vue";
import ItemCard from "../../components/ItemCard.vue";
import HighlightCard from "../../components/HighlightCard.vue";
import HorizontalScroller from "../../components/HorizontalScroller.vue";

const route = useRoute()
const base = useBaseStore();
const spotify = useSpotifyStore();

const user = ref(null as null | SpotifyApi.UserProfileResponse)
const playlists = ref(null as null | SpotifyApi.PlaylistObjectSimplified[]);

let loadedId = route.params.id as string;
reloadUser()

watch(route, async () => {
    if (route.path.startsWith('/user') && typeof route.params.id === 'string' && route.params.id !== loadedId) {
        loadedId = route.params.id;
        reloadUser();
        let el = document.querySelector('.router-view');
        if (el !== null)
            el.scrollTop = 0;
    }
})

const userImage = computed(() => {
    if (user.value !== null && user.value.images !== undefined && user.value.images.length > 0) {
        return user.value.images[0].url;
    }
    return `img/user/${Math.ceil(Math.random() * 7)}.png`
})

function reloadUser() {
    let id = loadedId;
    if(id === '')
        id = spotify.userInfo.id
    spotify.api.getUser(id).then(r => {
        user.value = r;
        console.log("User", r);
    });
    spotify.api.getUserPlaylists(id).then(r => {
        playlists.value = r.items;
        console.log("getUserPlaylists", r);
    });
}
const followerString = computed(() => {
    if (user.value === null||user.value.followers===undefined) return '0 followers';
    if (user.value.followers.total > 1000000) {
        let followerMillions = Math.round(user.value.followers.total / 1000000);
        return followerMillions + 'M follower' + (followerMillions === 1 ? '' : 's');
    }
    return user.value.followers.total.toLocaleString() + ' follower' + (user.value.followers.total === 1 ? '' : 's');
})

</script>

<style scoped lang="scss">
.user {
    padding-top: 100px;
    padding-bottom: 100px;
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: 300;
    padding: 20px;
}

.user-info > h1 {
    font-weight: 400;
}

.user-url {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
}

.user-url:hover {
    text-decoration: underline;
}

.user-stats {
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

.top-tracks {

}

.top-tracks-text {
    text-align: center;
    opacity: .7;
    text-transform: uppercase;
    font-weight: 400;
    font-size: 13px;
    white-space: nowrap;
}

.sub-header {
    display: flex;
    align-items: center;
}

.track-list-item.odd-item {
    background-color: rgba(0, 0, 0, 0.07);
}

.dark .track-list-item.odd-item {
    background-color: rgba(255, 255, 255, 0.05);
}
</style>