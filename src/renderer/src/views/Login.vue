<template>
    <div class="login mt-8">
        <div class="header">
            <h1>Welcome to Ruurd Music</h1>
            <p v-if="!spotifyAuth.hasCredentials">Please fill in your credentials</p>
            <p v-else-if="!spotifyAuth.isLoggedIn">Please log in to Spotify™️</p>
        </div>
        <authentication />
    </div>
</template>

<script lang="ts" setup>
import Authentication from '../components/Authentication.vue'
import { useSpotifyAuthStore } from '../store/spotify-auth'
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const spotifyAuth = useSpotifyAuthStore()
const { isLoggedIn } = storeToRefs(spotifyAuth)
watch(isLoggedIn, () => {
    if (isLoggedIn.value) router.push('/')
})
</script>

<style lang="less" scoped>
.login {
    padding: 30px;
}

.header {
    text-align: center;
    margin-top: 40px;
    margin-bottom: 60px;
}
</style>
