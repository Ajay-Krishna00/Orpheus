import {Model} from '@nozbe/watermelondb';
import {field, children} from '@nozbe/watermelondb/decorators';

export default class User extends Model {
  static table = 'users';

  @field('username') username!: string;
  @field('display_name') displayName!: string;
  @field('email') email?: string;
  @field('avatar_url') avatarUrl?: string;
  @field('followers_count') followersCount?: number;
  @field('following_count') followingCount?: number;
  @field('country') country?: string;

  // One-to-many: user → playlists
  @children('playlists') playlists;
}
