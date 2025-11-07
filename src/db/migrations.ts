import {
  schemaMigrations,
  addColumns,
} from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'tracks',
          columns: [{name: 'lyrics', type: 'string', isOptional: true}],
        }),
      ],
    },
  ],
});
