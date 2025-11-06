import {Model} from '@nozbe/watermelondb';
import {field, relation, json} from '@nozbe/watermelondb/decorators';

export default class PlaybackState extends Model {
  static table = 'playback_state';

  @relation('tracks', 'current_track_id') currentTrack;
  @json('queue_json', raw => raw ?? []) queue!: string[];
  @field('shuffle') shuffle!: boolean;
  @field('repeat_mode') repeatMode!: 'off' | 'track' | 'context';
  @field('last_progress_ms') progressMs!: number;
}
