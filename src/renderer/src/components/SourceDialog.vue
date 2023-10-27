<template>
    <v-dialog
        v-model="base.sourceDialog.show"
        :class="{ dark: base.isDark }"
        :scrollable="true"
        width="auto"
    >
        <div class="translucent">
            <v-card-title class="main-title pt-5 mb-3">
                Choose a YouTube source video
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text
                :style="{
                    overflowY: base.sourceDialog.loading ? 'hidden' : 'auto',
                    alignItems: base.sourceDialog.loading ? 'center' : 'left',
                }"
                class="card-content"
            >
                <v-progress-circular
                    v-if="base.sourceDialog.loading"
                    indeterminate
                    size="100"
                />
                <template v-else>
                    <div
                        v-for="item in base.sourceDialog.items"
                        class="yt-card mb-5"
                    >
                        <v-img
                            :src="item.thumbnail"
                            class="image"
                            height="200"
                            max-width="355"
                            min-width="355"
                        >
                            <p class="duration">
                                {{ base.msToReadable(item.duration * 1000) }}
                            </p>
                            <p
                                v-if="sourceSelectedId === item.id"
                                class="selected"
                            >
                                Active
                            </p>
                        </v-img>
                        <div class="info-content">
                            <h3 class="title mb-1">{{ item.title }}</h3>
                            <v-list-item-subtitle
                                >{{ viewCountString(item.viewCount) }} •
                                {{ item.uploadDate.toLocaleDateString() }}
                            </v-list-item-subtitle>
                            <div class="channel mt-2">
                                <v-avatar :color="randomColor(item.id)"
                                    >{{ item.channel[0] }}
                                </v-avatar>
                                <span class="ml-4">{{ item.channel }}</span>
                            </div>
                            <p class="description mt-2">
                                {{ item.description }}
                            </p>
                            <div class="actions mt-4">
                                <v-btn
                                    v-if="sourceSelectedId !== item.id"
                                    variant="tonal"
                                    @click="activate(item)"
                                >
                                    activate
                                </v-btn>
                                <simple-yt-player
                                    :track="search.ytResultToTrack(item)"
                                ></simple-yt-player>
                            </div>
                        </div>
                    </div>
                </template>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-btn
                    :block="true"
                    :color="base.themeColor"
                    @click="base.sourceDialog.show = false"
                    >Dismiss
                </v-btn>
            </v-card-actions>
        </div>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useBaseStore } from "../store/base";
import { useTheme } from "vuetify";
import { useSearchStore } from "../store/search";
import { watch } from "vue";
import { storeToRefs } from "pinia";
import SimpleYtPlayer from "./SimpleYtPlayer.vue";
import { useLibraryStore } from "../store/library";

const theme = useTheme();
const search = useSearchStore();
const base = useBaseStore();
const library = useLibraryStore();
const { sourceSelectedId } = storeToRefs(base);

function activate(item: any) {
    sourceSelectedId.value = item.id;
    library.activateSource(item.id);
}

watch(sourceSelectedId, () => {
    console.log("ssid", sourceSelectedId.value);
});

const randomColor = (id: string) => {
    let random = parseInt(id.substring(2, 6), 36) / 1679616;
    if (theme.current.value.dark) {
        return (
            "hsl(" +
            360 * random +
            "," +
            (25 + 70 * random) +
            "%," +
            (25 + 10 * random) +
            "%)"
        );
    } else {
        return (
            "hsl(" +
            360 * random +
            "," +
            (25 + 70 * random) +
            "%," +
            (75 + 10 * random) +
            "%)"
        );
    }
};

const viewCountString = (viewCount: number) => {
    if (viewCount > 1000000000) {
        let followerBillions = Math.round(viewCount / 1000000000);
        return (
            followerBillions + "B view" + (followerBillions === 1 ? "" : "s")
        );
    }
    if (viewCount > 1000000) {
        let followerMillions = Math.round(viewCount / 1000000);
        return (
            followerMillions + "M view" + (followerMillions === 1 ? "" : "s")
        );
    }
    return viewCount.toLocaleString() + " view" + (viewCount === 1 ? "" : "s");
};
</script>

<style lang="less" scoped>
.translucent {
    backdrop-filter: blur(40px) saturate(150%) brightness(130%);
    background-color: rgba(var(--v-theme-background), 0.5);
    border-radius: 8px;
    box-shadow: 0 4px 2px 0 rgba(0, 0, 0, 0.2);
}

.dark .translucent {
    backdrop-filter: blur(40px) saturate(150%) brightness(70%) !important;
    background-color: rgba(var(--v-theme-background), 0.7) !important;
}

.main-title {
    text-align: center;
}

.card-content {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    overflow-y: auto;
    max-height: calc(100vh - 300px);
    overflow-x: hidden;
}

.card-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
}

.card-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
}

.yt-card {
    display: flex;
    gap: 20px;
    width: 100%;
}

.image {
    border-radius: 7px;
    box-shadow: 0 4px 2px 0 rgba(0, 0, 0, 0.2);
    background-color: black;
}

.duration,
.selected {
    position: absolute;
    border-radius: 5px;
    padding: 4px 8px;
    font-size: 12px;
    text-transform: uppercase;
}

.duration {
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.8);
}

.selected {
    top: 10px;
    left: 10px;
    background-color: #179b4e;
}

.info-content {
    width: 100%;
}

.title {
    font-size: 20px;
    font-weight: 500;
    opacity: 0.9;
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: calc(100% - 50px);
}

.channel {
    display: flex;
    align-items: center;
}

.description {
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow-y: hidden;
    font-size: 14px;
    opacity: 0.8;
}

.actions {
    display: flex;
    gap: 20px;
    align-items: center;
}

h1,
h2,
h3,
h4 {
    text-align: left;
}
</style>
