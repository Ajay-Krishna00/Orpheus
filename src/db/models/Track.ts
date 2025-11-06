import {Model} from '@nozbe/watermelondb';
import {field, relation, lazy} from '@nozbe/watermelondb/decorators';
import {Q} from '@nozbe/watermelondb';

export default class Track extends Model {
  static table = 'tracks';

  @field('name') name!: string;
  @field('duration_ms') durationMs!: number;
  @field('explicit') explicit!: boolean;
  @field('external_uri') externalUri!: string;

  // Belongs to one album
  @relation('albums', 'album_id') album;

  // Many-to-many: track ↔ artists
  @lazy artists = this.collections
    .get('artist_tracks')
    .query(Q.where('track_id', this.id));
}
