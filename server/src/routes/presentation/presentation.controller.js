const Presentation = require("../../models/presentation.schema");

async function createPresentation(req, res) {
  try {
    const { title, userId, slides } = req.body;
    const newPresentation = new Presentation({ title, userId, slides });
    const savedPresentation = await newPresentation.save();
    res.status(201).json(savedPresentation);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
async function getAllPresentations(req, res) {
  try {
    const presentations = await Presentation.find().populate("slides");
    res.status(200).json(presentations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
async function getPresentationById(req, res) {
  try {
    const { id } = req.params;
    const presentation = await Presentation.findById(id).populate("slides");
    if (!presentation) {
      return res.status(404).json({ message: "Presentation not found" });
    }
    res.status(200).json(presentation);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = {
  createPresentation,
  getAllPresentations,
  getPresentationById,
};
