import {defineStore} from 'pinia'
import {baseDb} from './base'
import SpotifyWebApi from "spotify-web-api-js";
import type {IDBPDatabase} from "idb";
import {useLibraryStore} from "./library";

export const useSpotifyApiStore = defineStore('spotify-api', () => {
    const library = useLibraryStore()
    let db: IDBPDatabase
    baseDb.then(r => db = r)

    // Spotify API Stuff
    const api = new SpotifyWebApi()

    function findPagination(object: any): Function | false {
        if (object === null)
            return false

        let getKeyPath: Function;
        getKeyPath = ({keys: keyPath = [], o}: { keys: any, o: any }) => {
            if (o !== null && o.hasOwnProperty('next') && o.hasOwnProperty('items'))
                return [true, keyPath];
            if (typeof o !== 'object' || o === null)
                return [false, keyPath.slice(0, -1)];

            for (let key in o) {
                if (!o.hasOwnProperty(key))
                    continue;
                let result;
                [result, keyPath] = getKeyPath({keys: keyPath.concat(key), o: o[key]});
                if (result)
                    return [true, keyPath];
            }
            return [false, keyPath.slice(0, -1)];
        }

        let [success, keyPath] = getKeyPath({o: object});

        if (!success)
            return false;
        return (r: any) => {
            for (let key of keyPath)
                r = r[key];
            return r;
        }
    }

    async function* retrieveArray(apiFunction: Function) {
        let getData = () => apiFunction()

        while (true) {
            let result = await getData()
            let pageObject = findPagination(result)

            if (result !== null)
                yield result;

            if (result === null || pageObject === false || pageObject(result).next === null)
                break;

            let nextUrl = pageObject(result).next;
            if (nextUrl === undefined)
                console.warn("next url is undefined");

            getData = () => api.getGeneric(nextUrl);
        }
    }

    const getPlaylist = async (id: string) => {
        await baseDb;
        return api.getPlaylist(id)
    }
    const getAlbum = async (id: string) => {
        await baseDb;
        return api.getAlbum(id)
    }
    const getArtist = async (id: string) => {
        await baseDb;
        return api.getArtist(id)
    }
    const getArtistAlbums = async (id: string) => {
        await baseDb;
        return api.getArtistAlbums(id)
    }
    const getArtistRelatedArtists = async (id: string) => {
        await baseDb;
        return api.getArtistRelatedArtists(id)
    }
    const getArtistTopTracks = async (id: string) => {
        await baseDb;
        return api.getArtistTopTracks(id, library.userInfo.country)
    }
    const getUser = async (id: string) => {
        await baseDb;
        return api.getUser(id)
    }
    const getUserPlaylists = async (id: string) => {
        await baseDb;
        return api.getUserPlaylists(id)
    }
    const getTrack = async (id: string) => {
        await baseDb;
        return api.getTrack(id)
    }
    const getMe = async () => {
        await baseDb;
        return api.getMe()
    }
    const getMySavedTracks = async (options: Object | undefined = undefined) => {
        await baseDb;
        return api.getMySavedTracks(options)
    }

    const search = async (query: string, types: ("playlist" | "album" | "artist" | "track")[], options: SpotifyApi.SearchForItemParameterObject | undefined = undefined) => {
        await baseDb;
        return api.search(query, types, options)
    }


    return {
        getPlaylist,
        getAlbum,
        getArtist,
        getArtistAlbums,
        getArtistRelatedArtists,
        getArtistTopTracks,
        getUser,
        getUserPlaylists,
        getTrack,
        search,
        getMe,
        api,
        retrieveArray,
        getMySavedTracks,
    }
})