import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

function timeUntilSwitch(lightTime: string, darkTime: string) {
    const now = new Date()
    const nowHours = now.getHours()
    const nowMinutes = now.getMinutes()
    const [darkHours, darkMinutes] = darkTime.split(':').map((p) => +p)
    const [lightHours, lightMinutes] = lightTime.split(':').map((p) => +p)
    let msUntilDark =
        (darkHours - nowHours) * 60 * 60 * 1000 + (darkMinutes - nowMinutes) * 60 * 1000
    let msUntilLight =
        (lightHours - nowHours) * 60 * 60 * 1000 + (lightMinutes - nowMinutes) * 60 * 1000
    if (msUntilDark <= 0) msUntilDark += 1000 * 60 * 60 * 24
    if (msUntilLight <= 0) msUntilLight += 1000 * 60 * 60 * 24
    return { msUntilDark, msUntilLight }
}

export function getThemeFromLocalStorage() {
    let themeString: 'light' | 'dark' = 'dark'
    let msToSwitch = -1
    if (localStorage.getItem('theme') === null) localStorage.theme = 'system'
    switch (localStorage.theme) {
        case 'dark':
        case 'light':
            themeString = localStorage.theme
            break
        case 'system':
            themeString = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
            break
        case 'schedule':
            let lightTime: string, darkTime: string
            if (localStorage.useSunSchedule === 'true') {
                if (localStorage.getItem('sunTimes') === null) break
                const { rise, set } = JSON.parse(localStorage.sunTimes)
                lightTime = rise
                darkTime = set
            } else {
                if (
                    localStorage.getItem('lightOnTime') === null ||
                    localStorage.getItem('darkOnTime') === null
                )
                    break
                lightTime = localStorage.lightOnTime
                darkTime = localStorage.darkOnTime
            }
            const { msUntilLight, msUntilDark } = timeUntilSwitch(lightTime, darkTime)
            themeString = msUntilLight < msUntilDark ? 'dark' : 'light'
            msToSwitch = Math.min(msUntilDark, msUntilLight)
    }
    return { themeString, msToSwitch }
}

const { themeString } = getThemeFromLocalStorage()
export const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: { mdi }
    },
    theme: {
        defaultTheme: themeString
    }
})
