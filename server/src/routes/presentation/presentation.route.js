const express = require("express");

const {
  getAllPresentations,
  createPresentation,
} = require("../presentation/presentation.controller");
const router = express.Router();

router.get("/", getAllPresentations);

router.post("/", createPresentation);

module.exports = router;
