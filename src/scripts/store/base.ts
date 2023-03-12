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

export const baseDb = await openDB("base", 1, {
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
        console.log('itemimage', item);
        let image = item.images?.[0]?.url;
        if (image === null) {
            return 'img/notfound/' + (1 + Math.floor(Math.random() * 7)) + '.png'
        }
        return image;
    }

    function encodeUrlName(name: string) {
        let toEncode = name.toLowerCase().replace(/ /gi, '-').slice(0, 36);
        let encoded: string;
        try {
            encoded = encodeURIComponent(toEncode);
        } catch (e) {
            encoded = toEncode.replace(/[^a-z0-9]/gi, '');
            console.warn(`Couldn't uri encode ${toEncode}, changed to ${encoded}`);
        }
        console.log({name, toEncode, encoded});
        return encoded;
    }

    function itemUrl(item: Item) {
        let type = item.type || 'category';
        let name = type === 'user' ? item.display_name : item.name;
        if (type === 'category')
            return `${type}/${item.id}`;
        if (type === 'radio')
            return null;
        if (type === 'search')
            return item.to;
        if (type === 'liked')
            return '/library/tracks';
        return `/${type}/${encodeUrlName(name)}/${item.id}`;
    }

    return {itemUrl, itemImage, itemDescription}
})