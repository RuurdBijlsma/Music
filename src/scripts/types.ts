// export interface Item {
//     type: ItemType
//     display_name: string
//     description: string
//     name: string
//     id: string
//     to: string
//     album_type: string
//     artists: SpotifyApi.ArtistObjectSimplified[]
//     album: Item
//     duration_ms: number
//     external_ids: SpotifyApi.ExternalIdObject
//     popularity: number
//     available_markets?: string[]
//     disc_number: number
//     explicit: boolean
//     external_urls: SpotifyApi.ExternalUrlObject
//     href: string
//     is_playable?: boolean
//     linked_from?: SpotifyApi.TrackLinkObject
//     preview_url: string
//     track_number: number
//     uri: string
//     followers: SpotifyApi.FollowersObject
//     genres: string[]
//     images: SpotifyApi.ImageObject[]
// }

export interface ExtendedPlaylistTrack extends SpotifyApi.PlaylistTrackObject {
    searchString: string,
    artistString: string,
    id: string,
    title: string,
    added_at_reverse: number,
}

export type Item =
    SpotifyApi.PlaylistObjectFull
    | SpotifyApi.TrackObjectFull
    | SpotifyApi.AlbumObjectFull
    | SpotifyApi.ArtistObjectFull

export interface ItemCollection {
    id: string,
    tracks: SpotifyApi.TrackObjectFull[],
    type: CollectionType,
    context?: Item,
    loaded?: number,
    total?: number,
}

export type CollectionType = 'radio' | 'search' | 'liked' | 'artist' | 'playlist' | 'album' | 'category'
export type ItemType = 'track' | 'playlist' | 'album' | 'artist' | 'category'