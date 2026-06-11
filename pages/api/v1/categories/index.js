import blogService from "models/blog.js";

export default async function categories(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await blogService.listCategories();
    return res.status(200).json({ categories: result });
  } catch (error) {
    console.error("GET /api/v1/categories error:", error);
    return res.status(500).json({
      name: "InternalServerError",
      message: "Entre em contato com o suporte para resolver este problema.",
      statusCode: 500,
    });
  }
}
