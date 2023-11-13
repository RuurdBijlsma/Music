import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";

function timeUntilSwitch(lightTime: string, darkTime: string) {
    let now = new Date();
    let nowHours = now.getHours();
    let nowMinutes = now.getMinutes();
    let [darkHours, darkMinutes] = darkTime.split(":").map((p) => +p);
    let [lightHours, lightMinutes] = lightTime.split(":").map((p) => +p);
    let msUntilDark =
        (darkHours - nowHours) * 60 * 60 * 1000 +
        (darkMinutes - nowMinutes) * 60 * 1000;
    let msUntilLight =
        (lightHours - nowHours) * 60 * 60 * 1000 +
        (lightMinutes - nowMinutes) * 60 * 1000;
    if (msUntilDark <= 0) msUntilDark += 1000 * 60 * 60 * 24;
    if (msUntilLight <= 0) msUntilLight += 1000 * 60 * 60 * 24;
    return { msUntilDark, msUntilLight };
}

export function getThemeFromLocalStorage() {
    let themeString: "light" | "dark" = "dark";
    let msToSwitch = -1;
    if (localStorage.getItem("theme") === null) localStorage.theme = "system";
    switch (localStorage.theme) {
        case "dark":
        case "light":
            themeString = localStorage.theme;
            break;
        case "system":
            themeString = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";
            break;
        case "schedule":
            let lightTime: string, darkTime: string;
            if (localStorage.useSunSchedule === "true") {
                lightTime = localStorage.sunriseTime;
                darkTime = localStorage.sunsetTime;
            } else {
                lightTime = localStorage.lightOnTime;
                darkTime = localStorage.darkOnTime;
            }
            let { msUntilLight, msUntilDark } = timeUntilSwitch(
                lightTime,
                darkTime,
            );
            console.log({ msUntilLight, msUntilDark });
            themeString = msUntilLight < msUntilDark ? "dark" : "light";
            msToSwitch = Math.min(msUntilDark, msUntilLight);
    }
    return { themeString, msToSwitch };
}

let { themeString } = getThemeFromLocalStorage();
export const vuetify = createVuetify({
    icons: {
        defaultSet: "mdi",
        aliases,
        sets: { mdi },
    },
    theme: {
        defaultTheme: themeString,
    },
});
