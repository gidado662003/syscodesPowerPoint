const exprees = require("express");

const slidesRoutes = require("./slides/slides.route");
const presentationsRoutes = require("./presentation/presentation.route");
const router = exprees.Router();
router.use("/slides", slidesRoutes);
router.use("/presentations", presentationsRoutes);
module.exports = router;
