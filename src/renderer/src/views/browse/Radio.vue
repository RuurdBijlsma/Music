<template>
    <div class="radio">
        <div class="radio-info">
            <h1 class="page-title">{{ radioName }}</h1>

            <h4 class="radio-params" v-if="radioGenres !== ''">{{ radioGenres }}</h4>
            <h4 class="radio-params" v-if="radioName === 'Artist radio'">
                <span v-if="artists.length === 0">Loading artists...</span>
                <artists-span :artists="artists" />
            </h4>

            <p class="radio-stats">
                {{ tracks.length }} Track{{
                    tracks.length === 1 ? "" : "s"
                }} •
                {{ base.approximateDuration(totalDurationMs) }}
            </p>
            <collection-buttons :collection="collection" />
        </div>

        <div v-if="loading" class="text-center mt-10 mb-10">
            Creating radio...
            <v-progress-linear :indeterminate="true" />
        </div>
        <track-list padding-top="20px" :collection="collection" />
    </div>
</template>

<script setup lang="ts">

import { computed, ref, toRaw, watch } from "vue";
import { useBaseStore } from "../../store/base";
import { useRoute } from "vue-router";
import { Item, ItemCollection } from "../../scripts/types";
import TrackList from "../../components/TrackList.vue";
import { useSpotifyApiStore } from "../../store/spotify-api";
import CollectionButtons from "../../components/CollectionButtons.vue";
import ArtistsSpan from "../../components/ArtistsSpan.vue";

const base = useBaseStore();
const route = useRoute();
const spotify = useSpotifyApiStore();

const tracks = ref([] as SpotifyApi.TrackObjectFull[]);
const artists = ref([] as SpotifyApi.ArtistObjectFull[]);

const loading = ref(false);
const radioGenres = computed(() => {
    let info = "";
    if (route.query.hasOwnProperty("seed_genres")) {
        let genres = route.query["seed_genres"] as string;
        info = genres.split(",").map(a => a.toUpperCase()).join(" / ");
    }
    return info;
});

async function refresh() {
    loading.value = true;
    artists.value = [];
    let options: any = route.query;
    for (let key in options) {
        if (!options.hasOwnProperty(key))
            continue;
        if (!isNaN(+options[key])) {
            options[key] = +options[key];
        }
    }

    let radio = await spotify.getRadioTracks(options);
    tracks.value = radio.tracks as SpotifyApi.TrackObjectFull[];
    loading.value = false;

    let artistsIds = radio.seeds.filter(s => s.type.toLowerCase() === "artist").map(s => s.id);
    if (artistsIds.length > 0)
        spotify.getCachedArtists(artistsIds).then(r => {
            artists.value = r;
            console.log(toRaw(r));
        });
}

const radioName = computed(() => {
    let radioName = "Custom Radio";
    if (route.query.hasOwnProperty("seed_genres"))
        radioName = "Genre radio";
    if (route.query.hasOwnProperty("seed_tracks"))
        radioName = "Song radio";
    if (route.query.hasOwnProperty("seed_artists"))
        radioName = "Artist radio";
    console.log(route.query, radioName);
    return radioName;
});

const totalDurationMs = computed(() => tracks.value.reduce((a, b) => a + b.duration_ms, 0));

const collection = computed(() => {
    let context: Item | undefined;
    if (radioName.value === "Artist radio") {
        context = artists.value.length === 0 ? undefined : artists.value[0];
    } else if (radioName.value === "Song radio") {
        context = tracks.value.length === 0 ? undefined : tracks.value[0];
    }
    let prefixName: string = "";
    if (radioName.value === "Artist radio") {
        prefixName = (artists.value.length === 0 ? "" : "\"" + artists.value[0].name + "\" ");
    } else if (radioName.value === "Song radio") {
        prefixName = (tracks.value.length === 0 ? "" : "\"" + tracks.value[0].name + "\" ");
    } else if (radioName.value === "Genre radio") {
        prefixName = "\"" + radioGenres.value + "\" ";
    }

    return {
        id: "radio" + JSON.stringify(route.query),
        tracks: tracks.value ?? [],
        type: "radio",
        context,
        name: prefixName + radioName.value,
        buttonText: radioName.value,
        to: route.fullPath
    } as ItemCollection;
});

refresh();
watch(route, () => {
    if (route.path.startsWith("/radio")) refresh();
});

</script>

<style scoped>
.radio {
    padding: 80px 30px 30px;
}

.radio-info {
    text-align: center;
}

.radio-params {
    opacity: .7;
    font-weight: 500;
}

.radio-stats {
    font-size: 13px;
    font-weight: 400;
    opacity: .7;
}
</style>