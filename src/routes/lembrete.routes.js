const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/lembrete.controller"
);

router.get("/", controller.listar);

router.get("/:id", controller.buscarPorId);

router.post("/", controller.criar);

router.put("/:id", controller.atualizar);

router.patch("/:id/status", controller.alterarStatus);

router.delete("/:id", controller.excluir);

module.exports = router;