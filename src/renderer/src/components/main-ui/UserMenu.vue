<template>
    <v-menu
        v-model="dropdownOpen"
        :close-on-back="true"
        :close-on-content-click="false"
        location="bottom"
    >
        <template #activator="{ props }">
            <v-btn
                class="account-button ml-2 mr-2"
                density="compact"
                no-drag
                rounded
                size="30"
                v-bind="props"
                variant="tonal"
            >
                <v-img :image="library.userInfo.avatar"></v-img>
                <v-icon size="20">mdi-account</v-icon>
            </v-btn>
        </template>

        <v-list density="compact">
            <v-list-item v-if="spotifyAuth.isLoggedIn" to="/user" two-line>
                <div class="list-link">
                    <v-avatar
                        :image="library.userInfo.avatar || randomUser()"
                        alt="User Avatar"
                        class="mr-3"
                        icon="mdi-account"
                        variant="tonal"
                    />
                    <div>
                        <v-list-item-title>{{ library.userInfo.name }} </v-list-item-title>
                        <v-list-item-subtitle>{{ library.userInfo.mail }} </v-list-item-subtitle>
                    </div>
                </div>
            </v-list-item>
            <v-divider class="mt-2"></v-divider>
            <v-list-item>
                <div class="theme-flex">
                    <v-list-item-title class="theme-title"> Theme </v-list-item-title>

                    <v-chip-group
                        v-model="ui.themeString"
                        :color="ui.themeColor"
                        class="chip-group"
                        mandatory
                    >
                        <v-chip
                            v-for="opt in ui.themeOptions.slice(0, 3)"
                            :value="opt"
                            class="theme-chip"
                            >{{ caps(opt) }}
                        </v-chip>
                    </v-chip-group>
                </div>
            </v-list-item>
            <v-divider class="mb-2"></v-divider>
            <v-list-item to="/wrapped">
                <v-list-item-title class="small-item">
                    <v-icon class="mr-2" icon="mdi-chart-timeline-variant" />
                    Statistics
                </v-list-item-title>
            </v-list-item>
            <v-list-item to="/settings">
                <v-list-item-title class="small-item">
                    <v-icon class="mr-2" icon="mdi-cog" />
                    Settings
                </v-list-item-title>
            </v-list-item>
            <v-list-item @click="spotifyAuth.logout">
                <v-list-item-title class="small-item">
                    <v-icon class="mr-2" icon="mdi-logout" />
                    Logout
                </v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script lang="ts" setup>
import { useLibraryStore } from '../../store/library'
import { useSpotifyAuthStore } from '../../store/spotify-auth'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { randomUser } from '../../scripts/image-sources'
import { useUIStore } from '../../store/UI/UIStore'
import { caps } from '../../scripts/utils'

const library = useLibraryStore()
const spotifyAuth = useSpotifyAuthStore()
const route = useRoute()
const theme = useTheme()
const ui = useUIStore()

const dropdownOpen = ref(false)

watch(route, () => {
    dropdownOpen.value = false
})

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.theme === 'system') {
        if (e.matches) {
            // dark mode
            theme.global.name.value = 'dark'
        } else {
            // light mode
            theme.global.name.value = 'light'
        }
    }
})
</script>

<style lang="less" scoped>
.small-item {
    font-size: 13px;
    opacity: 0.7;
    text-transform: uppercase;
}

.list-link {
    display: flex;
}

.chip-group {
    display: flex;
    justify-content: space-between;
}

.theme-chip {
    margin-right: 5px !important;
    margin-left: 5px !important;
}

.theme-title {
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 300;
    opacity: 0.7;
    text-align: center;
}
</style>
