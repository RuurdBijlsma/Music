import { defineStore } from 'pinia'
import { useTheme } from 'vuetify'
import { computed, ref, watch } from 'vue'
import { deltaE, executeCached, hexToRgb, persistentRef } from '../../scripts/utils'
import { getThemeFromLocalStorage } from '../../scripts/theme'

export const useUIStore = defineStore('UI', () => {
    const theme = useTheme()

    const windowWidth = ref(window.innerWidth)
    const windowHeight = ref(window.innerHeight)
    const onWindowResize = () => {
        windowWidth.value = window.innerWidth
        windowHeight.value = window.innerHeight
    }
    window.addEventListener('resize', onWindowResize, false)

    const themeColorDark = persistentRef('themeColorDark', '#FFFFFF')
    const themeColorLight = persistentRef('themeColorLight', '#000000')

    const themeColor = computed(() =>
        theme.global.name.value === 'dark' ? themeColorDark.value : themeColorLight.value
    )
    const contrastToForeground = computed(() => {
        const themeRgb = hexToRgb(themeColor.value)
        const fgRgb = hexToRgb(theme.current.value.colors['on-background'])

        return deltaE(themeRgb, fgRgb)
    })
    const themeTooSimilarToFg = computed(() => contrastToForeground.value < 17)
    const isDark = computed(() => theme.current.value.dark)

    const themeOptions = ['light', 'dark', 'system', 'schedule']

    const themeString = persistentRef('theme', 'system')
    watch(themeString, () => applyThemeFromLocalStorage().then())
    let scheduleTimeout = 0
    const lightOnTime = persistentRef('lightOnTime', '07:00')
    const darkOnTime = persistentRef('darkOnTime', '19:00')
    watch(lightOnTime, () => applyThemeFromLocalStorage().then())
    watch(darkOnTime, () => applyThemeFromLocalStorage().then())
    const sun = persistentRef(
        'sunTimes',
        {
            rise: '05:00',
            set: '19:00'
        },
        true
    )
    const useSunSchedule = persistentRef('useSunSchedule', false)
    watch(useSunSchedule, () => applyThemeFromLocalStorage().then())

    applyThemeFromLocalStorage().then()

    async function applyThemeFromLocalStorage() {
        if (useSunSchedule.value) {
            const sunriseTime = sun.value.rise
            updateSunStats().then(() => {
                // if update sun stats changed the sun times, reset the timeout
                if (sun.value.rise !== sunriseTime) applyThemeFromLocalStorage()
            })
        }
        const { themeString, msToSwitch } = getThemeFromLocalStorage()
        theme.global.name.value = themeString
        if (msToSwitch !== -1) {
            clearTimeout(scheduleTimeout)
            // check theme calculations again after sunrise or sunset
            // @ts-ignore
            scheduleTimeout = setTimeout(() => applyThemeFromLocalStorage(), msToSwitch)
        }
        window.api.setTheme(themeString).then()
    }

    async function updateSunStats() {
        // get sunset, cache result 7 days
        const { sunset, sunrise } = await executeCached(
            getRawSunTimes,
            `sunTimes`,
            1000 * 60 * 60 * 24 * 7
        )
        // format the datetime to 16:27
        const sunsetTime = sunset.toLocaleString('nl-NL', {
            timeStyle: 'short',
            hour12: false
        })
        const sunriseTime = sunrise.toLocaleString('nl-NL', {
            timeStyle: 'short',
            hour12: false
        })

        sun.value = {
            set: sunsetTime,
            rise: sunriseTime
        }

        return [sunriseTime, sunsetTime]
    }

    async function getRawSunTimes() {
        const { ip } = await (await fetch('https://api.ipify.org?format=json')).json()
        const locationInfo = await (
            await fetch(`https://tools.keycdn.com/geo.json?host=${ip}`)
        ).json()
        const lat = locationInfo.data.geo.latitude
        const lon = locationInfo.data.geo.longitude
        // Use the Sunrise Sunset API to get the data
        const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`
        const response = await fetch(url)
        if (!response.ok) throw new Error('NOT OK' + response.statusText)
        const data = await response.json()

        // Return an object with the sunrise and sunset times as Date objects
        return {
            sunrise: new Date(data.results.sunrise),
            sunset: new Date(data.results.sunset)
        }
    }

    return {
        themeColor,
        themeColorDark,
        themeColorLight,
        contrastToForeground,
        themeTooSimilarToFg,
        isDark,
        themeOptions,
        sun,
        useSunSchedule,
        lightOnTime,
        darkOnTime,
        windowWidth,
        windowHeight,
        themeString
    }
})
