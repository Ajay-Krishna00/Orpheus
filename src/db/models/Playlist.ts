import { Model } from '@nozbe/watermelondb'
import { field, relation, json, lazy } from '@nozbe/watermelondb/decorators'
import { Q } from '@nozbe/watermelondb'

export default class Playlist extends Model {
  static table = 'playlists'

  @field('name') name!: string
  @field('description') description?: string
  @json('images_json', (raw) => raw ?? []) images?: { uri: string }[]
  @field('public') public!: boolean
  @field('collaborative') collaborative!: boolean

  // Owner
  @relation('users', 'owner_id') owner

  // Many-to-many: playlist ↔ tracks
  @lazy tracks = this.collections
    .get('playlist_tracks')
    .query(Q.where('playlist_id', this.id))
}
