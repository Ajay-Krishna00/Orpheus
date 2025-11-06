import {appSchema, tableSchema} from '@nozbe/watermelondb';

export const musicSchema = appSchema({
  version: 3,
  tables: [
    // -----------------------------
    // USERS
    // -----------------------------
    tableSchema({
      name: 'users',
      columns: [
        {name: 'username', type: 'string'},
        {name: 'display_name', type: 'string'},
        {name: 'email', type: 'string', isOptional: true},
        {name: 'avatar_url', type: 'string', isOptional: true},
        {name: 'followers_count', type: 'number', isOptional: true},
        {name: 'following_count', type: 'number', isOptional: true},
        {name: 'country', type: 'string', isOptional: true},
      ],
    }),

    // -----------------------------
    // ARTISTS
    // -----------------------------
    tableSchema({
      name: 'artists',
      columns: [
        {name: 'name', type: 'string'},
        {name: 'external_uri', type: 'string'},
        {name: 'images_json', type: 'string', isOptional: true},
      ],
    }),

    // -----------------------------
    // ALBUMS
    // -----------------------------
    tableSchema({
      name: 'albums',
      columns: [
        {name: 'name', type: 'string'},
        {name: 'images_json', type: 'string', isOptional: true},
        {name: 'release_date', type: 'string', isOptional: true},
        {name: 'total_tracks', type: 'number', isOptional: true},
        {name: 'album_type', type: 'string'}, // album | single | compilation
      ],
    }),

    // -----------------------------
    // ALBUM ↔ ARTIST (many-to-many)
    // -----------------------------
    tableSchema({
      name: 'album_artists',
      columns: [
        {name: 'album_id', type: 'string', isIndexed: true},
        {name: 'artist_id', type: 'string', isIndexed: true},
      ],
    }),

    // -----------------------------
    // TRACKS
    // -----------------------------
    tableSchema({
      name: 'tracks',
      columns: [
        {name: 'name', type: 'string'},
        {name: 'duration_ms', type: 'number'},
        {name: 'explicit', type: 'boolean'},
        {name: 'external_uri', type: 'string'},
        {name: 'album_id', type: 'string', isIndexed: true},
      ],
    }),

    // -----------------------------
    // ARTIST ↔ TRACK (many-to-many)
    // -----------------------------
    tableSchema({
      name: 'artist_tracks',
      columns: [
        {name: 'artist_id', type: 'string', isIndexed: true},
        {name: 'track_id', type: 'string', isIndexed: true},
      ],
    }),

    // -----------------------------
    // PLAYLISTS
    // -----------------------------
    tableSchema({
      name: 'playlists',
      columns: [
        {name: 'name', type: 'string'},
        {name: 'description', type: 'string', isOptional: true},
        {name: 'images_json', type: 'string', isOptional: true},
        {name: 'public', type: 'boolean'},
        {name: 'collaborative', type: 'boolean'},
        {name: 'owner_id', type: 'string', isIndexed: true},
      ],
    }),

    // -----------------------------
    // PLAYLIST ↔ TRACK (many-to-many)
    // -----------------------------
    tableSchema({
      name: 'playlist_tracks',
      columns: [
        {name: 'playlist_id', type: 'string', isIndexed: true},
        {name: 'track_id', type: 'string', isIndexed: true},
        {name: 'created_at', type: 'number'},
      ],
    }),

    // -----------------------------
    // LIBRARY OBJECT (per user)
    // -----------------------------
    tableSchema({
      name: 'library_objects',
      columns: [{name: 'user_id', type: 'string', isIndexed: true}],
    }),

    // -----------------------------
    // LIBRARY ↔ LIKED TRACKS / ALBUMS / ARTISTS / PLAYLISTS
    // -----------------------------
    tableSchema({
      name: 'library_liked_tracks',
      columns: [
        {name: 'library_id', type: 'string', isIndexed: true},
        {name: 'track_id', type: 'string', isIndexed: true},
      ],
    }),

    tableSchema({
      name: 'library_liked_albums',
      columns: [
        {name: 'library_id', type: 'string', isIndexed: true},
        {name: 'album_id', type: 'string', isIndexed: true},
      ],
    }),

    tableSchema({
      name: 'library_followed_artists',
      columns: [
        {name: 'library_id', type: 'string', isIndexed: true},
        {name: 'artist_id', type: 'string', isIndexed: true},
      ],
    }),

    tableSchema({
      name: 'library_playlists',
      columns: [
        {name: 'library_id', type: 'string', isIndexed: true},
        {name: 'playlist_id', type: 'string', isIndexed: true},
      ],
    }),

    // -----------------------------
    // PLAYBACK STATE
    // -----------------------------
    tableSchema({
      name: 'playback_state',
      columns: [
        {name: 'current_track_id', type: 'string', isOptional: true},
        // The whole queue (e.g., tracks from an album or playlist)
        {name: 'queue_json', type: 'string'},
        // The user's settings
        {name: 'shuffle', type: 'boolean'},
        {name: 'repeat_mode', type: 'string'},
        // The *last known* progress, saved only on pause or exit
        {name: 'last_progress_ms', type: 'number', isOptional: true},
      ],
    }),

    // -----------------------------
    // DOWNLOADS (Offline Support)
    // -----------------------------
    tableSchema({
      name: 'downloads',
      columns: [
        {name: 'track_id', type: 'string', isIndexed: true},
        {name: 'local_file_path', type: 'string'},
      ],
    }),
  ],
});
