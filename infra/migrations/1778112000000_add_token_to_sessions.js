/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS token uuid;

    UPDATE sessions
      SET token = id
      WHERE token IS NULL;

    ALTER TABLE sessions
      ALTER COLUMN token SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_key
      ON sessions (token);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE sessions
      DROP COLUMN IF EXISTS token;
  `);
};
