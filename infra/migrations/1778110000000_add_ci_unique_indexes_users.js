/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // create case-insensitive unique indexes to enforce uniqueness at DB level
  pgm.createIndex("users", "LOWER(email)", {
    unique: true,
    name: "users_email_lower_unique",
  });

  pgm.createIndex("users", "LOWER(username)", {
    unique: true,
    name: "users_username_lower_unique",
  });
};

exports.down = (pgm) => {
  // drop by name to ensure proper cleanup
  pgm.sql("DROP INDEX IF EXISTS users_email_lower_unique;");
  pgm.sql("DROP INDEX IF EXISTS users_username_lower_unique;");
};
