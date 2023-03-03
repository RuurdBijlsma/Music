<template>
    <div class="top-menu">
        <div class="logo">
            <v-img class="logo-img" width="50" src="img/full-black-medium.png"></v-img>
            <h3>Vue Music</h3>
        </div>
        <div class="menu">
            <router-link to="/">Listen Now</router-link>
            <router-link to="/browse">Browse</router-link>
            <router-link to="/artists">Artists</router-link>
            <router-link to="/albums">Albums</router-link>
            <router-link to="/tracks">Tracks</router-link>
            <router-link to="/playlists">Playlists</router-link>
        </div>
        <v-btn icon>
            <v-icon>mdi-face</v-icon>
        </v-btn>
    </div>
</template>

<script setup>
</script>

<style scoped>
.top-menu {
    display: flex;
    flex-direction: row;
    height: 100px;
    justify-content: space-between;
    background-image: linear-gradient(rgba(0, 0, 0, .2), rgba(0, 0, 0, 0));
    align-items: center;
    padding: 15px;
}

.logo {
    display: flex;
    flex-direction: row;
}

.logo-img {
    margin-right: 20px;
}

.menu {
    font-size: 20px;
}

.menu > * {
    margin-left: 20px;
    margin-right: 20px;
}

.menu > a {
    text-decoration: none;
    color: black;
}
.menu > a:hover {
    text-decoration: underline;
}
</style>