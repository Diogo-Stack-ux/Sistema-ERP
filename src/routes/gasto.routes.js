const express = require("express");
const router = express.Router();
const controller = require("../controllers/gastosController");
const auth = require("../middlewares/auth");

router.use(auth);

router.get("/", controller.index);
router.get("/total", controller.total);
router.post("/", controller.create);
router.patch("/:id/status", controller.updateStatus);
router.delete("/:id", controller.destroy);

module.exports = router;
