# Ruurd Music

Music player built with Electron, Vue 3, and Vuetify.

-   Listen to your Spotify library without ads, no premium account needed.
-   Add YouTube tracks to your liked tracks, in case they're not available on Spotify.
-   MP3 files with album art and metadata are stored for every track, so you can take them anywhere.
-   Includes Spotify features such as:
    -   Track and artist radio
    -   Access discover weekly and other discovery playlists
    -   Curated homepage, showing relevant playlists, recently played, recommended content, and new releases.
    -   Browse categories, such as workout, where you can find many workout playlists
-   Generate a custom radio, based on given genres and many more options

## How to use

1. Get the latest release for your OS from https://github.com/RuurdBijlsma/Music/releases

2. Create a Spotify api project with one of the redirect urls being: http://localhost:38900

    - Explanation: https://developer.spotify.com/documentation/web-api

3. On startup of the application fill in your api keys and log in.

### Extra installation steps, only for Linux

1. When using Arch, install `libxcrypt-compat`
2. Make sure `ffmpeg` is in your PATH

### Liked tracks

![Liked tracks](/.gh/liked-tracks.png?raw=true 'Homepage')

### Light and dark theme support

![Homepage](/.gh/light-theme.png?raw=true 'Home page')

### Playlist page

![Playlist tracks](/.gh/playlist.png?raw=true 'Playlist')

### Search

#### Suggestions

![Search suggestions](/.gh/search.png?raw=true 'Search suggestions')

#### Search includes liked tracks, Spotify tracks, playlists, albums, artists and YouTube tracks.

![Search](/.gh/search-2.png?raw=true 'Search page')

### Artist page

![Artist page](/.gh/artist.png?raw=true 'Artist page')

### Browse page

![Browse tracks](/.gh/browse.png?raw=true 'Browse')

### Custom radio generator

![Custom radio generator](/.gh/radio-gen.png?raw=true 'Custom radio generator')
