<template>
    <div class="tune">
        <v-divider class="mt-4 mb-4" />
        <h2>Custom radio</h2>
        <v-divider class="mt-4 mb-8" />

        <v-select
            v-model="seedGenres"
            :chips="true"
            :color="ui.themeColor"
            :items="genres"
            :multiple="true"
            class="top-select"
            label="Genres"
        />
        <div v-for="option in options" class="option">
            <v-switch
                v-model="option.active"
                :color="ui.themeColor"
                :inset="true"
                :label="caps(option.name)"
                hide-details
            />
            <p class="description">{{ option.description }}</p>
            <div v-if="option.active" class="input">
                <v-select
                    v-if="option.select"
                    v-model="option.value"
                    :color="ui.themeColor"
                    :items="option.select"
                    :label="option.name"
                    class="select-input"
                    dense
                    outlined
                ></v-select>
                <v-slider
                    v-else
                    v-model="option.value"
                    :color="ui.themeColor"
                    :label="option.name"
                    :max="option.max"
                    :min="option.min"
                    :step="option.step"
                    class="slider-input"
                    dense
                    thumb-label
                ></v-slider>
            </div>
            <v-divider class="mt-3 mb-3" />
        </div>
        <v-btn
            :block="true"
            :color="ui.themeColor"
            class="mt-8"
            small
            variant="tonal"
            @click="generate"
        >
            <v-icon class="mr-2" small>mdi-radio-tower</v-icon>
            Generate custom radio
        </v-btn>
    </div>
</template>

<script lang="ts" setup>
import { useSpotifyApiStore } from '../../store/spotify-api'
import { Ref, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '../../store/UI/UIStore'
import { radioId } from '../../scripts/item-utils'
import { useDialogStore } from '../../store/UI/dialogStore'
import { caps } from '../../scripts/utils'

const spotify = useSpotifyApiStore()
const ui = useUIStore()
const router = useRouter()
const dialog = useDialogStore()

const options: Ref<any> = ref([
    {
        name: 'acousticness',
        description:
            'A confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic.',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: 'danceability',
        description:
            'Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0.0 is least danceable and 1.0 is most danceable.',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: 'energy',
        description:
            'Energy is a measure from 0.0 to 1.0 and represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. For example, death metal has high energy, while a Bach prelude scores low on the scale. Perceptual features contributing to this attribute include dynamic range, perceived loudness, timbre, onset rate, and general entropy.',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: 'instrumentalness',
        description:
            'Predicts whether a track contains no vocals. “Ooh” and “aah” sounds are treated as instrumental in this context. Rap or spoken word tracks are clearly “vocal”. The closer the instrumentalness value is to 1.0, the greater likelihood the track contains no vocal content. Values above 0.5 are intended to represent instrumental tracks, but confidence is higher as the value approaches 1.0.',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: 'liveness',
        description:
            'Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 provides strong likelihood that the track is live.',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: 'loudness',
        description:
            'The overall loudness of a track in decibels (dB). Loudness values are averaged across the entire track and are useful for comparing relative loudness of tracks. Loudness is the quality of a sound that is the primary psychological correlate of physical strength (amplitude).',
        min: -80,
        max: 0,
        step: 0.1,
        value: -40,
        unit: 'dB'
    },
    {
        name: 'popularity',
        description:
            'The popularity of the track. The value will be between 0 and 100, with 100 being the most popular. The popularity is calculated by algorithm and is based, in the most part, on the total number of plays the track has had and how recent those plays are.',
        min: 0,
        max: 100,
        step: 1,
        value: 50
    },
    {
        name: 'speechiness',
        description:
            'Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value. Values above 0.66 describe tracks that are probably made entirely of spoken words. Values between 0.33 and 0.66 describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 0.33 most likely represent music and other non-speech-like tracks.',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: 'tempo',
        description:
            'The overall estimated tempo of a track in beats per minute (BPM). In musical terminology, tempo is the speed or pace of a given piece and derives directly from the average beat duration.',
        min: 1,
        max: 400,
        step: 1,
        value: 100,
        unit: 'bpm'
    },
    {
        name: 'valence',
        description:
            'A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5
    },
    {
        name: 'mode',
        description:
            'Mode indicates the modality (major or minor) of a track, the type of scale from which its melodic content is derived.',
        select: [
            { title: 'Major', value: 1 },
            { title: 'Minor', value: 0 }
        ],
        value: 1
    },
    {
        name: 'key',
        description: 'The key the track is in.',
        select: [
            { title: 'C', value: 0 },
            { title: 'C♯, D♭', value: 1 },
            { title: 'D', value: 2 },
            { title: 'D♯, E♭', value: 3 },
            { title: 'E', value: 4 },
            { title: 'F', value: 5 },
            { title: 'F♯, G♭', value: 6 },
            { title: 'G', value: 7 },
            { title: 'G♯, A♭', value: 8 },
            { title: 'A', value: 9 },
            { title: 'A♯, B♭', value: 10 },
            { title: 'B', value: 11 }
        ],
        value: 4
    }
])
const genres = ref([] as string[])
const seedGenres = ref([] as string[])

async function refresh() {
    genres.value = await spotify.getGenres()
}

refresh()

async function generate() {
    if (seedGenres.value.length > 5) return dialog.addSnack("You can't select more than 5 genres")
    if (seedGenres.value.length === 0) return dialog.addSnack('You have to select at least 1 genre')

    const radio = {} as any
    if (seedGenres.value.length > 0)
        radio.seed_genres = seedGenres.value
            .map((genre) => genre.replace(/ /gi, '-').toLowerCase())
            .join(',')

    for (const option of options.value.filter((t) => t.active))
        radio['target_' + option.name] = option.value

    if (Object.keys(radio).length === 0)
        return dialog.addSnack('Select some options before generating radio')

    radio.id = radioId()

    await router.push({
        path: '/radio',
        query: radio
    })
}
</script>

<style scoped>
.tune {
    padding: 80px 30px 30px;
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
