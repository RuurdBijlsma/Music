export interface YouTubeTrack {
    description: string
    channelUrl: string
    channelId: string
    playlist: string
    playlistId: string
    viewCount: number
    uploadDate: Date
    id: string
    duration: number
    channel: string
    title: string
    thumbnails?: { url: string; height: number; width: number }[]
    thumbnail: string
}

export interface YouTubeSearchResult {
    channelTitle: string
    id: string
    length: { simpleText: string }
    thumbnail: { thumbnails: { url: string; width: number; height: number }[] }
    title: string
}

export interface SearchResult {
    youtube: {
        tracks: SpotifyApi.TrackObjectFull[]
        loading: boolean
    }
    spotify: {
        data: {
            tracks: SpotifyApi.TrackObjectFull[]
            playlists: SpotifyApi.PlaylistObjectFull[]
            albums: SpotifyApi.AlbumObjectFull[]
            artists: SpotifyApi.ArtistObjectFull[]
        }
        loading: boolean
    }
    liked: {
        tracks: SpotifyApi.TrackObjectFull[]
        loading: boolean
    }
}

export type Item =
    | SpotifyApi.PlaylistObjectFull
    | SpotifyApi.TrackObjectFull
    | SpotifyApi.AlbumObjectFull
    | SpotifyApi.ArtistObjectFull

export interface ItemCollection {
    id: string
    tracks: SpotifyApi.TrackObjectFull[]
    type: CollectionType
    context?: Item
    name: string
    buttonText: string
    to: string
}

export interface DownloadState {
    total: number
    downloaded: number
    canceled: boolean
    loading: boolean
}

export interface TrackChanges {
    title: string
    artists: string[]
    startTime: number
    endTime: number
    id: string
    original: {
        title: string
        artists: string[]
        endTime: number
    }
}

export type CollectionType =
    | 'radio'
    | 'search'
    | 'liked'
    | 'artist'
    | 'playlist'
    | 'album'
    | 'category'
    | 'wrapped'
    | 'youtube'
export type ItemType = 'track' | 'playlist' | 'album' | 'artist' | 'category'

export interface TrackBars {
    binSize: number
    binWidth: number
    barSpacing: number
    binPos: number[]
    binNeg: number[]
    maxVolume: number
}

export interface MetaTrackBars {
    trackBars: TrackBars
    canvasWidth: number
    binWidth: number
    barSpacing: number
    barCount: number
    empty: boolean
}

export interface TrackData {
    path?: string
    track: SpotifyApi.TrackObjectFull
    metadata: TrackMetadata
    likedInfo?: LikedTrack
}

export interface LikedTrack extends SpotifyApi.PlaylistTrackObject {
    searchString: string
    artistString: string
    id: string
    title: string
    added_at_reverse: number
    track: SpotifyApi.TrackObjectFull
    original: {
        name: string
        artists: string[]
    }
    startTime?: number
    endTime?: number
}

export interface SpotifyTrack extends SpotifyApi.TrackObjectFull {
    is_local?: boolean
}

export interface TrackMetadata {
    sourceDuration?: number
    id: string
    trackBars?: MetaTrackBars
    volume?: {
        mean: number
        peak: number
    }
    imageColor?: {
        light: string
        dark: string
    }
    youTubeSource?: string
}

export interface ArtistStat {
    id: string
    artist: SpotifyApi.ArtistObjectSimplified

    skips: number
    listenMinutes: number
    history: { [key: string]: number }
}

export interface CollectionStat {
    id: string
    name: string
    context?: Item
    to: string
    buttonText: string

    skips: number
    listenMinutes: number
}

export interface TrackStat {
    id: string
    track: SpotifyApi.TrackObjectFull

    listenCount: number
    skips: number
    listenMinutes: number
    skipPercentage?: number
}

export interface Notification {
    show?: boolean
    icon?: string
    title: string
    description: string
    dismissText: string
    viewText: string
    action: Function
}

export interface Statistics {
    historyMinutes: { [key: string]: number }
    listenCount: number
    listenMinutes: number
    skips: number
    popularity: {
        [key: string]: { minutes: number; sum: number }
    }
    acousticness: {
        [key: string]: { minutes: number; sum: number }
    }
    danceability: {
        [key: string]: { minutes: number; sum: number }
    }
    duration: {
        [key: string]: { minutes: number; sum: number }
    }
    energy: {
        [key: string]: { minutes: number; sum: number }
    }
    instrumentalness: {
        [key: string]: { minutes: number; sum: number }
    }
    key: {
        [key: string]: { minutes: number; sum: number }
    }
    liveness: {
        [key: string]: { minutes: number; sum: number }
    }
    loudness: {
        [key: string]: { minutes: number; sum: number }
    }
    mode: {
        [key: string]: { minutes: number; sum: number }
    }
    speechiness: {
        [key: string]: { minutes: number; sum: number }
    }
    tempo: {
        [key: string]: { minutes: number; sum: number }
    }
    timeSignature: {
        [key: string]: { minutes: number; sum: number }
    }
    valence: {
        [key: string]: { minutes: number; sum: number }
    }
}

export interface DataExport {
    localStorage: { [key: string]: string }
    idb: {
        artistStats: ArtistStat[]
        collectionStats: CollectionStat[]
        trackStats: TrackStat[]
        statistics: Statistics
        spotify: {
            library: {
                playlist: SpotifyApi.PlaylistObjectFull[]
                artist: SpotifyApi.ArtistObjectFull[]
                album: SpotifyApi.AlbumObjectFull[]
            }
            offlineCollections: Set<string>
            recentPlays: ItemCollection[]
            view: {
                homePage: {
                    featured: {
                        title: string | undefined
                        playlists: SpotifyApi.PlaylistObjectSimplified[]
                    }
                    newReleases: any[]
                    personalized: any[]
                }
                playlist: any
                album: any
                artist: any
                category: any
                user: any
            }
        }
        trackMetadata: TrackMetadata[]
        tracks: LikedTrack[]
    }
}

export interface ChartData {
    labels: Date[]
    values: number[]
    dataLabel: string
    xAxis?: string
    yAxis?: string
}
