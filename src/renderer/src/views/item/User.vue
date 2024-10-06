<template>
    <div v-if="user" class="user">
        <div class="user-info">
            <glow-image
                :effect-scale="1.4"
                :height="250"
                :src="userImage"
                :width="250"
                rounding="125px"
            />
            <h1 class="mt-14">{{ user.display_name }}</h1>
            <p>{{ followerString }}</p>
        </div>
        <div class="sub-header mt-6 mb-5">
            <v-divider />
            <p class="top-tracks-text ml-4 mr-4">Saved Playlists</p>
            <v-divider />
        </div>
        <div class="playlist-grid">
            <template v-for="playlist in playlists">
                <item-card :item="playlist" />
            </template>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useLibraryStore } from '../../store/library'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GlowImage from '../../components/GlowImage.vue'
import ItemCard from '../../components/item/ItemCard.vue'
import { useSpotifyApiStore } from '../../store/spotify-api'
import { randomUser } from '../../scripts/image-sources'

const route = useRoute()
const library = useLibraryStore()
const spotify = useSpotifyApiStore()

const user = ref(null as null | SpotifyApi.UserProfileResponse)
const playlists = ref(null as null | SpotifyApi.PlaylistObjectFull[])

let loadedId = route.params.id as string
reloadUser()

watch(route, async () => {
    if (
        route.path.startsWith('/user') &&
        typeof route.params.id === 'string' &&
        route.params.id !== loadedId
    ) {
        loadedId = route.params.id
        reloadUser()
        const el = document.querySelector('.router-view')
        if (el !== null) el.scrollTop = 0
    }
})

const userImage = computed(() => {
    if (user.value !== null && user.value.images !== undefined && user.value.images.length > 0) {
        return user.value.images[0].url
    }
    return randomUser()
})

function reloadUser() {
    let id = loadedId
    if (id === '') id = library.userInfo.id
    spotify.getUser(id).then((r) => {
        user.value = r
    })
    spotify.getUserPlaylists(id).then((r) => {
        playlists.value = r.items as SpotifyApi.PlaylistObjectFull[]
    })
}

const followerString = computed(() => {
    if (
        user.value === null ||
        user.value.followers === undefined ||
        user.value.followers.total === 0
    )
        return 'No followers'
    if (user.value.followers.total > 1000000) {
        const followerMillions = Math.round(user.value.followers.total / 1000000)
        return followerMillions + 'M follower' + (followerMillions === 1 ? '' : 's')
    }
    return (
        user.value.followers.total.toLocaleString() +
        ' follower' +
        (user.value.followers.total === 1 ? '' : 's')
    )
})
</script>

<style lang="less" scoped>
.playlist-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    justify-content: space-evenly;
    align-items: start;
}

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
    opacity: 0.7;
}

.top-tracks-text {
    text-align: center;
    opacity: 0.7;
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
