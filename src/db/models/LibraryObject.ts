import { Model } from '@nozbe/watermelondb'
import { relation, lazy } from '@nozbe/watermelondb/decorators'
import { Q } from '@nozbe/watermelondb'

export default class LibraryObject extends Model {
  static table = 'library_objects'

  // Belongs to one user
  @relation('users', 'user_id') user

  @lazy likedTracks = this.collections
    .get('library_liked_tracks')
    .query(Q.where('library_id', this.id))

  @lazy likedAlbums = this.collections
    .get('library_liked_albums')
    .query(Q.where('library_id', this.id))

  @lazy followedArtists = this.collections
    .get('library_followed_artists')
    .query(Q.where('library_id', this.id))

  @lazy playlists = this.collections
    .get('library_playlists')
    .query(Q.where('library_id', this.id))
}
