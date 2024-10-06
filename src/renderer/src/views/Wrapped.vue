<template>
    <div class="wrapped">
        <h1>Your Music Wrapped</h1>
        <v-divider class="mt-6 mb-4" />

        <v-list class="stat-list" rounded>
            <v-list-item prepend-icon="mdi-clock-time-eight-outline">
                You listened for
                {{ constStats.listenMinutes.toLocaleString() }} minutes or about
                {{ Math.round(constStats.listenMinutes / 60) }}
                hours.
            </v-list-item>
            <v-list-item prepend-icon="mdi-music-note-plus">
                You listened to
                {{ constStats.listenCount.toLocaleString() }} tracks.
            </v-list-item>
            <v-list-item prepend-icon="mdi-thumb-down-outline">
                You skipped to {{ constStats.skips.toLocaleString() }} tracks.
            </v-list-item>
        </v-list>

        <v-divider class="mt-5 mb-5" />

        <template v-if="minutesChart">
            <h3 class="subtitle">{{ minutesChart.dataLabel }}</h3>
            <line-chart :chart-data="minutesChart" type="line" />
        </template>

        <v-divider class="mt-5 mb-5" />

        <h2 class="subtitle little-bigger">
            <v-icon class="mr-4">mdi-account-music-outline</v-icon>
            Top Artists
        </h2>
        <v-list class="stat-list">
            <div class="item-stat pa-4">
                <p class="minutes-stat">Artist</p>
                <p class="minutes-stat align-right">Listened minutes</p>
            </div>
            <template v-for="({ artist, listenMinutes, history }, i) of artistsTop">
                <v-list-item
                    rounded
                    @click.right="dialog.setContextMenuItem($event as MouseEvent, artist)"
                >
                    <v-list-item-title class="item-stat">
                        <p class="item-rank">{{ i + 1 }}</p>
                        <v-avatar
                            :image="itemImage(artist as SpotifyApi.ArtistObjectFull)"
                            size="36px"
                        />
                        <router-link :to="itemUrl(artist)" class="flex-grow-1" no-style
                            >{{ artist.name }}
                        </router-link>
                        <p class="minutes-stat align-right">
                            <span class="font-weight-bold">{{
                                listenMinutes.toLocaleString()
                            }}</span>
                            mins
                        </p>
                        <v-btn
                            density="compact"
                            icon="mdi-chart-line-variant"
                            variant="text"
                            @click="toggleChart(artist.id)"
                        />
                    </v-list-item-title>
                </v-list-item>
                <div v-if="expandedArtists.has(artist.id)">
                    <line-chart
                        :chart-data="artistChart(`Minutes listened to ${artist.name}`, history)"
                    />
                </div>
            </template>
        </v-list>

        <v-divider class="mt-5 mb-5" />

        <h2 class="subtitle little-bigger">
            <v-icon class="mr-4">mdi-thumb-up-outline</v-icon>
            Top Tracks
        </h2>
        <div>
            <div class="item-stat mb-2">
                <p class="minutes-stat">Track</p>
                <p class="minutes-stat">Listened minutes</p>
            </div>
            <div
                v-for="({ track, listenMinutes }, i) of tracksTop"
                :class="{
                    'odd-item': !isActive(track.id) && i % 2 === 0,
                    active: isActive(track.id)
                }"
                class="item-stat track-list-item-parent"
            >
                <p class="item-rank">{{ i + 1 }}</p>
                <track-list-item
                    :collection="collection"
                    :index="i"
                    :track="track"
                    class="track-list-item"
                />
                <p class="minutes-stat">
                    <span class="font-weight-bold">
                        {{ listenMinutes.toLocaleString() }}
                    </span>
                    mins
                </p>
            </div>
        </div>

        <v-divider class="mt-5 mb-5" />
        <h2 class="subtitle little-bigger">
            <v-icon class="mr-4">mdi-chart-line-variant</v-icon>
            Music taste over time
        </h2>
        <v-chip-group
            v-model="shownCharts"
            :color="ui.themeColor"
            :mandatory="true"
            :multiple="true"
            class="mb-5"
        >
            <v-chip v-for="chart in charts">{{ chart.dataLabel }}</v-chip>
        </v-chip-group>
        <template v-for="(chart, i) in charts">
            <div v-if="shownCharts.includes(i)">
                <h3 class="subtitle">{{ chart.dataLabel }}</h3>
                <line-chart :chart-data="chart" class="mb-5" type="line" />
            </div>
        </template>

        <v-divider class="mt-5 mb-5" />

        <h2 class="subtitle little-bigger">
            <v-icon class="mr-4">mdi-thumb-down-outline</v-icon>
            Most skipped tracks
        </h2>
        <div class="mb-10">
            <div class="item-stat mb-2">
                <p class="minutes-stat">Track</p>
                <p class="minutes-stat">Skip percentage</p>
            </div>
            <div
                v-for="({ track, skipPercentage }, i) of tracksSkip"
                :class="{
                    'odd-item': !isActiveSkip(track.id) && i % 2 === 0,
                    active: isActiveSkip(track.id)
                }"
                class="item-stat track-list-item-parent"
            >
                <p class="item-rank">{{ i + 1 }}</p>
                <track-list-item
                    :collection="skipCollection"
                    :index="i"
                    :track="track"
                    class="track-list-item"
                />
                <p v-if="skipPercentage !== undefined" class="minutes-stat">
                    <span class="font-weight-bold">
                        {{ skipPercentage.toLocaleString() }}
                    </span>
                    %
                </p>
            </div>
        </div>
        <h3 class="subtitle">Wrapped settings</h3>
        <v-text-field
            v-model="trackLimit"
            :color="ui.themeColor"
            :max="500"
            :min="0"
            hide-details
            label="Shown track limit"
            type="number"
            @change="generate"
        />
        <v-text-field
            v-model="artistLimit"
            :color="ui.themeColor"
            :max="500"
            :min="0"
            hide-details
            label="Shown artist limit"
            type="number"
            @change="generate"
        />
    </div>
</template>

<script lang="ts" setup>
import LineChart from '../components/LineChart.vue'
import { computed, ref } from 'vue'
import { useStatsStore } from '../store/player/playStats'
import { ArtistStat, ChartData, ItemCollection, TrackStat } from '../scripts/types'
import { useUIStore } from '../store/UI/UIStore'
import { useSpotifyApiStore } from '../store/spotify-api'
import TrackListItem from '../components/track-list/TrackListItem.vue'
import { usePlayerStore } from '../store/player/player'
import { useDialogStore } from '../store/UI/dialogStore'
import { itemImage, itemUrl } from '../scripts/item-utils'
import { caps } from '../scripts/utils'

const stats = useStatsStore()
const dialog = useDialogStore()
const ui = useUIStore()
const spotify = useSpotifyApiStore()
const player = usePlayerStore()

const constStats = ref({
    skips: 0,
    listenCount: 0,
    listenMinutes: 0
})
const minutesChart = ref(null as ChartData | null)
const charts = ref([] as ChartData[])
const shownCharts = ref([2, 9, 11])

const trackLimit = ref(10)
const artistLimit = ref(5)

const artistsTop = ref([] as ArtistStat[])
const tracksTop = ref([] as TrackStat[])
const tracksSkip = ref([] as TrackStat[])
const expandedArtists = ref(new Set<string>())

function toggleChart(artistId: string) {
    if (expandedArtists.value.has(artistId)) {
        expandedArtists.value.delete(artistId)
    } else {
        expandedArtists.value.add(artistId)
    }
}

function artistChart(label: string, history: { [key: string]: number }) {
    const statHistory = Object.entries(history)
        .map((x) => [new Date(x[0]), x[1]])
        .sort((a, b) => (a[0] > b[0] ? 1 : -1)) as [Date, number][]
    return {
        labels: statHistory.map((k) => k[0]),
        values: statHistory.map((k) => k[1]),
        yAxis: 'Minutes',
        dataLabel: label
    }
}

async function generate() {
    const { topArtists, topTracks, skipTracks, statistics } = await stats.generateWrapStats(
        trackLimit.value,
        artistLimit.value
    )

    const artists = await Promise.all(
        topArtists.map((a) =>
            a.id.startsWith('yt-')
                ? (a.artist as SpotifyApi.ArtistObjectFull)
                : spotify.getArtist(a.id, true)
        )
    )
    artistsTop.value = artists.map((artist, i) => {
        topArtists[i].artist = artist
        stats.augmentHistoryMinutes(topArtists[i].history, 0)
        return topArtists[i]
    })
    tracksTop.value = topTracks
    tracksSkip.value = skipTracks

    constStats.value = {
        skips: statistics.skips,
        listenCount: statistics.listenCount,
        listenMinutes: statistics.listenMinutes
    }

    const statHistory = Object.entries(statistics.historyMinutes)
        .map((x) => [new Date(x[0]), x[1]])
        .sort((a, b) => (a[0] > b[0] ? 1 : -1)) as [Date, number][]
    minutesChart.value = {
        labels: statHistory.map((k) => k[0]),
        values: statHistory.map((k) => k[1]),
        yAxis: 'Minutes',
        dataLabel: 'Minutes listened'
    }

    const skipKeys = ['historyMinutes', 'listenMinutes', 'listenCount', 'skips']
    charts.value = []
    for (const key in statistics) {
        if (skipKeys.includes(key)) continue
        const data: { [key: string]: { sum: number; minutes: number } } = statistics[key]
        const name = caps(key).replaceAll('_', ' ')
        charts.value.push({
            labels: Object.keys(data).map((k) => new Date(k)),
            values: Object.values(data).map((v) => v.sum / v.minutes),
            yAxis: name,
            dataLabel: `${name}`
        })
    }
}

async function init() {
    const lsKey = 'wrapped' + new Date().getFullYear()
    localStorage[lsKey] = 'true'
    await generate()
}

const collection = computed(() => {
    return {
        id: 'wrapped',
        tracks: tracksTop.value.map((t) => t.track) ?? [],
        type: 'wrapped',
        name: 'Top tracks from wrapped',
        buttonText: 'Wrapped',
        to: '/wrapped'
    } as ItemCollection
})

const skipCollection = computed(() => {
    return {
        id: 'wrapped-skip',
        tracks: tracksSkip.value.map((t) => t.track) ?? [],
        type: 'wrapped',
        name: 'Most skipped tracks from wrapped',
        buttonText: 'Wrapped',
        to: '/wrapped'
    } as ItemCollection
})
const isActive = (id: string) =>
    player.trackId === id && (player.collection?.id ?? '') === 'wrapped'
const isActiveSkip = (id: string) =>
    player.trackId === id && (player.collection?.id ?? '') === 'wrapped-skip'

init()
</script>

<style lang="less" scoped>
.wrapped {
    padding-top: 70px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding-right: 20px;
    padding-bottom: 100px;
}

h1 {
    font-weight: 600;
    letter-spacing: 3px;
    opacity: 0.9;
}

.subtitle {
    text-transform: uppercase;
    font-weight: 500;
    opacity: 0.7;
    letter-spacing: 2px;
    font-size: 14px;
    margin-bottom: 20px;
}

.little-bigger {
    font-size: 20px;
}

.stat-list {
    background-color: transparent;
}

.item-stat {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
}

.item-rank {
    width: 20px;
    font-weight: 500;
    font-size: 14px;
    text-align: center;
    opacity: 0.7;
}

.minutes-stat {
    opacity: 0.7;
    text-transform: uppercase;
    font-size: 13px;
    width: 130px;
}

.track-list-item {
    flex-grow: 1;
}

.track-list-item-parent.active {
    background: rgba(var(--v-theme-on-background), 1);
    color: rgba(var(--v-theme-background), 1);
    box-shadow: 0 0 12px 0 rgba(var(--v-theme-on-background), 0.3);
}

.track-list-item-parent {
    border-radius: 5px;
    padding: 2px 10px;
}

.track-list-item-parent.odd-item {
    background-color: rgba(var(--v-theme-on-background), 0.06);
}

.align-right {
    text-align: right;
}
</style>
