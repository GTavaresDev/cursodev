function GetStatus(req, res) {
  res.status(200).json({ status: "ok" });
}

export default GetStatus;