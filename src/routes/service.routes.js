const express = require("express");
const router = express.Router();

const serviceController = require("../controllers/service.controller");

router.get("/", serviceController.findAll);
router.get("/:id", serviceController.findById);

router.post("/", serviceController.create);

router.put("/:id", serviceController.update);

router.delete("/:id", serviceController.remove);

module.exports = router;
