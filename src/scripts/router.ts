import {createRouter, createWebHashHistory} from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
    {path: '/', component: Home},
    {path: '/about', component: () => import('../views/About.vue')},
]

export default createRouter({
    history: createWebHashHistory(),
    routes,
})