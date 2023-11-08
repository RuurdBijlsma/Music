<template>
    <Line :data="chartData" :options="chartOptions" class="line-chart"></Line>
</template>

<script lang="ts" setup>
import { Line } from "vue-chartjs";
import { computed, PropType } from "vue";
import {
    BarElement,
    CategoryScale,
    Chart,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from "chart.js";
import { useTheme } from "vuetify";
import { useUIStore } from "../store/UIStore";

const ui = useUIStore();
Chart.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
);
const theme = useTheme();

const props = defineProps({
    labels: {
        type: [] as PropType<string[]>,
        required: true,
    },
    data: {
        type: [] as PropType<number[]>,
        required: true,
    },
    dataLabel: {
        type: String,
        required: true,
    },
});

const letterColor = computed(() =>
    theme.current.value.dark ? "255,255,255" : "0,0,0",
);

const chartOptions = computed(() => ({
    responsive: true,
    tension: 0.2,
    color: `rgba(${letterColor.value}, .8)`,
    scales: {
        x: {
            ticks: {
                color: `rgba(${letterColor.value}, .8)`,
            },
            grid: {
                color: `rgba(${letterColor.value}, .1)`,
            },
        },
        y: {
            ticks: {
                color: `rgba(${letterColor.value}, .8)`,
            },
            grid: {
                color: `rgba(${letterColor.value}, .1)`,
            },
        },
    },
}));
const chartData = computed(() => ({
    labels: props.labels,
    datasets: [
        {
            label: props.dataLabel,
            data: props.data,
            borderColor: ui.themeColor,
        },
    ],
}));
</script>

<style lang="less" scoped>
.line-chart {
    padding: 10px 20px;
    border-radius: 10px;

    background-color: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(100px) saturate(300%) brightness(105%);
    box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.15);
}

.dark .line-chart {
    background-color: rgba(0, 0, 0, 0.6);
}
</style>
