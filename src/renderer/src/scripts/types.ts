export interface YouTubeTrackInfo {
    duration: number;
    description: string;
    channel: string;
    title: string;
    thumbnail: string;
    id: string;
    channelUrl: string;
    channelId: string;
    playlist: string;
    playlistId: string;
    viewCount: number;
    uploadDate: string;
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

export interface ExtendedPlaylistTrack extends SpotifyApi.PlaylistTrackObject {
    searchString: string;
    artistString: string;
    id: string;
    title: string;
    added_at_reverse: number;
    track: EditedTrack,
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
    loaded?: number;
    total?: number;
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

export interface EditedTrack extends SpotifyApi.TrackObjectFull {
    startTime?: number;
    endTime?: number;
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
