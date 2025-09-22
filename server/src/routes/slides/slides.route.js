const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  createSlide,
  getAllSlides,
  getSlideById,
  updateSlideById,
  deleteSlideById,
} = require("../slides/slides.controller");
const router = express.Router();

// Configure multer storage to save uploaded files under server/public/uploads
const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");
// Ensure upload directory exists
try {
  require("fs").mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.error("Failed to create upload directory:", err);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});
// Limit file size to 10MB by default (change as needed)
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Upload endpoint: POST /api/slides/upload
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  // Return the public URL path relative to server root. Client can prefix with server URL.
  const publicPath = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: publicPath, filename: req.file.filename });
});

router.post("/", createSlide);
router.get("/", getAllSlides);
router.get("/:id", getSlideById);
router.put("/:id", updateSlideById);
router.delete("/:id", deleteSlideById);

module.exports = router;
