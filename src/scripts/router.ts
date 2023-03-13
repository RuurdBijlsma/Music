import {createRouter, createWebHashHistory} from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
    {path: '/', component: Home},
    {path: '/settings', component: () => import('../views/Settings.vue')},
    {path: '/library', component: () => import('../views/Library.vue')},
    {path: '/browse', component: () => import('../views/Browse.vue')},
    {path: '/playlists', component: () => import('../views/Playlists.vue')},
    {
        path: '/playlist/:name/:id',
        name: 'Playlist',
        component: () => import('../views/Playlist.vue')
    },
]

export default createRouter({
    history: createWebHashHistory(),
    routes,
})