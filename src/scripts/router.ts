import {createRouter, createWebHashHistory} from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
    {path: '/', component: Home},
    {path: '/settings', component: () => import('../views/Settings.vue')},
    {path: '/browse', component: () => import('../views/Browse.vue')},
    {path: '/playlists', component: () => import('../views/Playlists.vue')},
    {path: '/playlist/:name/:id', component: () => import('../views/Playlist.vue')},
    {path: '/album/:name/:id', component: () => import('../views/Album.vue')},
    {path: '/library/:lib?', component: () => import('../views/Library.vue')},
]

export default createRouter({
    history: createWebHashHistory(),
    routes,
})