<template>
    <div class="menu">
        <div class="logo">
            <v-img :src="ui.isDark ? iconUrlDark : iconUrlLight" height="30" width="30"></v-img>
            <div>Ruurd Music</div>
        </div>
        <spacer />
        <search-bar></search-bar>
        <spacer />
        <user-menu />
        <spacer />
        <div class="app-buttons" no-drag>
            <v-btn
                class="minimize window-button"
                density="compact"
                variant="plain"
                @click="platform.minimize()"
            >
                <v-icon icon="mdi-window-minimize" />
            </v-btn>
            <v-btn
                class="maximize window-button"
                density="compact"
                variant="plain"
                @click="platform.toggleMaximize()"
            >
                <v-icon icon="mdi-window-restore" />
            </v-btn>
            <v-btn
                class="close window-button"
                density="compact"
                variant="plain"
                @click="platform.close()"
            >
                <v-icon icon="mdi-window-close" />
            </v-btn>
        </div>
    </div>
</template>

<script lang="ts" setup>
import Spacer from '../Spacer.vue'
import SearchBar from '../search/SearchBar.vue'
import UserMenu from './UserMenu.vue'
import { usePlatformStore } from '../../store/electron'
//@ts-ignore
import iconUrlDark from '../../../assets/app-icon/dark-500.png?asset'
//@ts-ignore
import iconUrlLight from '../../../assets/app-icon/light-500.png?asset'
import { useUIStore } from '../../store/UI/UIStore'

const ui = useUIStore()
const platform = usePlatformStore()
</script>

<style lang="less" scoped>
.menu {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 15px;
    font-size: 16px;
    -webkit-app-region: drag;
}

@media (max-width: 930px) {
    .logo {
        display: none !important;
    }
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 300;
}

.app-buttons {
    display: flex;
    margin-top: -15px;
    margin-right: -15px;
}

.app-buttons > .window-button {
    width: 50px;
    height: 35px;
    text-align: center;
    font-size: 13px;
    padding: 6px;
    color: rgba(0, 0, 0, 0.8);
    transition: 0.1s;
}

.dark .app-buttons > .window-button {
    color: rgba(255, 255, 255, 0.7);
}

.dark .app-buttons > .window-button:hover {
    background-color: rgba(255, 255, 255, 0.15);
}

.app-buttons > .window-button:hover {
    background-color: rgba(0, 0, 0, 0.15);
}

.close:hover {
    background-color: #cb2525 !important;
    color: white;
}
</style>
