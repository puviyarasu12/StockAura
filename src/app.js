const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const app = express();

app.disable("etag");

app.use(cors());
app.use(express.json());
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend is healthy" });
});

app.use("/api", routes);

module.exports = app;
