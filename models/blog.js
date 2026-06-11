import database from "infra/database.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 30;

function normalizePagination({ page, perPage } = {}) {
  const normalizedPage = Math.max(Number(page) || DEFAULT_PAGE, 1);
  const normalizedPerPage = Math.min(
    Math.max(Number(perPage) || DEFAULT_PER_PAGE, 1),
    MAX_PER_PAGE,
  );

  return {
    limit: normalizedPerPage,
    offset: (normalizedPage - 1) * normalizedPerPage,
    page: normalizedPage,
    perPage: normalizedPerPage,
  };
}

function normalizeRows(rows) {
  return rows.map((row) => ({
    ...row,
    tags: row.tags || [],
  }));
}

class BlogService {
  async listPosts({ page, perPage, categorySlug, authorId } = {}) {
    const pagination = normalizePagination({ page, perPage });
    const whereClauses = [
      "posts.status = 'published'",
      "(posts.published_at IS NULL OR posts.published_at <= NOW())",
    ];
    const values = [];

    if (categorySlug) {
      values.push(String(categorySlug).toLowerCase());
      whereClauses.push(`LOWER(categories.slug) = $${values.length}`);
    }

    if (authorId) {
      values.push(String(authorId));
      whereClauses.push(`posts.author_id = $${values.length}`);
    }

    values.push(pagination.limit);
    const limitIndex = values.length;
    values.push(pagination.offset);
    const offsetIndex = values.length;

    const result = await database.query({
      text: `
        SELECT
          posts.id,
          posts.title,
          posts.slug,
          posts.excerpt,
          posts.cover_image_url,
          posts.published_at,
          posts.created_at,
          posts.updated_at,
          COUNT(*) OVER()::int AS total_count,
          CASE
            WHEN authors.id IS NULL THEN NULL
            ELSE json_build_object(
              'id', authors.id,
              'name', authors.name,
              'bio', authors.bio,
              'avatar_url', authors.avatar_url
            )
          END AS author,
          CASE
            WHEN categories.id IS NULL THEN NULL
            ELSE json_build_object(
              'id', categories.id,
              'name', categories.name,
              'slug', categories.slug,
              'description', categories.description
            )
          END AS category,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', tags.id,
                'name', tags.name,
                'slug', tags.slug
              )
            ) FILTER (WHERE tags.id IS NOT NULL),
            '[]'
          ) AS tags
        FROM posts
        LEFT JOIN authors ON authors.id = posts.author_id
        LEFT JOIN categories ON categories.id = posts.category_id
        LEFT JOIN post_tags ON post_tags.post_id = posts.id
        LEFT JOIN tags ON tags.id = post_tags.tag_id
        WHERE ${whereClauses.join(" AND ")}
        GROUP BY posts.id, authors.id, categories.id
        ORDER BY posts.published_at DESC NULLS LAST, posts.created_at DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex};
      `,
      values,
    });

    const totalItems = result.rows[0]?.total_count || 0;
    const posts = normalizeRows(result.rows).map(
      ({ total_count: _totalCount, ...post }) => post,
    );

    return {
      posts,
      pagination: {
        page: pagination.page,
        per_page: pagination.perPage,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / pagination.perPage),
      },
    };
  }

  async findPostBySlug(slug) {
    if (!slug) {
      return null;
    }

    const result = await database.query({
      text: `
        SELECT
          posts.id,
          posts.title,
          posts.slug,
          posts.excerpt,
          posts.content,
          posts.cover_image_url,
          posts.published_at,
          posts.created_at,
          posts.updated_at,
          CASE
            WHEN authors.id IS NULL THEN NULL
            ELSE json_build_object(
              'id', authors.id,
              'name', authors.name,
              'bio', authors.bio,
              'avatar_url', authors.avatar_url
            )
          END AS author,
          CASE
            WHEN categories.id IS NULL THEN NULL
            ELSE json_build_object(
              'id', categories.id,
              'name', categories.name,
              'slug', categories.slug,
              'description', categories.description
            )
          END AS category,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', tags.id,
                'name', tags.name,
                'slug', tags.slug
              )
            ) FILTER (WHERE tags.id IS NOT NULL),
            '[]'
          ) AS tags
        FROM posts
        LEFT JOIN authors ON authors.id = posts.author_id
        LEFT JOIN categories ON categories.id = posts.category_id
        LEFT JOIN post_tags ON post_tags.post_id = posts.id
        LEFT JOIN tags ON tags.id = post_tags.tag_id
        WHERE LOWER(posts.slug) = $1
          AND posts.status = 'published'
          AND (posts.published_at IS NULL OR posts.published_at <= NOW())
        GROUP BY posts.id, authors.id, categories.id
        LIMIT 1;
      `,
      values: [String(slug).toLowerCase()],
    });

    return normalizeRows(result.rows)[0] || null;
  }

  async listCategories() {
    const result = await database.query({
      text: `
        SELECT
          categories.id,
          categories.name,
          categories.slug,
          categories.description,
          COUNT(posts.id)::int AS posts_count
        FROM categories
        LEFT JOIN posts ON posts.category_id = categories.id
          AND posts.status = 'published'
          AND (posts.published_at IS NULL OR posts.published_at <= NOW())
        GROUP BY categories.id
        ORDER BY categories.name ASC;
      `,
    });

    return result.rows;
  }

  async findCategoryBySlug(slug) {
    if (!slug) {
      return null;
    }

    const result = await database.query({
      text: `
        SELECT
          categories.id,
          categories.name,
          categories.slug,
          categories.description,
          COUNT(posts.id)::int AS posts_count
        FROM categories
        LEFT JOIN posts ON posts.category_id = categories.id
          AND posts.status = 'published'
          AND (posts.published_at IS NULL OR posts.published_at <= NOW())
        WHERE LOWER(categories.slug) = $1
        GROUP BY categories.id
        LIMIT 1;
      `,
      values: [String(slug).toLowerCase()],
    });

    return result.rows[0] || null;
  }

  async findAuthorById(id) {
    if (!id) {
      return null;
    }

    const result = await database.query({
      text: `
        SELECT
          authors.id,
          authors.name,
          authors.bio,
          authors.avatar_url,
          authors.created_at,
          authors.updated_at,
          COUNT(posts.id)::int AS posts_count
        FROM authors
        LEFT JOIN posts ON posts.author_id = authors.id
          AND posts.status = 'published'
          AND (posts.published_at IS NULL OR posts.published_at <= NOW())
        WHERE authors.id = $1
        GROUP BY authors.id
        LIMIT 1;
      `,
      values: [String(id)],
    });

    return result.rows[0] || null;
  }
}

export default new BlogService();
