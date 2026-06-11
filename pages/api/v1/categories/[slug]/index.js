import blogService from "models/blog.js";

export default async function categoryBySlug(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const category = await blogService.findCategoryBySlug(req.query.slug);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json(category);
  } catch (error) {
    console.error("GET /api/v1/categories/[slug] error:", error);
    return res.status(500).json({
      name: "InternalServerError",
      message: "Entre em contato com o suporte para resolver este problema.",
      statusCode: 500,
    });
  }
}
