import {Model} from '@nozbe/watermelondb';
import {relation} from '@nozbe/watermelondb/decorators';

export default class AlbumArtist extends Model {
  static table = 'album_artists';

  @relation('albums', 'album_id') album;
  @relation('artists', 'artist_id') artist;
}
