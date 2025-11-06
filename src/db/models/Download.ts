import {Model} from '@nozbe/watermelondb';
import {field, relation} from '@nozbe/watermelondb/decorators';

export default class Download extends Model {
  static table = 'downloads';

  @relation('tracks', 'track_id') track;
  @field('local_file_path') localFilePath!: string;
}
