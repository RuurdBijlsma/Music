import { defineStore } from "pinia";
import { usePlatformStore } from "./electron";
import { useTheme } from "vuetify";
import { computed, ref, watch } from "vue";
import { deltaE, executeCached, hexToRgb } from "../scripts/utils";
import { baseDb, useBaseStore } from "./base";

export const useUIStore = defineStore("UI", () => {
    const base = useBaseStore();
    const platform = usePlatformStore();
    const theme = useTheme();

    const windowWidth = ref(window.innerWidth);
    const windowHeight = ref(window.innerHeight);
    const onWindowResize = () => {
        windowWidth.value = window.innerWidth;
        windowHeight.value = window.innerHeight;
    };
    window.addEventListener("resize", onWindowResize, false);

    const themeColorDark = ref(
        localStorage.getItem("themeColorDark") === null
            ? "#FFFFFF"
            : localStorage.themeColorDark,
    );
    const themeColorLight = ref(
        localStorage.getItem("themeColorLight") === null
            ? "#000000"
            : localStorage.themeColorLight,
    );
    watch(
        themeColorLight,
        () => (localStorage.themeColorLight = themeColorLight.value),
    );
    watch(
        themeColorDark,
        () => (localStorage.themeColorDark = themeColorDark.value),
    );

    const themeColor = computed(() =>
        theme.global.name.value === "dark"
            ? themeColorDark.value
            : themeColorLight.value,
    );
    const contrastToForeground = computed(() => {
        let themeRgb = hexToRgb(themeColor.value);
        let fgRgb = hexToRgb(theme.current.value.colors["on-background"]);

        return deltaE(themeRgb, fgRgb);
    });
    const themeTooSimilarToFg = computed(() => contrastToForeground.value < 17);
    const isDark = computed(() => theme.current.value.dark);

    const themeOptions = ["light", "dark", "system", "schedule"];
    const themeIndex = ref(
        themeOptions.indexOf(
            localStorage.getItem("theme") === null
                ? "system"
                : localStorage.theme,
        ),
    );
    watch(themeIndex, () => {
        localStorage.theme = themeOptions[themeIndex.value];
        console.log("Change theme", themeIndex.value, localStorage.theme);
        applyThemeFromLocalStorage().then();
    });
    let scheduleTimeout = 0;
    const lightOnTime = ref(
        localStorage.getItem("lightOnTime") === null
            ? "07:00"
            : localStorage.lightOnTime,
    );
    const darkOnTime = ref(
        localStorage.getItem("darkOnTime") === null
            ? "19:00"
            : localStorage.darkOnTime,
    );
    watch(lightOnTime, () => {
        localStorage.lightOnTime = lightOnTime.value;
        applyThemeFromLocalStorage().then();
    });
    watch(darkOnTime, () => {
        localStorage.darkOnTime = darkOnTime.value;
        applyThemeFromLocalStorage().then();
    });

    const sun = ref({
        set: new Date("2023-01-01T07:00:00"),
        rise: new Date("2023-01-01T19:00:00"),
        isNightTime: false,
    });
    const useSunSchedule = ref(
        localStorage.getItem("useSunSchedule") === null
            ? false
            : localStorage.useSunSchedule === "true",
    );
    watch(useSunSchedule, () => {
        localStorage.useSunSchedule = useSunSchedule.value;
    });

    async function updateSunStats() {
        let { sunset, sunrise, isNightTime } = await getNextSunEvents();
        sun.value.set = sunset;
        sun.value.rise = sunrise;
        sun.value.isNightTime = isNightTime;
        console.log("IS NIGHT", isNightTime);
        console.log({ sunset, sunrise });
    }

    updateSunStats().then();

    applyThemeFromLocalStorage().then();

    async function applyThemeFromLocalStorage() {
        if (localStorage.getItem("theme") === null)
            localStorage.theme = "system";
        switch (localStorage.theme) {
            case "dark":
            case "light":
                theme.global.name.value = localStorage.theme;
                break;
            case "system":
                theme.global.name.value = window.matchMedia(
                    "(prefers-color-scheme: dark)",
                ).matches
                    ? "dark"
                    : "light";
                break;
            case "schedule":
                let msToSwitch = 1000 * 60 * 60;
                let now = new Date();
                if (useSunSchedule.value) {
                    await updateSunStats();
                    theme.global.name.value = sun.value.isNightTime
                        ? "dark"
                        : "light";
                    let nextEvent = new Date(
                        Math.min(+sun.value.set, +sun.value.rise),
                    );
                    msToSwitch = +nextEvent - +now;
                } else {
                    let nowHours = now.getHours();
                    let nowMinutes = now.getMinutes();
                    let [darkHours, darkMinutes] = darkOnTime.value
                        .split(":")
                        .map((p) => +p);
                    let [lightHours, lightMinutes] = lightOnTime.value
                        .split(":")
                        .map((p) => +p);
                    let msUntilDark =
                        (darkHours - nowHours) * 60 * 60 * 1000 +
                        (darkMinutes - nowMinutes) * 60 * 1000;
                    let msUntilLight =
                        (lightHours - nowHours) * 60 * 60 * 1000 +
                        (lightMinutes - nowMinutes) * 60 * 1000;
                    if (msUntilDark <= 0) msUntilDark += 1000 * 60 * 60 * 24;
                    if (msUntilLight <= 0) msUntilLight += 1000 * 60 * 60 * 24;
                    theme.global.name.value =
                        msUntilLight < msUntilDark ? "dark" : "light";
                    msToSwitch = Math.min(msUntilDark, msUntilLight);
                }
                console.log(
                    "Time to next sun event",
                    base.msToReadable(msToSwitch),
                );
                clearTimeout(scheduleTimeout);
                // check theme calculations again after sunrise or sunset
                // @ts-ignore
                scheduleTimeout = setTimeout(
                    () => applyThemeFromLocalStorage(),
                    msToSwitch,
                );
        }
        platform.setTheme(theme.global.name.value as "light" | "dark").then();
    }

    async function getNextSunEvents() {
        // get sunset, cache result 7 days
        let { sunset, sunrise } = await executeCached<{
            sunrise: Date;
            sunset: Date;
        }>(await baseDb, getRawSunTimes, `sunTimes`, 1000 * 60 * 60 * 24 * 7);
        let now = new Date();
        // bring sunset date to current day
        sunset.setDate(now.getDate());
        const day = 1000 * 60 * 60 * 24;
        while (now > sunset) sunset = new Date(+sunset + day);
        console.log("Next sunset", sunset);
        sunrise.setDate(now.getDate());
        while (now > sunrise) sunrise = new Date(+sunrise + day);
        console.log("Next sunrise", sunrise);
        // if next sunset is tomorrow, then we are past today's sunset, so it is night
        // if next sunrise is today, then it is very early, so it is night
        let isNightTime =
            sunset.getDate() > now.getDate() ||
            sunrise.getDate() === now.getDate();
        return {
            isNightTime,
            sunset,
            sunrise,
        };
    }

    async function getRawSunTimes() {
        let { ip } = await (
            await fetch("https://api.ipify.org?format=json")
        ).json();
        let locationInfo = await (
            await fetch(`https://tools.keycdn.com/geo.json?host=${ip}`)
        ).json();
        console.log({ locationInfo, ip });
        let lat = locationInfo.data.geo.latitude;
        let lon = locationInfo.data.geo.longitude;
        // Use the Sunrise Sunset API to get the data
        const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("NOT OK" + response.statusText);
        const data = await response.json();
        console.log("sunData", data);

        // Return an object with the sunrise and sunset times as Date objects
        return {
            sunrise: new Date(data.results.sunrise),
            sunset: new Date(data.results.sunset),
        };
    }

    return {
        themeColor,
        themeColorDark,
        themeColorLight,
        contrastToForeground,
        themeTooSimilarToFg,
        isDark,
        themeIndex,
        themeOptions,
        sun,
        useSunSchedule,
        lightOnTime,
        darkOnTime,
        windowWidth,
        windowHeight,
    };
});
