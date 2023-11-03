<template>
    <v-card :flat="true" color="transparent">
        <v-tabs v-model="tab" :color="base.themeColor" align-tabs="center">
            <v-tab value="spotify">Spotify Account</v-tab>
            <v-tab value="ruurd-account">Ruurd Account</v-tab>
        </v-tabs>
        <v-window v-model="tab">
            <v-window-item value="spotify">
                <v-text-field
                    v-model="spotifyAuth.clientId"
                    class="mt-5"
                    density="compact"
                    hide-details
                    label="Spotify client ID"
                    variant="filled"
                    :color="base.themeColor"
                />
                <v-text-field
                    v-model="spotifyAuth.secret"
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    :type="showPassword ? 'text' : 'password'"
                    class="mt-5"
                    density="compact"
                    hide-details
                    label="Spotify secret"
                    variant="filled"
                    @click:append="showPassword = !showPassword"
                    :color="base.themeColor"
                />
                <v-btn
                    v-if="spotifyAuth.hasCredentials && !spotifyAuth.isLoggedIn"
                    class="mt-4"
                    color="green"
                    variant="tonal"
                    @click="spotifyAuth.login()"
                >
                    <v-icon class="mr-2" color="green" size="25"
                        >mdi-spotify
                    </v-icon>
                    Log in
                </v-btn>
                <div v-if="spotifyAuth.isLoggedIn" class="mt-3">
                    <v-avatar color="primary">
                        <v-img
                            v-if="library.userInfo.avatar"
                            :src="library.userInfo.avatar"
                        ></v-img>
                        <span v-else>{{ library.userInfo.name[0] }}</span>
                    </v-avatar>
                    <span class="ml-4"
                        >You are logged in {{ library.userInfo.name }}</span
                    >
                </div>
            </v-window-item>
            <v-window-item value="ruurd-account">
                <div v-if="ruurdAuth.isLoggedIn" class="logged-in">
                    <v-avatar :color="base.themeColor">
                        {{ ruurdAuth.credentials.name[0] }}
                    </v-avatar>
                    <v-card-text>
                        <h3>{{ ruurdAuth.credentials.name }}</h3>
                        <p>{{ ruurdAuth.credentials.email }}</p>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            :color="base.themeColor"
                            @click="ruurdAuth.logout()"
                            >Logout
                        </v-btn>
                    </v-card-actions>
                </div>
                <v-form v-else @submit.prevent="ruurdLogin">
                    <v-text-field
                        v-model="ruurdAuth.credentials.email"
                        name="email"
                        type="email"
                        class="mt-5"
                        density="compact"
                        hide-details
                        label="Email address"
                        variant="filled"
                        :color="base.themeColor"
                    />
                    <v-text-field
                        name="password"
                        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        :type="showPassword ? 'text' : 'password'"
                        class="mt-5"
                        density="compact"
                        hide-details
                        label="Password"
                        variant="filled"
                        @click:append="showPassword = !showPassword"
                        :color="base.themeColor"
                    />
                    <v-btn
                        class="mt-4"
                        prepend-icon="mdi-account"
                        variant="tonal"
                        :color="base.themeColor"
                        type="submit"
                        :loading="loginLoading"
                    >
                        Log in
                    </v-btn>
                </v-form>
                <div v-if="loginLoading">
                    <p class="sync-txt">Syncing data...</p>
                    <v-progress-linear
                        rounded
                        :indeterminate="true"
                    ></v-progress-linear>
                </div>
            </v-window-item>
        </v-window>
    </v-card>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useLibraryStore } from "../store/library";
import { useSpotifyAuthStore } from "../store/spotify-auth";
import { useBaseStore } from "../store/base";
import { useRuurdAuthStore } from "../store/ruurd-auth";
import { DataExport } from "../scripts/types";

const base = useBaseStore();
const library = useLibraryStore();
const spotifyAuth = useSpotifyAuthStore();
const ruurdAuth = useRuurdAuthStore();

const tab = ref("spotify");
const showPassword = ref(false);
const loginLoading = ref(false);

async function ruurdLogin(e: SubmitEvent) {
    loginLoading.value = true;
    let form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");

    if (email === null || password === null) return;

    const fetchOptions = {
        method: "POST",
        body: formData,
    };

    try {
        let userResponse = await fetch(
            "https://api.ruurd.dev/auth",
            fetchOptions,
        );

        if (!userResponse.ok) {
            base.addSnack("Login failed: " + userResponse.statusText);
            return;
        }
        let user = await userResponse.json();
        ruurdAuth.credentials.email = email.toString();
        ruurdAuth.credentials.password = password.toString();
        ruurdAuth.credentials.name = user.name;

        let data = await (
            await fetch(
                "https://api.ruurd.dev/drive/get/" +
                    encodeURI("ruurd-music-data.json"),
                fetchOptions,
            )
        ).json();
        await base.importData(data as DataExport);
        if (!spotifyAuth.isLoggedIn) {
            await spotifyAuth.loadValues();
        }

        if (!spotifyAuth.isLoggedIn) {
            tab.value = "spotify";
        }
    } catch (e: any) {
        base.addSnack("Login failed: " + e.message);
    }
    loginLoading.value = false;
}
</script>

<style lang="less" scoped>
.logged-in {
    display: flex;
    align-items: center;
}

.logged-in h3 {
    text-align: left;
}

.sync-txt {
    text-align: center;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 10px;
    font-size: 13px;
}
</style>
