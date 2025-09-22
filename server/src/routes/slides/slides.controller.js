const Slide = require("../../models/slides.schema");


// Create a new slide
async function createSlide(req, res) {
    try {   
        const { title, subtitle, content, image, layout, backgroundColor } = req.body;
        const newSlide = new Slide({ title, subtitle, content, image, layout, backgroundColor });
        const savedSlide = await newSlide.save();
        res.status(201).json(savedSlide);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
// Get all slides
async function getAllSlides(req, res) {
    try {   
        const slides = await Slide.find();
        res.status(200).json(slides);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
// Get a slide by ID
async function getSlideById(req, res) {
    try {   
        const { id } = req.params;
        const slide = await Slide.findById(id); 
        if (!slide) {
            return res.status(404).json({ message: "Slide not found" });
        }   
        res.status(200).json(slide);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }    
}
// Update a slide by ID
async function updateSlideById(req, res) {
    try {   
        const { id } = req.params;
        const { title, subtitle, content, image, layout, backgroundColor } = req.body;
        const updatedSlide = await Slide.findByIdAndUpdate
            (id, { title, subtitle, content, image, layout, backgroundColor }, { new: true });
        if (!updatedSlide) {
            return res.status(404).json({ message: "Slide not found" });
        }
        res.status(200).json(updatedSlide);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }   
}
// Delete a slide by ID
async function deleteSlideById(req, res) {
    try {
        const { id } = req.params;
        const deletedSlide = await Slide.findByIdAndDelete(id);

        if (!deletedSlide) {
            return res.status(404).json({ message: "Slide not found" });
        }
        res.status(200).json({ message: "Slide deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }   
}
module.exports = { createSlide, getAllSlides, getSlideById, updateSlideById, deleteSlideById };