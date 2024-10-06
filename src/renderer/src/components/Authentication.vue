<template>
    <v-card :flat="true" color="transparent">
        <v-tabs v-model="tab" :color="ui.themeColor" align-tabs="center">
            <v-tab value="spotify">Spotify Account</v-tab>
            <v-tab value="ruurd-account">Ruurd Account</v-tab>
            <v-tab value="from-file">From File</v-tab>
        </v-tabs>
        <v-window v-model="tab">
            <v-window-item value="spotify">
                <div v-if="spotifyAuth.isLoggedIn" class="logged-in">
                    <v-avatar>
                        <v-img
                            v-if="library.userInfo.avatar"
                            :src="library.userInfo.avatar"
                        ></v-img>
                        <v-icon v-else color="green" icon="mdi-spotify" size="35"></v-icon>
                    </v-avatar>
                    <v-card-text>
                        <h3>{{ library.userInfo.name }}</h3>
                        <p>{{ library.userInfo.mail }}</p>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn :color="ui.themeColor" @click="spotifyAuth.logout()">Logout </v-btn>
                    </v-card-actions>
                </div>
                <template v-else>
                    <v-text-field
                        v-model="spotifyAuth.clientId"
                        :color="ui.themeColor"
                        class="mt-5"
                        density="compact"
                        hide-details
                        label="Spotify client ID"
                        variant="filled"
                    />
                    <v-text-field
                        v-model="spotifyAuth.secret"
                        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        :color="ui.themeColor"
                        :type="showPassword ? 'text' : 'password'"
                        class="mt-5"
                        density="compact"
                        hide-details
                        label="Spotify secret"
                        variant="filled"
                        @click:append="showPassword = !showPassword"
                    />
                    <v-btn
                        v-if="spotifyAuth.hasCredentials && !spotifyAuth.isLoggedIn"
                        class="mt-4"
                        color="green"
                        variant="tonal"
                        @click="spotifyAuth.login()"
                    >
                        <v-icon class="mr-2" color="green" size="25">mdi-spotify </v-icon>
                        Log in
                    </v-btn>
                </template>
            </v-window-item>
            <v-window-item value="from-file">
                <v-btn
                    :color="ui.themeColor"
                    :loading="importFileLoading"
                    variant="tonal"
                    @click="importFromFile"
                >
                    Restore from file
                </v-btn>
            </v-window-item>
            <v-window-item value="ruurd-account">
                <div v-if="ruurdAuth.isLoggedIn" class="logged-in">
                    <v-avatar :color="ui.themeColor">
                        {{ ruurdAuth.credentials.name?.[0] }}
                    </v-avatar>
                    <v-card-text>
                        <h3>{{ ruurdAuth.credentials.name }}</h3>
                        <p>{{ ruurdAuth.credentials.email }}</p>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn :color="ui.themeColor" @click="ruurdAuth.logout()">Logout </v-btn>
                    </v-card-actions>
                </div>
                <v-form v-else @submit.prevent="ruurdLogin">
                    <v-text-field
                        v-model="ruurdAuth.credentials.email"
                        :color="ui.themeColor"
                        class="mt-5"
                        density="compact"
                        hide-details
                        label="Email address"
                        name="email"
                        type="email"
                        variant="filled"
                    />
                    <v-text-field
                        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        :color="ui.themeColor"
                        :type="showPassword ? 'text' : 'password'"
                        class="mt-5"
                        density="compact"
                        hide-details
                        label="Password"
                        name="password"
                        variant="filled"
                        @click:append="showPassword = !showPassword"
                    />
                    <v-btn
                        :color="ui.themeColor"
                        :loading="loginLoading"
                        class="mt-4"
                        prepend-icon="mdi-account"
                        type="submit"
                        variant="tonal"
                    >
                        Log in
                    </v-btn>
                </v-form>
                <div v-if="loginLoading">
                    <p class="sync-txt">Syncing data...</p>
                    <v-progress-linear :indeterminate="true" rounded></v-progress-linear>
                </div>
            </v-window-item>
        </v-window>
    </v-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useLibraryStore } from '../store/library'
import { useSpotifyAuthStore } from '../store/spotify-auth'
import { useRuurdAuthStore } from '../store/ruurd-auth'
import { useUIStore } from '../store/UI/UIStore'
import { useDialogStore } from '../store/UI/dialogStore'
import { useBackupStore } from '../store/backupStore'

const dialog = useDialogStore()
const backup = useBackupStore()
const ui = useUIStore()
const library = useLibraryStore()
const spotifyAuth = useSpotifyAuthStore()
const ruurdAuth = useRuurdAuthStore()

const tab = ref('spotify')
const showPassword = ref(false)
const loginLoading = ref(false)

const importFileLoading = ref(false)

async function importFromFile() {
    importFileLoading.value = true
    const result = await backup.importFromFile()
    if (result) {
        dialog.addSnack('Restored backup from file')
    } else {
        dialog.addSnack('Restore from file failed')
    }
    importFileLoading.value = false
}

async function ruurdLogin(e: SubmitEvent) {
    loginLoading.value = true
    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const email = formData.get('email')
    const password = formData.get('password')

    if (email === null || password === null) return

    const fetchOptions = {
        method: 'POST',
        body: formData
    }

    try {
        const userResponse = await fetch('https://api.ruurd.dev/auth', fetchOptions)

        if (!userResponse.ok) {
            dialog.addSnack('Login failed: ' + userResponse.statusText)
            return
        }
        const user = await userResponse.json()
        ruurdAuth.credentials.email = email.toString()
        ruurdAuth.credentials.password = password.toString()
        ruurdAuth.credentials.name = user.name
        await backup.importFromServer()
    } catch (e: any) {
        dialog.addSnack('Login failed: ' + e.message)
    }
    loginLoading.value = false
}
</script>

<style lang="less" scoped>
.logged-in {
    display: flex;
    align-items: center;
}

.logged-in h3 {
    text-align: left;
    font-weight: 500;
}

.sync-txt {
    text-align: center;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 10px;
    font-size: 13px;
}
</style>
