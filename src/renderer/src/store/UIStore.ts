import { defineStore } from "pinia";
import { useTheme } from "vuetify";
import { computed, Ref, ref, watch } from "vue";
import { deltaE, executeCached, hexToRgb } from "../scripts/utils";
import { getThemeFromLocalStorage } from "../scripts/theme";

export const useUIStore = defineStore("UI", () => {
    const theme = useTheme();

    const windowWidth = ref(window.innerWidth);
    const windowHeight = ref(window.innerHeight);
    const onWindowResize = () => {
        windowWidth.value = window.innerWidth;
        windowHeight.value = window.innerHeight;
    };
    window.addEventListener("resize", onWindowResize, false);

    const themeColorDark: Ref<string> = ref(
        localStorage.getItem("themeColorDark") === null
            ? "#FFFFFF"
            : localStorage.themeColorDark,
    );
    const themeColorLight: Ref<string> = ref(
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
        applyThemeFromLocalStorage().then();
    });
    let scheduleTimeout = 0;
    const lightOnTime: Ref<string> = ref(
        localStorage.getItem("lightOnTime") === null
            ? "07:00"
            : localStorage.lightOnTime,
    );
    const darkOnTime: Ref<string> = ref(
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
        set:
            localStorage.getItem("sunsetTime") === null
                ? "19:00"
                : localStorage.sunsetTime,
        rise:
            localStorage.getItem("sunriseTime") === null
                ? "05:00"
                : localStorage.sunriseTime,
    });
    watch(sun, () => {
        localStorage.sunsetTime = sun.value.set;
        localStorage.sunriseTime = sun.value.rise;
    });
    const useSunSchedule = ref(
        localStorage.getItem("useSunSchedule") === null
            ? false
            : localStorage.useSunSchedule === "true",
    );
    watch(useSunSchedule, () => {
        localStorage.useSunSchedule = useSunSchedule.value;
    });

    applyThemeFromLocalStorage().then();

    async function applyThemeFromLocalStorage() {
        if (useSunSchedule.value) {
            let sunriseTime = localStorage.sunriseTime;
            updateSunStats().then(() => {
                // if update sun stats changed the sun times, reset the timeout
                if (sun.value.rise !== sunriseTime)
                    applyThemeFromLocalStorage();
            });
        }
        let { themeString, msToSwitch } = getThemeFromLocalStorage();
        theme.global.name.value = themeString;
        if (msToSwitch !== -1) {
            clearTimeout(scheduleTimeout);
            // check theme calculations again after sunrise or sunset
            // @ts-ignore
            scheduleTimeout = setTimeout(
                () => applyThemeFromLocalStorage(),
                msToSwitch,
            );
        }
        window.api.setTheme(themeString).then();
    }

    async function updateSunStats() {
        // get sunset, cache result 7 days
        let { sunset, sunrise } = await executeCached(
            getRawSunTimes,
            `sunTimes`,
            1000 * 60 * 60 * 24 * 7,
        );
        // format the datetime to 16:27
        let sunsetTime = sunset.toLocaleString("nl-NL", {
            timeStyle: "short",
            hour12: false,
        });
        let sunriseTime = sunrise.toLocaleString("nl-NL", {
            timeStyle: "short",
            hour12: false,
        });

        sun.value = {
            set: sunsetTime,
            rise: sunriseTime,
        };

        return [sunriseTime, sunsetTime];
    }

    async function getRawSunTimes() {
        let { ip } = await (
            await fetch("https://api.ipify.org?format=json")
        ).json();
        let locationInfo = await (
            await fetch(`https://tools.keycdn.com/geo.json?host=${ip}`)
        ).json();
        let lat = locationInfo.data.geo.latitude;
        let lon = locationInfo.data.geo.longitude;
        // Use the Sunrise Sunset API to get the data
        const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("NOT OK" + response.statusText);
        const data = await response.json();

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
