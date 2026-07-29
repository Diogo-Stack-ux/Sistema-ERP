const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const equipamentoController = require("../controllers/equipamento.controller");

// Todas as rotas abaixo exigem autenticação
router.use(auth);

// Listar todos os equipamentos
router.get("/", equipamentoController.listarEquipamentos);

// Listar equipamentos de um cliente específico
router.get(
  "/cliente/:clienteId",
  equipamentoController.listarEquipamentosPorCliente
);

// Buscar equipamento por ID
router.get("/:id", equipamentoController.buscarEquipamentoPorId);

// Criar equipamento
router.post("/", equipamentoController.criarEquipamento);

// Atualizar equipamento
router.put("/:id", equipamentoController.atualizarEquipamento);

// Excluir equipamento
router.delete("/:id", equipamentoController.excluirEquipamento);

module.exports = router;