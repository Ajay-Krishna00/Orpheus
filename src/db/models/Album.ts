import { Model } from '@nozbe/watermelondb'
import { field, json, children, lazy } from '@nozbe/watermelondb/decorators'
import { Q } from '@nozbe/watermelondb'

export default class Album extends Model {
  static table = 'albums'

  @field('name') name!: string
  @json('images_json', (raw) => raw ?? []) images?: { uri: string }[]
  @field('release_date') releaseDate?: string
  @field('total_tracks') totalTracks?: number
  @field('album_type') albumType!: 'album' | 'single' | 'compilation'

  // One-to-many: album → tracks
  @children('tracks') tracks

  // Many-to-many: album ↔ artists
  @lazy artists = this.collections
    .get('album_artists')
    .query(Q.where('album_id', this.id))
}
