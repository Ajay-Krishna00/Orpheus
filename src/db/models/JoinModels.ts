// src/models/JoinModels.ts
import { Model } from '@nozbe/watermelondb'
import { relation } from '@nozbe/watermelondb/decorators'

export class AlbumArtist extends Model {
  static table = 'album_artists'
  @relation('albums', 'album_id') album
  @relation('artists', 'artist_id') artist
}

export class ArtistTrack extends Model {
  static table = 'artist_tracks'
  @relation('artists', 'artist_id') artist
  @relation('tracks', 'track_id') track
}

export class PlaylistTrack extends Model {
  static table = 'playlist_tracks'
  @relation('playlists', 'playlist_id') playlist
  @relation('tracks', 'track_id') track
}

// ... you would also create models for all your 'library_' join tables
// e.g., LibraryLikedTrack, LibraryLikedAlbum, etc.