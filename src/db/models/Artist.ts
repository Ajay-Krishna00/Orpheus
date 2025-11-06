import {Model} from '@nozbe/watermelondb';
import {field, json, lazy} from '@nozbe/watermelondb/decorators';
import {Q} from '@nozbe/watermelondb';

export default class Artist extends Model {
  static table = 'artists';

  @field('name') name!: string;
  @field('external_uri') externalUri!: string;
  @json('images_json', raw => raw ?? []) images?: {uri: string}[];

  // Reverse relations
  @lazy tracks = this.collections
    .get('artist_tracks')
    .query(Q.where('artist_id', this.id));

  @lazy albums = this.collections
    .get('album_artists')
    .query(Q.where('artist_id', this.id));
}
