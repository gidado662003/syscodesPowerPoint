const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const apiRoutes = require("./routes/api");

const app = express();
// Increase JSON and URL-encoded body size limits to allow larger payloads
// (e.g., if slides contain data-URLs). For production, prefer uploading files
// via multipart/form-data and storing URLs instead of embedding large data URLs.
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// Serve static files from server/public (uploaded images will be placed here)
// Serve static files from server/src/public (uploaded images will be placed here)
app.use(express.static(require("path").join(__dirname, "public")));

app.use(morgan("dev"));
app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "http://localhost:3001",
      "http://localhost:3000",
      "http://10.0.0.253:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/api", apiRoutes);

module.exports = app;
