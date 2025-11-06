import {Model} from '@nozbe/watermelondb';
import {relation} from '@nozbe/watermelondb/decorators';

export default class ArtistTrack extends Model {
  static table = 'artist_tracks';

  @relation('artists', 'artist_id') artist;
  @relation('tracks', 'track_id') track;
}
