<template>
    <div class="menu">
        <router-link active-class="active-link" exact to="/">Listen Now</router-link>
        <router-link active-class="active-link" exact to="/playlists">Playlists</router-link>
        <router-link active-class="active-link" exact to="/tracks">Tracks</router-link>

        <v-menu>
            <template v-slot:activator="{ props }">
                <v-btn variant="text" icon="mdi-chevron-down" v-bind="props"></v-btn>
            </template>

            <v-list density="compact">
                <v-list-item to="/browse">
                    <template v-slot:prepend>
                        <v-icon>mdi-playlist-plus</v-icon>
                    </template>
                    <v-list-item-title>Browse</v-list-item-title>
                </v-list-item>
                <v-list-item to="/artists">
                    <template v-slot:prepend>
                        <v-icon>mdi-microphone</v-icon>
                    </template>
                    <v-list-item-title>Artists</v-list-item-title>
                </v-list-item>
                <v-list-item to="/albums">
                    <template v-slot:prepend>
                        <v-icon>mdi-album</v-icon>
                    </template>
                    <v-list-item-title>Albums</v-list-item-title>
                </v-list-item>
                <v-divider class="mt-2 mb-2"></v-divider>
                <v-list-item to="/downloads">
                    <v-list-item-title class="small-item">Downloads</v-list-item-title>
                </v-list-item>
                <v-list-item to="/settings">
                    <v-list-item-title class="small-item">Settings</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
</template>

<script setup>

</script>

<style scoped>

.menu {
    display: flex;
    flex-direction: row;
    height: 100px;
    justify-content: center;
    align-items: center;
    padding: 15px;
    font-size: 16px;
}

.menu > * {
    margin-left: 20px;
    margin-right: 20px;
}

.menu > a {
    color: rgba(0, 0, 0, 0.9);
    text-decoration: none;
    opacity: 0.7;
    font-weight: 300;
}

.menu > a:hover {
    text-decoration: underline;
}

.active-link {
    opacity: 1 !important;
    font-weight: 400 !important;
}

.small-item {
    font-size: 13px;
    opacity: .7;
    text-transform: uppercase;
}
</style>