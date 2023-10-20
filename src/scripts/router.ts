import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";

const routes = [
    { path: "/", component: Home },
    { path: "/settings", component: () => import("../views/Settings.vue") },
    { path: "/downloads", component: () => import("../views/Downloads.vue") },
    { path: "/browse", component: () => import("../views/Browse.vue") },
    { path: "/playlist/:name/:id", component: () => import("../views/item/Playlist.vue") },
    { path: "/album/:name/:id", component: () => import("../views/item/Album.vue") },
    { path: "/user/:name?/:id?", component: () => import("../views/item/User.vue") },
    { path: "/artist/:name/:id", component: () => import("../views/item/Artist.vue") },
    { path: "/library/:lib?", component: () => import("../views/Library.vue") },
    { path: "/search", component: () => import("../views/Search.vue") },
];

export default createRouter({
    history: createWebHistory(),
    routes
});