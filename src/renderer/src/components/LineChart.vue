<template>
    <Line
        v-if="type === 'line'"
        :data="chartJsData"
        :options="chartOptions as any"
        class="line-chart"
    ></Line>
    <Bar
        v-else-if="type === 'bar'"
        :data="chartJsData"
        :options="chartOptions as any"
        class="line-chart"
    ></Bar>
</template>

<script lang="ts" setup>
import { Bar, Line } from 'vue-chartjs'
import { computed, PropType } from 'vue'
import {
    BarElement,
    CategoryScale,
    Chart,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    TimeScale,
    Title,
    Tooltip
} from 'chart.js'
import { useTheme } from 'vuetify'
import { useUIStore } from '../store/UI/UIStore'
import 'chartjs-adapter-date-fns'
import { format } from 'date-fns'
import type { ChartData } from '../scripts/types'

const ui = useUIStore()
Chart.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeScale
)
const theme = useTheme()

const props = defineProps({
    chartData: {
        type: Object as PropType<ChartData>,
        required: true
    },
    type: {
        type: String as PropType<'line' | 'bar'>,
        default: 'line'
    }
})
const letterColor = computed(() => (theme.current.value.dark ? '255,255,255' : '0,0,0'))

const chartOptions = computed(() => ({
    plugins: {
        tooltip: {
            callbacks: {
                title: (context) => {
                    const date = new Date(context[0].parsed.x)
                    return format(date, 'dd MMM yyyy')
                }
            }
        }
    },
    responsive: true,
    tension: 0.2,
    color: `rgba(${letterColor.value}, .8)`,
    scales: {
        x: {
            title: {
                display: props.chartData.xAxis,
                text: props.chartData.xAxis
            },
            type: 'time',
            time: {
                unit: 'day'
            },
            ticks: {
                color: `rgba(${letterColor.value}, .8)`
            },
            grid: {
                color: `rgba(${letterColor.value}, .1)`
            }
        },
        y: {
            title: {
                display: props.chartData.yAxis,
                text: props.chartData.yAxis
            },
            ticks: {
                color: `rgba(${letterColor.value}, .8)`
            },
            grid: {
                color: `rgba(${letterColor.value}, .1)`
            }
        }
    }
}))
const chartJsData = computed(() => ({
    labels: props.chartData.labels,
    datasets: [
        {
            label: props.chartData.dataLabel,
            data: props.chartData.values,
            borderColor: ui.themeColor,
            backgroundColor: `rgba(${letterColor.value}, .8)`
        }
    ]
}))
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
