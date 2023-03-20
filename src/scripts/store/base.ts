import {defineStore} from 'pinia'
import {openDB} from "idb";

export interface Item {
    type: string,
    display_name: string,
    description: string,
    name: string,
    id: string,
    to: string,
    images: { url: string }[],
    album_type: string,
    artists: { name: string }[]
}

export const baseDb = openDB("base", 1, {
    upgrade(db, oldVersion, newVersion, transaction, event) {
        db.createObjectStore('spotify');
        console.log('db upgrade', {oldVersion, newVersion, transaction, event});
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
    function approximateDuration(millis: number) {
        if (millis > 7200000)
            return Math.round(millis / 3600000) + ' hours';
        let minutes = Math.round(millis / 60000);
        return minutes + ' minute' + (minutes === 1 ? '' : 's');
    }

    function albumString(item: SpotifyApi.AlbumObjectFull) {
        // @ts-ignore
        return `${item.total_tracks} track${item.total_tracks === 1 ? '' : 's'} • ${item.artists.map(a => a.name).join(', ')} • ${item.release_date.substring(0, 4)} • ${caps(item.album_type)}`;
    }

    function msToReadable(millis: number) {
        if (isNaN(millis) || millis === undefined)
            return '0:00';

        let seconds = Math.round(millis / 1000);
        let h = Math.floor(seconds / 3600);
        let m = Math.floor((seconds % 3600) / 60);
        let s = seconds % 60;
        let hString = h.toString();
        let mString = m.toString();
        let sString = s.toString();
        if (hString !== '0') {
            mString = mString.padStart(2, '0');
            sString = sString.padStart(2, '0');
        }
        sString = sString.padStart(2, '0');

        if (hString === '0')
            return `${mString}:${sString}`;
        else return `${hString}:${mString}:${sString}`;
    }

    function itemDescription(item: Item) {
        if (item.type === 'album') {
            return `${caps(item.album_type)} • ${item.artists.map(a => a.name).join(', ')}`
        }
        if (item.description !== null) {
            return item.description;
        }
        return '';
    }

    function caps(str: string) {
        return str[0].toUpperCase() + str.slice(1);
    }

    function itemImage(item: Item) {
        let image = item.images?.[0]?.url;
        if (image === null) {
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

    const itemUrl = (item: Item) => {
        let type = item.type || 'category';
        let name = type === 'user' ? item.display_name : item.name;
        if (type === 'category')
            return `${type}/${item.id}`;
        if (type === 'radio')
            return '';
        if (type === 'search')
            return item.to;
        if (type === 'liked')
            return '/library/tracks';
        return `/${type}/${encodeUrlName(name)}/${item.id}`;
    }

    return {itemUrl, itemImage, itemDescription, msToReadable, approximateDuration, albumString}
})