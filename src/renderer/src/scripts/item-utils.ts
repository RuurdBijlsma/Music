import { Item, ItemCollection } from './types'
import { randomNotFound } from './image-sources'
import { caps, encodeUrlName } from './utils'

export function albumString(item: SpotifyApi.AlbumObjectFull | any) {
    return `${item.total_tracks} track${item.total_tracks === 1 ? '' : 's'} • ${item.artists
        .map((a) => a.name)
        .join(', ')} • ${item.release_date.substring(0, 4)} • ${caps(item.album_type)}`
}

export function itemDescription(item: Item) {
    if (item.type === 'album') {
        return `${caps(item?.album_type ?? '')} • ${(item?.artists ?? [])
            .map((a) => a.name)
            .join(', ')}`
    }
    if (item.type !== 'playlist') return ''
    return item.description ?? ''
}

export function itemImage(item: Item) {
    let image
    if (item.type === 'track') {
        image = item?.album?.images?.[0]?.url
    } else {
        image = item.images?.[0]?.url
    }
    if (image === null || image === undefined) {
        return randomNotFound()
    }
    return image
}

export function itemUrl(item: Item | any) {
    if (item === null) return ''
    if ('buttonText' in item) {
        return item.to
    }
    const type = item.type || 'category'
    let name = type === 'user' ? item.display_name : item.name
    name ??= ''
    if (type === 'category') return `${type}/${encodeUrlName(name)}/${item.id}`
    if (type === 'radio') return ''
    if (type === 'search') return item.to ?? '/'
    if (type === 'liked') return '/library/tracks'
    return `/${type}/${encodeUrlName(name)}/${item.id}`
}

export function itemCollection(item: Item, tracks: SpotifyApi.TrackObjectFull[] | null = null) {
    if (item.type === 'playlist') {
        if (tracks === null)
            tracks = item.tracks.items.map((t) => t.track as SpotifyApi.TrackObjectFull)
        return {
            id: item.id ?? 'playlist',
            tracks: tracks,
            type: 'playlist',
            context: item,
            name: item.name ?? 'Playlist',
            buttonText: 'Playlist',
            to: itemUrl(item)
        } as ItemCollection
    } else if (item.type === 'artist') {
        return {
            id: item.id ?? 'artist',
            tracks: tracks ?? [],
            type: 'artist',
            context: item,
            name: item.name ?? 'Artist',
            buttonText: 'Artist',
            to: itemUrl(item)
        } as ItemCollection
    } else if (item.type === 'album') {
        if (tracks === null && item.tracks !== undefined)
            tracks = item.tracks.items as SpotifyApi.TrackObjectFull[]
        return {
            id: item.id ?? 'album',
            tracks: tracks ?? [],
            type: 'album',
            context: item,
            name: item.name ?? 'Album',
            buttonText: 'Album',
            to: itemUrl(item)
        } as ItemCollection
    }
    return null
}

export const radioId = () => Math.random().toString().replace('.', '')
