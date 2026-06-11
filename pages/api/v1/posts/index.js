import blogService from "models/blog.js";

export default async function posts(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await blogService.listPosts({
      page: req.query.page,
      perPage: req.query.per_page,
      categorySlug: req.query.category_slug,
      authorId: req.query.author_id,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("GET /api/v1/posts error:", error);
    return res.status(500).json({
      name: "InternalServerError",
      message: "Entre em contato com o suporte para resolver este problema.",
      statusCode: 500,
    });
  }
}
