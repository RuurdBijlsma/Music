<template>
    <div class="menu">
        <v-btn class="menu-button ml-4 mr-4" variant="text" exact to="/">Listen Now</v-btn>
        <v-btn class="menu-button ml-4 mr-4" variant="text" exact to="/playlists">Playlists</v-btn>
        <v-btn class="menu-button ml-4 mr-4" variant="text" exact to="/tracks">Tracks</v-btn>

        <v-menu>
            <template v-slot:activator="{ props }">
                <v-btn class="ml-4 mr-4" variant="text" icon="mdi-chevron-down" v-bind="props"></v-btn>
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

.menu-button {
    text-transform: capitalize;
    font-size: 15px;
}

.menu > a {
    color: rgba(0, 0, 0, 0.8);
    /*opacity: 0.7;*/
}

.small-item {
    font-size: 13px;
    opacity: .7;
    text-transform: uppercase;
}
</style>