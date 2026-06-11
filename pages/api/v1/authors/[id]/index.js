import blogService from "models/blog.js";

export default async function authorById(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const author = await blogService.findAuthorById(req.query.id);

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    const posts = await blogService.listPosts({
      page: req.query.page,
      perPage: req.query.per_page,
      authorId: req.query.id,
    });

    return res.status(200).json({ author, ...posts });
  } catch (error) {
    console.error("GET /api/v1/authors/[id] error:", error);
    return res.status(500).json({
      name: "InternalServerError",
      message: "Entre em contato com o suporte para resolver este problema.",
      statusCode: 500,
    });
  }
}
