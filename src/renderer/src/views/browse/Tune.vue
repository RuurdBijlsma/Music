<template>
    <div class="tune">
        <v-divider class="mt-4 mb-4" />
        <h2>Custom radio</h2>
        <v-divider class="mt-4 mb-8" />

        <v-select :chips="true" label="Genres"
                  v-model="seedGenres"
                  :color="base.themeColor"
                  :multiple="true" :items="genres"
                  class="top-select" />
        <div class="option" v-for="option in options">
            <v-switch hide-details :inset="true"
                      :color="base.themeColor"
                      v-model="option.active"
                      :label="base.caps(option.name)" />
            <p class="description">{{ option.description }}</p>
            <div class="input" v-if="option.active">
                <v-select outlined dense
                          :label="option.name"
                          class="select-input"
                          :color="base.themeColor"
                          v-if="option.select"
                          :items="option.select"
                          v-model="option.value"></v-select>
                <v-slider dense :label="option.name"
                          class="slider-input" thumb-label
                          :color="base.themeColor"
                          :min="option.min"
                          :max="option.max"
                          :step="option.step"
                          v-model="option.value"
                          v-else></v-slider>
            </div>
            <v-divider class="mt-3 mb-3" />
        </div>
        <v-btn :block="true" @click="generate" small :color="base.themeColor" class="mt-8" variant="tonal">
            <v-icon small class="mr-2">mdi-radio-tower</v-icon>
            Generate custom radio
        </v-btn>
    </div>
</template>

<script setup lang="ts">
import { useSpotifyApiStore } from "../../store/spotify-api";
import { Ref, ref } from "vue";
import { useBaseStore } from "../../store/base";
import { useRouter } from "vue-router";

const spotify = useSpotifyApiStore();
const base = useBaseStore();
const router = useRouter();

const options: Ref<any> = ref([
    {
        name: "acousticness",
        description: "A confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic.",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: "danceability",
        description: "Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0.0 is least danceable and 1.0 is most danceable.",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: "energy",
        description: "Energy is a measure from 0.0 to 1.0 and represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. For example, death metal has high energy, while a Bach prelude scores low on the scale. Perceptual features contributing to this attribute include dynamic range, perceived loudness, timbre, onset rate, and general entropy.",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: "instrumentalness",
        description: "Predicts whether a track contains no vocals. “Ooh” and “aah” sounds are treated as instrumental in this context. Rap or spoken word tracks are clearly “vocal”. The closer the instrumentalness value is to 1.0, the greater likelihood the track contains no vocal content. Values above 0.5 are intended to represent instrumental tracks, but confidence is higher as the value approaches 1.0.",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: "liveness",
        description: "Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 provides strong likelihood that the track is live.",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: "loudness",
        description: "The overall loudness of a track in decibels (dB). Loudness values are averaged across the entire track and are useful for comparing relative loudness of tracks. Loudness is the quality of a sound that is the primary psychological correlate of physical strength (amplitude).",
        min: -80,
        max: 0,
        step: 0.1,
        value: -40,
        unit: "dB"
    },
    {
        name: "popularity",
        description: "The popularity of the track. The value will be between 0 and 100, with 100 being the most popular. The popularity is calculated by algorithm and is based, in the most part, on the total number of plays the track has had and how recent those plays are.",
        min: 0,
        max: 100,
        step: 1,
        value: 50
    },
    {
        name: "speechiness",
        description: "Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value. Values above 0.66 describe tracks that are probably made entirely of spoken words. Values between 0.33 and 0.66 describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 0.33 most likely represent music and other non-speech-like tracks.",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: "tempo",
        description: "The overall estimated tempo of a track in beats per minute (BPM). In musical terminology, tempo is the speed or pace of a given piece and derives directly from the average beat duration.",
        min: 1,
        max: 400,
        step: 1,
        value: 100,
        unit: "bpm"
    },
    {
        name: "valence",
        description: "A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: "mode",
        description: "Mode indicates the modality (major or minor) of a track, the type of scale from which its melodic content is derived.",
        select: [
            { title: "Major", value: 1 },
            { title: "Minor", value: 0 }
        ],
        value: 1
    },
    {
        name: "key",
        description: "The key the track is in.",
        select: [
            { title: "C", value: 0 },
            { title: "C♯, D♭", value: 1 },
            { title: "D", value: 2 },
            { title: "D♯, E♭", value: 3 },
            { title: "E", value: 4 },
            { title: "F", value: 5 },
            { title: "F♯, G♭", value: 6 },
            { title: "G", value: 7 },
            { title: "G♯, A♭", value: 8 },
            { title: "A", value: 9 },
            { title: "A♯, B♭", value: 10 },
            { title: "B", value: 11 }
        ],
        value: 4
    }
]);
const genres = ref([] as string[]);
const seedGenres = ref([] as string[]);

async function refresh() {
    genres.value = await spotify.getGenres();
}

refresh();

async function generate() {
    if (seedGenres.value.length > 5)
        return base.addSnack("You can't select more than 5 genres");
    if (seedGenres.value.length === 0)
        return base.addSnack("You have to select at least 1 genre");

    let radio = {} as any;
    if (seedGenres.value.length > 0)
        radio.seed_genres = seedGenres.value.map(genre => genre.replace(/ /gi, "-").toLowerCase()).join(",");

    for (let option of options.value.filter(t => t.active))
        radio["target_" + option.name] = option.value;

    if (Object.keys(radio).length === 0)
        return base.addSnack("Select some options before generating radio");

    radio.id = base.radioId();
    console.log("GENERATED", radio);

    await router.push({
        path: "/radio",
        query: radio
    });
}
</script>

<style scoped>
.tune {
    padding: 30px;
    padding-top: 80px;
}

.description {
    opacity: 0.7;
    font-weight: 500;
    font-size: 12px;
}

.input {
    max-width: 400px;
}

.top-select {
    max-width: 400px;
}

.slider-input {
    margin-top: 10px;
}
</style>
