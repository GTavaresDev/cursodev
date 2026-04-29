import database from "infra/database.js";
async function GetStatus(req, res) {
  const result = await database.query("SELECT 1 + 1;");
  console.log(result);
  res.status(200).json({ status: "ok" });
}

export default GetStatus;