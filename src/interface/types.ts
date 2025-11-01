//From now on, your UI components will only receive objects that look like this. They don't care if the data came from Spotify, MusicBrainz, or the local database. This makes your UI simple and reusable.
export interface Artist {
  id: string;
  name: string;
  externalUri: string;
  images?: { uri: string }[];
}

export interface Album {
  id: string;
  name: string;
  images?: { uri: string }[];
  releaseDate?: string;
  totalTracks?: number;
  albumType: 'album' | 'single' | 'compilation';
  artists: Artist[]; // Normalized: linked via album_artists
}

export interface Track {
  id: string;
  name: string;
  durationMs: number;
  album: Album;       // Normalized: linked via album_id
  artists: Artist[];  // Normalized: linked via artist_tracks
  externalUri: string;
  explicit: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  images?: { uri: string }[];
  public: boolean;
  collaborative: boolean;
  owner: User;       // Normalized: linked via owner_id
  tracks: Track[];   // Normalized: linked via playlist_tracks
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  followersCount?: number;
  followingCount?: number;
  country?: string;
}

export interface PlaybackState {
  currentTrack: Track | null; // via current_track_id
  queue: Track[];             // stored as JSON array of IDs
  isPlaying: boolean;
  shuffle: boolean;
  repeatMode: 'off' | 'track' | 'context';
  progressMs: number;
  volume: number;
}

export interface LibraryObject {
  likedTracks: Track[];     // via library_liked_tracks
  likedAlbums: Album[];     // via library_liked_albums
  followedArtists: Artist[]; // via library_followed_artists
  playlists: Playlist[];     // via library_playlists
}
