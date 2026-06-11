/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("authors", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
    name: {
      type: "varchar(120)",
      notNull: true,
    },
    bio: {
      type: "text",
    },
    avatar_url: {
      type: "text",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createTable("categories", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: {
      type: "varchar(120)",
      notNull: true,
    },
    slug: {
      type: "varchar(140)",
      notNull: true,
      unique: true,
    },
    description: {
      type: "text",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createTable("tags", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: {
      type: "varchar(80)",
      notNull: true,
    },
    slug: {
      type: "varchar(100)",
      notNull: true,
      unique: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createTable("posts", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    author_id: {
      type: "uuid",
      references: "authors(id)",
      onDelete: "SET NULL",
    },
    category_id: {
      type: "uuid",
      references: "categories(id)",
      onDelete: "SET NULL",
    },
    title: {
      type: "varchar(180)",
      notNull: true,
    },
    slug: {
      type: "varchar(220)",
      notNull: true,
      unique: true,
    },
    excerpt: {
      type: "text",
    },
    content: {
      type: "text",
      notNull: true,
    },
    cover_image_url: {
      type: "text",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "draft",
    },
    published_at: {
      type: "timestamp",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createTable("post_tags", {
    post_id: {
      type: "uuid",
      notNull: true,
      references: "posts(id)",
      onDelete: "CASCADE",
    },
    tag_id: {
      type: "uuid",
      notNull: true,
      references: "tags(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("post_tags", "post_tags_pkey", {
    primaryKey: ["post_id", "tag_id"],
  });
  pgm.addConstraint("posts", "posts_status_check", {
    check: "status IN ('draft', 'published')",
  });

  pgm.createIndex("authors", "user_id");
  pgm.createIndex("categories", "slug");
  pgm.createIndex("tags", "slug");
  pgm.createIndex("posts", "slug");
  pgm.createIndex("posts", "author_id");
  pgm.createIndex("posts", "category_id");
  pgm.createIndex("posts", ["status", "published_at"]);
  pgm.createIndex("post_tags", "tag_id");
};

exports.down = (pgm) => {
  pgm.dropTable("post_tags");
  pgm.dropTable("posts");
  pgm.dropTable("tags");
  pgm.dropTable("categories");
  pgm.dropTable("authors");
};
