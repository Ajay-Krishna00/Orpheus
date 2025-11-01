import { Model } from '@nozbe/watermelondb'
import { relation } from '@nozbe/watermelondb/decorators'

export default class PlaylistTrack extends Model {
  static table = 'playlist_tracks'

  @relation('playlists', 'playlist_id') playlist
  @relation('tracks', 'track_id') track
}
