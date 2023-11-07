export interface YouTubeTrack {
    description: string;
    channelUrl: string;
    channelId: string;
    playlist: string;
    playlistId: string;
    viewCount: number;
    uploadDate: string;
    id: string;
    duration: number;
    channel: string;
    title: string;
    thumbnails?: { url: string; height: number; width: number }[];
    thumbnail:string,
}

export interface YouTubeSearchResult {
    channelTitle: string;
    id: string;
    length: { simpleText: string };
    thumbnail: { thumbnails: { url: string; width: number; height: number }[] };
    title: string;
}

export interface SearchResult {
    youtube: {
        tracks: SpotifyApi.TrackObjectFull[];
        loading: boolean;
    };
    spotify: {
        data: {
            tracks: SpotifyApi.TrackObjectFull[];
            playlists: SpotifyApi.PlaylistObjectFull[];
            albums: SpotifyApi.AlbumObjectFull[];
            artists: SpotifyApi.ArtistObjectFull[];
        };
        loading: boolean;
    };
    liked: {
        tracks: SpotifyApi.TrackObjectFull[];
        loading: boolean;
    };
}

export type Item =
    | SpotifyApi.PlaylistObjectFull
    | SpotifyApi.TrackObjectFull
    | SpotifyApi.AlbumObjectFull
    | SpotifyApi.ArtistObjectFull;

export interface ItemCollection {
    id: string;
    tracks: SpotifyApi.TrackObjectFull[];
    type: CollectionType;
    context?: Item;
    name: string;
    buttonText: string;
    to: string;
}

export interface DownloadState {
    total: number;
    downloaded: number;
    canceled: boolean;
    loading: boolean;
}

export interface TrackChanges {
    title: string;
    artists: string[];
    startTime: number;
    endTime: number;
    id: string;
    original: {
        title: string;
        artists: string[];
        endTime: number;
    };
}

export type CollectionType =
    | "radio"
    | "search"
    | "liked"
    | "artist"
    | "playlist"
    | "album"
    | "category"
    | "youtube";
export type ItemType = "track" | "playlist" | "album" | "artist" | "category";

export interface TrackBars {
    binSize: number;
    binWidth: number;
    barSpacing: number;
    binPos: number[];
    binNeg: number[];
    maxVolume: number;
}

export interface MetaTrackBars {
    trackBars: TrackBars;
    canvasWidth: number;
    binWidth: number;
    barSpacing: number;
    barCount: number;
    empty: boolean;
}

export interface TrackData {
    path?: string;
    track: SpotifyApi.TrackObjectFull;
    metadata: TrackMetadata;
    likedInfo?: LikedTrack;
}

export interface LikedTrack extends SpotifyApi.PlaylistTrackObject {
    searchString: string;
    artistString: string;
    id: string;
    title: string;
    added_at_reverse: number;
    track: SpotifyApi.TrackObjectFull;
    original: {
        name: string;
        artists: string[];
    };
    startTime?: number;
    endTime?: number;
}

export interface TrackMetadata {
    sourceDuration?: number;
    id: string;
    trackBars?: MetaTrackBars;
    volume?: {
        mean: number;
        peak: number;
    };
    imageColor?: {
        light: string;
        dark: string;
    };
    youTubeSource?: string;
}

export interface DataExport {
    localStorage: { [key: string]: string };
    idb: {
        artistStats: {
            [key: string]: {
                name: string;
                skips: number;
                listenMinutes: number;
                history: { [key: string]: number };
            };
        };
        collectionStats: {
            [key: string]: {
                name: string;
                skips: number;
                listenMinutes: number;
            };
        };
        spotify: {
            library: {
                playlist: SpotifyApi.PlaylistObjectFull[];
                artist: SpotifyApi.ArtistObjectFull[];
                album: SpotifyApi.AlbumObjectFull[];
            };
            offlineCollections: Set<string>;
            recentPlays: ItemCollection[];
            view: {
                homePage: {
                    featured: {
                        title: string | undefined;
                        playlists: SpotifyApi.PlaylistObjectSimplified[];
                    };
                    newReleases: any[];
                    personalized: any[];
                };
                playlist: any;
                album: any;
                artist: any;
                category: any;
                user: any;
            };
        };
        statistics: {
            historyMinutes: { [key: string]: number };
            listenCount: number;
            listenMinutes: number;
            popularityHistory: {
                [key: string]: { listenCount: number; popularitySum: 1017 };
            };
            skips: number;
        };
        trackStats: {
            [key: string]: {
                track: SpotifyApi.TrackObjectFull;
                listenCount: number;
                skips: number;
                listenMinutes: number;
            };
        };
        trackMetadata: TrackMetadata[];
        tracks: LikedTrack[];
    };
}
