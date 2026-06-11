const dotenv = require("dotenv");
const { Client } = require("pg");
const orchestrator = require("tests/orchestrator.js").default;

dotenv.config({ path: ".env.development" });

const postgresConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "local_user",
  password: String(process.env.POSTGRES_PASSWORD || "local_password"),
  database: process.env.POSTGRES_DB || "local_db",
  ssl: false,
};

const BASE =
  process.env.TEST_BASE_URL ||
  `http://localhost:${process.env.TEST_PORT || 4000}`;

beforeEach(async () => {
  await orchestrator();
  await cleanDatabase();
  await runMigrations();
});

async function cleanDatabase() {
  const client = new Client(postgresConfig);

  await client.connect();
  try {
    await client.query("drop schema public cascade; create schema public;");
  } finally {
    await client.end();
  }
}

async function runMigrations() {
  await fetch(`${BASE}/api/v1/migrations`, {
    method: "POST",
  });
}

async function insertPublishedPost() {
  const client = new Client(postgresConfig);

  await client.connect();
  try {
    const authorResult = await client.query(
      `
      INSERT INTO authors (name, bio, avatar_url)
      VALUES ($1, $2, $3)
      RETURNING id, name, bio, avatar_url
      `,
      ["Ada Lovelace", "Escreve sobre computacao.", null],
    );
    const categoryResult = await client.query(
      `
      INSERT INTO categories (name, slug, description)
      VALUES ($1, $2, $3)
      RETURNING id, name, slug, description
      `,
      ["Engenharia", "engenharia", "Notas tecnicas."],
    );
    const tagResult = await client.query(
      `
      INSERT INTO tags (name, slug)
      VALUES ($1, $2)
      RETURNING id, name, slug
      `,
      ["Next.js", "nextjs"],
    );

    const postResult = await client.query(
      `
      INSERT INTO posts (
        author_id,
        category_id,
        title,
        slug,
        excerpt,
        content,
        status,
        published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'published', NOW())
      RETURNING id, title, slug
      `,
      [
        authorResult.rows[0].id,
        categoryResult.rows[0].id,
        "Primeiro post",
        "primeiro-post",
        "Resumo do primeiro post.",
        "Conteudo completo do primeiro post.",
      ],
    );

    await client.query(
      `
      INSERT INTO post_tags (post_id, tag_id)
      VALUES ($1, $2)
      `,
      [postResult.rows[0].id, tagResult.rows[0].id],
    );

    return {
      author: authorResult.rows[0],
      category: categoryResult.rows[0],
      post: postResult.rows[0],
      tag: tagResult.rows[0],
    };
  } finally {
    await client.end();
  }
}

describe("Blog API", () => {
  test("GET /api/v1/posts should list published posts", async () => {
    const fixtures = await insertPublishedPost();

    const response = await fetch(`${BASE}/api/v1/posts`);
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.posts).toHaveLength(1);
    expect(responseBody.posts[0].slug).toBe(fixtures.post.slug);
    expect(responseBody.posts[0].author.name).toBe(fixtures.author.name);
    expect(responseBody.posts[0].category.slug).toBe(fixtures.category.slug);
    expect(responseBody.posts[0].tags[0].slug).toBe(fixtures.tag.slug);
    expect(responseBody.pagination.total_items).toBe(1);
  });

  test("GET /api/v1/posts/[slug] should return full post content", async () => {
    await insertPublishedPost();

    const response = await fetch(`${BASE}/api/v1/posts/primeiro-post`);
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.title).toBe("Primeiro post");
    expect(responseBody.content).toBe("Conteudo completo do primeiro post.");
  });

  test("GET /api/v1/categories/[slug]/posts should filter posts by category", async () => {
    await insertPublishedPost();

    const response = await fetch(
      `${BASE}/api/v1/categories/engenharia/posts`,
    );
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.category.slug).toBe("engenharia");
    expect(responseBody.posts).toHaveLength(1);
  });

  test("GET /api/v1/authors/[id] should return author and posts", async () => {
    const fixtures = await insertPublishedPost();

    const response = await fetch(`${BASE}/api/v1/authors/${fixtures.author.id}`);
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.author.name).toBe("Ada Lovelace");
    expect(responseBody.posts).toHaveLength(1);
  });
});
