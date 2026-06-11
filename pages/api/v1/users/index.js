import userService from "models/user.js";
import { ValidationError } from "infra/erros.js";

export default async function users(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, username, password } = req.body;
    const user = await userService.create({ email, username, password });
    return res.status(201).json(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json(error.toJSON());
    }

    console.error("POST /api/v1/users error:", error);
    return res.status(500).json({
      name: "InternalServerError",
      message: "Entre em contato com o suporte para resolver este problema.",
      statusCode: 500,
    });
  }
}
