import {defineStore} from 'pinia'
import {openDB} from "idb";
import {computed, ref} from "vue";
import {useTheme} from "vuetify";
import type {Item} from "../types";

export const baseDb = openDB("base", 1, {
    upgrade(db, oldVersion, newVersion, transaction, event) {
        db.createObjectStore('trackBars')
        db.createObjectStore('spotify')
        const trackStore = db.createObjectStore('tracks', {keyPath: 'id'})
        trackStore.createIndex('searchString', 'searchString', {unique: false})
        trackStore.createIndex('title', 'title', {unique: false})
        trackStore.createIndex('artist', 'artistString', {unique: false})
        trackStore.createIndex('oldToNew', 'added_at', {unique: false})
        trackStore.createIndex('newToOld', 'added_at_reverse', {unique: false})
        console.log('db upgrade', {oldVersion, newVersion, transaction, event});
        db.createObjectStore('cache')
        db.createObjectStore('nameToId')
    },
    blocked(currentVersion, blockedVersion, event) {
        console.log('db blocked', {currentVersion, blockedVersion, event});
    },
    blocking(currentVersion, blockedVersion, event) {
        console.log('db blocking', {currentVersion, blockedVersion, event});
    },
    terminated() {
        console.log('db terminated');
    },
});

export const useBaseStore = defineStore('base', () => {
    const theme = useTheme()
    const themeColorDark = ref('#FFFFFF')
    const themeColorLight = ref('#000000')
    const themeColor = computed(() => theme.global.name.value === 'dark' ? themeColorDark : themeColorLight)

    const contextMenu = ref({
        x: 0,
        y: 0,
        show: false,
        item: null as any,
    })

    const sourceDialog = ref({
        show: false,
        items: [] as any[],
        loading: false,
        tempTrackOverride: {
            ytId: '',
            trackId:'',
        },
        spotifyTrack: null as SpotifyApi.TrackObjectFull | null,
    })
    const sourceSelectedId = ref('')

    function approximateDuration(millis: number) {
        if (millis > 7200000)
            return Math.round(millis / 3600000) + ' hours';
        let minutes = Math.round(millis / 60000);
        return minutes + ' minute' + (minutes === 1 ? '' : 's');
    }

    function albumString(item: SpotifyApi.AlbumObjectFull | any) {
        // @ts-ignore
        return `${item.total_tracks} track${item.total_tracks === 1 ? '' : 's'} • ${item.artists.map(a => a.name).join(', ')} • ${item.release_date.substring(0, 4)} • ${caps(item.album_type)}`;
    }

    function msToReadable(millis: number) {
        if (isNaN(millis) || millis === undefined)
            return '0:00';

        let seconds = Math.round(millis / 1000);
        let h = Math.floor(seconds / 3600)
        let m = Math.floor((seconds % 3600) / 60)
        let s = seconds % 60
        let hString = h.toString()
        let mString = m.toString()
        let sString = s.toString()
        if (hString !== '0') {
            mString = mString.padStart(2, '0')
            sString = sString.padStart(2, '0')
        }
        sString = sString.padStart(2, '0')

        if (hString === '0')
            return `${mString}:${sString}`
        else return `${hString}:${mString}:${sString}`
    }

    function itemDescription(item: Item) {
        if (item.type === 'album') {
            return `${caps(item?.album_type ?? "")} • ${(item?.artists ?? []).map(a => a.name).join(', ')}`
        }
        if (item.type !== 'playlist') return ''
        return item.description ?? ""
    }

    function caps(str: string) {
        return str[0].toUpperCase() + str.slice(1);
    }

    function itemImage(item: Item) {
        let image;
        if (item.type === 'track') {
            image = item?.album?.images?.[0]?.url
        } else {
            image = item.images?.[0]?.url
        }
        if (image === null || image === undefined) {
            return 'img/notfound/' + (1 + Math.floor(Math.random() * 7)) + '.png'
        }
        return image;
    }

    const encodeUrlName = (name: string) => {
        let toEncode = name.toLowerCase().replace(/ /gi, '-').slice(0, 36);
        let encoded: string;
        try {
            encoded = encodeURIComponent(toEncode);
        } catch (e) {
            encoded = toEncode.replace(/[^a-z0-9]/gi, '');
            console.warn(`Couldn't uri encode ${toEncode}, changed to ${encoded}`);
        }
        return encoded;
    }

    const itemUrl = (item: Item | any) => {
        let type = item.type || 'category';
        let name = type === 'user' ? item.display_name : item.name;
        name ??= ''
        if (type === 'category')
            return `${type}/${item.id}`;
        if (type === 'radio')
            return '';
        if (type === 'search')
            return item.to ?? "/";
        if (type === 'liked')
            return '/library/tracks';
        return `/${type}/${encodeUrlName(name)}/${item.id}`;
    }

    const notFoundImage = () => {
        let i = Math.floor(Math.random() * 7) + 1;
        return `img/notfound/${i}.png`;
    }

    const searchValue = ref("");

    const setContextMenuItem = (e: MouseEvent, item: any) => {
        contextMenu.value.item = item
        contextMenu.value.show = true
        contextMenu.value.x = e.pageX
        contextMenu.value.y = e.pageY
    }

    return {
        itemUrl,
        itemImage,
        itemDescription,
        msToReadable,
        approximateDuration,
        albumString,
        notFoundImage,
        searchValue,
        themeColor,
        themeColorDark,
        themeColorLight,
        setContextMenuItem,
        contextMenu,
        sourceDialog,
        sourceSelectedId,
    }
})