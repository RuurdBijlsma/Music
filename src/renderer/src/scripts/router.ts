import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { watch } from 'vue'
import { useSpotifyAuthStore } from '../store/spotify-auth'
import { baseDb } from './database'

const routes = [
    { path: '/', component: Home },
    { path: '/settings', component: () => import('../views/Settings.vue') },
    { path: '/browse', component: () => import('../views/browse/Browse.vue') },
    {
        path: '/playlist/:name/:id',
        component: () => import('../views/item/Playlist.vue')
    },
    {
        path: '/album/:name/:id',
        component: () => import('../views/item/Album.vue')
    },
    {
        path: '/user/:name?/:id?',
        component: () => import('../views/item/User.vue')
    },
    {
        path: '/artist/:name/:id',
        component: () => import('../views/item/Artist.vue')
    },
    { path: '/library/:lib?', component: () => import('../views/Library.vue') },
    { path: '/search/:query', component: () => import('../views/Search.vue') },
    { path: '/login', component: () => import('../views/Login.vue') },
    {
        path: '/category/:name/:id',
        component: () => import('../views/browse/Category.vue')
    },
    { path: '/tune', component: () => import('../views/browse/Tune.vue') },
    { path: '/radio', component: () => import('../views/browse/Radio.vue') },
    { path: '/wrapped', component: () => import('../views/Wrapped.vue') }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

watch(router.currentRoute, () => {
    localStorage.lastRoute = router.currentRoute.value.fullPath
})

router.beforeEach(async (to) => {
    const spotifyAuth = useSpotifyAuthStore()
    await baseDb

    if (!spotifyAuth.isLoggedIn && to.path !== '/login') {
        return { path: '/login' }
    }
    return true
})

export default router
