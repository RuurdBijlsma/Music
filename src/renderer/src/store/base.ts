import { defineStore } from "pinia";
import { IDBPDatabase, IDBPObjectStore, openDB, StoreNames } from "idb";
import { computed, ref } from "vue";
import { useTheme } from "vuetify";
import type {
    DataExport,
    Item,
    ItemCollection,
    YouTubeSearchResult,
} from "../scripts/types";
import { deltaE, hexToRgb } from "../scripts/utils";
import { EventEmitter } from "events";
import { randomNotFound } from "../scripts/imageSources";
import { useRuurdAuthStore } from "./ruurd-auth";

function createStore(
    db: IDBPDatabase,
    transaction: any,
    storeName: string,
    storeOptions: { keyPath?: string } = {},
    indices: { name: string; keyPath: string; unique: boolean }[] = [],
) {
    let store: IDBPObjectStore<
        unknown,
        ArrayLike<StoreNames<unknown>>,
        string,
        "versionchange"
    >;
    if (!db.objectStoreNames.contains(storeName)) {
        store = db.createObjectStore(storeName, storeOptions);
    } else {
        store = transaction.objectStore(storeName);
    }
    for (let index of indices) {
        if (!store.indexNames.contains(index.name)) {
            store.createIndex(index.name, index.keyPath, {
                unique: index.unique,
            });
        }
    }
    return store;
}

export const baseDb = openDB("base", 6, {
    upgrade(db, _, __, transaction) {
        if (db.objectStoreNames.contains("trackBars"))
            db.deleteObjectStore("trackBars");
        if (db.objectStoreNames.contains("trackVolumeStats"))
            db.deleteObjectStore("trackVolumeStats");
        if (db.objectStoreNames.contains("trackEdits"))
            db.deleteObjectStore("trackEdits");
        if (db.objectStoreNames.contains("ytTracks"))
            db.deleteObjectStore("ytTracks");
        if (db.objectStoreNames.contains("nameToId"))
            db.deleteObjectStore("nameToId");
        if (db.objectStoreNames.contains("imageColor"))
            db.deleteObjectStore("imageColor");

        createStore(db, transaction, "spotify");
        createStore(db, transaction, "cache");
        createStore(db, transaction, "artistStats");
        createStore(db, transaction, "trackStats");
        createStore(db, transaction, "collectionStats");
        createStore(db, transaction, "statistics");
        createStore(db, transaction, "trackMetadata", { keyPath: "id" });

        createStore(db, transaction, "tracks", { keyPath: "id" }, [
            {
                name: "searchString",
                keyPath: "searchString",
                unique: false,
            },
            {
                name: "title",
                keyPath: "title",
                unique: false,
            },
            {
                name: "artist",
                keyPath: "artistString",
                unique: false,
            },
            {
                name: "oldToNew",
                keyPath: "added_at",
                unique: false,
            },
            {
                name: "newToOld",
                keyPath: "added_at_reverse",
                unique: false,
            },
        ]);
    },
});

export const useBaseStore = defineStore("base", () => {
    const theme = useTheme();
    const ruurdAuth = useRuurdAuthStore();
    const dbLoaded = ref(false);
    const events = new EventEmitter();
    baseDb.then(async () => {
        dbLoaded.value = true;
    });
    const themeColorDark = ref("#FFFFFF");
    const themeColorLight = ref("#000000");
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

    const snackbars = ref(
        [] as { open: boolean; text: string; timeout: number }[],
    );
    const isDark = computed(() => theme.current.value.dark);

    const contextMenu = ref({
        x: 0,
        y: 0,
        show: false,
        item: null as any,
    });

    const sourceDialog = ref({
        show: false,
        items: [] as YouTubeSearchResult[],
        loading: false,
        tempTrackOverride: {
            ytId: "",
            trackId: "",
        },
        spotifyTrack: null as SpotifyApi.TrackObjectFull | null,
    });
    const sourceSelectedId = ref("");

    const windowWidth = ref(window.innerWidth);
    const windowHeight = ref(window.innerHeight);
    const onWindowResize = () => {
        windowWidth.value = window.innerWidth;
        windowHeight.value = window.innerHeight;
    };
    window.addEventListener("resize", onWindowResize, false);

    async function exportToServer() {
        if (!ruurdAuth.isLoggedIn) {
            addSnack(
                "You must be logged in to a Ruurd Account before being able to export to server.",
            );
            return false;
        }

        let data = await getDataExport();
        const blob = new Blob([JSON.stringify(data)], {
            type: "application/json",
        });
        const formData = new FormData();
        formData.append("files", blob, "ruurd-music-data.json");
        formData.append("email", ruurdAuth.credentials.email);
        formData.append("password", ruurdAuth.credentials.password);

        const fetchOptions = {
            method: "POST",
            body: formData,
        };

        let response = await fetch(
            "https://api.ruurd.dev/drive/upload",
            fetchOptions,
        );
        if (response.ok) {
            return true;
        }
        addSnack(response.statusText);
        return false;
    }

    async function getDataExport(): Promise<DataExport> {
        let db = await baseDb;
        const getObjectStore = async (
            storeName: string,
        ): Promise<{ [key: string]: any }> => {
            let keys = (await db.getAllKeys(storeName)) as string[];
            let values = await db.getAll(storeName);
            let result = {};
            for (let i = 0; i < keys.length; i++) {
                result[keys[i]] = values[i];
            }
            return result;
        };

        let cleanLocalStorage = { ...localStorage };
        delete cleanLocalStorage.trackInMemory;
        delete cleanLocalStorage.blurBgSource;
        delete cleanLocalStorage.lastRoute;

        return {
            localStorage: cleanLocalStorage,
            idb: {
                artistStats: await getObjectStore("artistStats"),
                collectionStats: await getObjectStore("collectionStats"),
                imageColor: await getObjectStore("imageColor"),
                nameToId: await getObjectStore("nameToId"),
                //@ts-ignore
                spotify: await getObjectStore("spotify"),
                //@ts-ignore
                statistics: await getObjectStore("statistics"),
                trackBars: await getObjectStore("trackBars"),
                trackEdits: await getObjectStore("trackEdits"),
                trackStats: await getObjectStore("trackStats"),
                trackVolumeStats: await getObjectStore("trackVolumeStats"),
                tracks: await db.getAll("tracks"),
            },
        };
    }

    async function importData(data: DataExport) {
        for (let key in data.localStorage) {
            if (!data.localStorage.hasOwnProperty(key)) continue;
            localStorage.setItem(key, data.localStorage[key]);
        }

        const putStoreObject = (
            storeName: string,
            object: { [key: string]: any },
        ) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            for (let key in object) {
                if (!object.hasOwnProperty(key)) continue;
                store.put(object[key], key);
            }

            return tx.done;
        };
        let idb = data.idb;
        let db = await baseDb;
        await putStoreObject("artistStats", idb.artistStats);
        await putStoreObject("collectionStats", idb.collectionStats);
        await putStoreObject("imageColor", idb.imageColor);
        await putStoreObject("nameToId", idb.nameToId);
        await putStoreObject("spotify", idb.spotify);
        await putStoreObject("statistics", idb.statistics);
        await putStoreObject("trackBars", idb.trackBars);
        await putStoreObject("trackEdits", idb.trackEdits);
        await putStoreObject("trackStats", idb.trackStats);
        await putStoreObject("trackVolumeStats", idb.trackVolumeStats);
        const putStoreArray = (storeName: string, array: any[]) => {
            const tx = db.transaction([storeName], "readwrite");
            const store = tx.objectStore(storeName);

            store.clear();
            for (let obj of array) {
                store.add(obj);
            }

            return new Promise((resolve) => (tx.oncomplete = resolve));
        };
        await putStoreArray("tracks", idb.tracks);
    }

    function approximateDuration(millis: number) {
        if (millis > 7200000) return Math.round(millis / 3600000) + " hours";
        let minutes = Math.round(millis / 60000);
        return minutes + " minute" + (minutes === 1 ? "" : "s");
    }

    function albumString(item: SpotifyApi.AlbumObjectFull | any) {
        return `${item.total_tracks} track${
            item.total_tracks === 1 ? "" : "s"
        } • ${item.artists
            .map((a) => a.name)
            .join(", ")} • ${item.release_date.substring(0, 4)} • ${caps(
            item.album_type,
        )}`;
    }

    function msToReadable(millis: number) {
        if (isNaN(millis) || millis === undefined) return "0:00";

        let seconds = Math.round(millis / 1000);
        let h = Math.floor(seconds / 3600);
        let m = Math.floor((seconds % 3600) / 60);
        let s = seconds % 60;
        let hString = h.toString();
        let mString = m.toString();
        let sString = s.toString();
        if (hString !== "0") {
            mString = mString.padStart(2, "0");
            sString = sString.padStart(2, "0");
        }
        sString = sString.padStart(2, "0");

        if (hString === "0") return `${mString}:${sString}`;
        else return `${hString}:${mString}:${sString}`;
    }

    function itemDescription(item: Item) {
        if (item.type === "album") {
            return `${caps(item?.album_type ?? "")} • ${(item?.artists ?? [])
                .map((a) => a.name)
                .join(", ")}`;
        }
        if (item.type !== "playlist") return "";
        return item.description ?? "";
    }

    function caps(str: string) {
        return str[0].toUpperCase() + str.slice(1);
    }

    function itemImage(item: Item) {
        let image;
        if (item.type === "track") {
            image = item?.album?.images?.[0]?.url;
        } else {
            image = item.images?.[0]?.url;
        }
        if (image === null || image === undefined) {
            return randomNotFound();
        }
        return image;
    }

    const encodeUrlName = (name: string) => {
        if (name.trim() === "") return "_";
        let toEncode = name.toLowerCase().replace(/ /gi, "-").slice(0, 36);
        let encoded: string;
        try {
            encoded = encodeURIComponent(toEncode);
        } catch (e) {
            encoded = toEncode.replace(/[^a-z0-9]/gi, "");
            console.warn(
                `Couldn't uri encode ${toEncode}, changed to ${encoded}`,
            );
        }
        return encoded;
    };

    const itemUrl = (item: Item | any) => {
        if ("buttonText" in item) {
            return item.to;
        }
        if (item === null) return "";
        let type = item.type || "category";
        let name = type === "user" ? item.display_name : item.name;
        name ??= "";
        if (type === "category")
            return `${type}/${encodeUrlName(name)}/${item.id}`;
        if (type === "radio") return "";
        if (type === "search") return item.to ?? "/";
        if (type === "liked") return "/library/tracks";
        return `/${type}/${encodeUrlName(name)}/${item.id}`;
    };

    const itemCollection = (
        item: Item,
        tracks: SpotifyApi.TrackObjectFull[] | null = null,
    ) => {
        if (item.type === "playlist") {
            if (tracks === null)
                tracks = item.tracks.items.map(
                    (t) => t.track as SpotifyApi.TrackObjectFull,
                );
            return {
                id: item.id ?? "playlist",
                tracks: tracks,
                type: "playlist",
                context: item,
                name: item.name ?? "Playlist",
                buttonText: "Playlist",
                to: itemUrl(item),
            } as ItemCollection;
        } else if (item.type === "artist") {
            return {
                id: item.id ?? "artist",
                tracks: tracks ?? [],
                type: "artist",
                context: item,
                name: item.name ?? "Artist",
                buttonText: "Artist",
                to: itemUrl(item),
            } as ItemCollection;
        } else if (item.type === "album") {
            if (tracks === null && item.tracks !== undefined)
                tracks = item.tracks.items as SpotifyApi.TrackObjectFull[];
            return {
                id: item.id ?? "album",
                tracks: tracks ?? [],
                type: "album",
                context: item,
                name: item.name ?? "Album",
                buttonText: "Album",
                to: itemUrl(item),
            } as ItemCollection;
        }
        return null;
    };

    const setContextMenuItem = (e: MouseEvent, item: any) => {
        contextMenu.value.item = item;
        contextMenu.value.show = true;
        contextMenu.value.x = e.pageX;
        contextMenu.value.y = e.pageY;
    };

    function addSnack(text: string, timeout = 4000) {
        let snack = {
            text,
            timeout,
            open: true,
        };
        snackbars.value.push(snack);
        setTimeout(() => {
            snack.open = false;
            snackbars.value.splice(snackbars.value.indexOf(snack), 1);
        }, timeout + 500);
    }

    const waitFor = (name: string) =>
        new Promise((resolve) => events.once(name, resolve));
    const radioId = () => Math.random().toString().replace(".", "");

    return {
        radioId,
        itemUrl,
        itemImage,
        itemDescription,
        msToReadable,
        approximateDuration,
        albumString,
        themeColor,
        themeColorDark,
        themeColorLight,
        setContextMenuItem,
        contextMenu,
        sourceDialog,
        sourceSelectedId,
        contrastToForeground,
        themeTooSimilarToFg,
        itemCollection,
        snackbars,
        dbLoaded,
        events,
        waitFor,
        addSnack,
        windowHeight,
        windowWidth,
        encodeUrlName,
        caps,
        isDark,
        exportToServer,
        importData,
    };
});
