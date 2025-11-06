// database/index.ts
import {Database} from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

// Models
import User from './models/User';
import Artist from './models/Artist';
import Album from './models/Album';
import Track from './models/Track';
import Playlist from './models/Playlist';
import PlaylistTrack from './models/PlaylistTrack';
import ArtistTrack from './models/ArtistTrack';
import AlbumArtist from './models/AlbumArtist';
import LibraryObject from './models/LibraryObject';
import PlaybackState from './models/PlaybackState';
import Download from './models/Download';
import {musicSchema} from './schema';
import {migrations} from './migrations';

const adapter = new SQLiteAdapter({
  schema: musicSchema,
  migrations,
});

export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Artist,
    Album,
    Track,
    Playlist,
    PlaylistTrack,
    ArtistTrack,
    AlbumArtist,
    LibraryObject,
    PlaybackState,
    Download,
  ],
});
