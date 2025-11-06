import {
  schemaMigrations,
  addColumns,
} from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'playlist_tracks',
          columns: [{name: 'created_at', type: 'number'}],
        }),
      ],
    },
  ],
});
