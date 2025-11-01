import { Album, Artist, Playlist, Track, User } from "../interface/types";

/**
 * MetadataProvider defines the "contract" that any
 * metadata source (API, database, etc.) must follow.
 * 
 * It abstracts away the source — so the rest of your app
 * doesn’t care *where* the data came from.
 */

export abstract class MetadataProvider {
  abstract getAlbum(id: string): Promise<Album>;
  // abstract getAlbums(id: string): Promise<Album[]>;
  // abstract getAlbumTracks(albumId: string): Promise<Track[]>;

  abstract getTrack(id: string): Promise<Track>;
  // abstract getTracks(ids: string[]): Promise<Track[]>; // for batch loading
  // abstract searchTracks(query: string): Promise<{ tracks: Track[] }>;

  // abstract getArtist(id: string): Promise<Artist>;
  // abstract getArtistAlbums(artistId: string): Promise<Album[]>;

  // abstract getPlaylist(id: string): Promise<Playlist>;
  // abstract getUserPlaylists(userId: string): Promise<Playlist[]>;

  // abstract getUserProfile(id: string): Promise<User>;
  abstract search(query: string): Promise<{
    tracks: Track[];
    albums?: Album[];
    artists?: Artist[];
    playlists?: Playlist[];
  }>;

}