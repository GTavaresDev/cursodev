import userService from "models/user.js";
import { ValidationError } from "infra/erros.js";

export default async function getUserByUsername(req, res) {
  if (req.method !== "GET" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username } = req.query;

    if (req.method === "PATCH") {
      const updatedUser = await userService.updateByUsername(
        username,
        req.body,
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(updatedUser);
    }

    const user = await userService.findOneByUsername(username);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json(error.toJSON());
    }

    console.error("GET /api/v1/users/[username] error:", error);
    return res.status(500).json({
      name: "InternalServerError",
      message: "Entre em contato com o suporte para resolver este problema.",
      statusCode: 500,
    });
  }
}
