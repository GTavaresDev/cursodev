#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const migrationName = process.argv.slice(2).join("_");

if (!migrationName) {
  console.error("Usage: node create-migration.js <migration-name>");
  process.exit(1);
}

const timestamp = Date.now();
const filename = `${timestamp}_${migrationName}.js`;
const filepath = path.join(__dirname, "migrations", filename);

const template = `/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // TODO: Implement migration
};

exports.down = (pgm) => {
  // TODO: Implement rollback
};
`;

fs.writeFileSync(filepath, template);
console.log(`✓ Migration created: ${filename}`);
