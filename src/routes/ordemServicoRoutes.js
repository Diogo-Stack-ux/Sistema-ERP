const express = require("express");
const router = express.Router();
const controller = require("../controllers/ordemServicoController");
const auth = require("../middlewares/auth");

router.use(auth);

router.get("/", controller.index);
router.get("/:id", controller.show);
router.post("/", controller.create);
router.patch("/:id/status", controller.updateStatus);
router.delete("/:id", controller.destroy);

module.exports = router;