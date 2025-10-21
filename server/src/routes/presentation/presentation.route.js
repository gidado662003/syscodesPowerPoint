const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  getAllPresentations,
  createPresentation,
  getPresentationById,
  importPptx,
} = require("../presentation/presentation.controller");
const router = express.Router();

router.get("/", getAllPresentations);

router.get("/:id", getPresentationById);

router.post("/", createPresentation);

// Upload storage for pptx imports
const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");
try {
  require("fs").mkdirSync(uploadDir, { recursive: true });
} catch (err) {}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/(\.pptx)$/i.test(file.originalname)) return cb(null, true);
    cb(new Error("Only .pptx files are allowed"));
  },
});

// POST /api/presentations/import-pptx
router.post("/import-pptx", upload.single("file"), importPptx);

module.exports = router;
