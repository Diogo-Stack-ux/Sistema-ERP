const lembreteService = require("../services/lembrete.service");

async function listar(req, res) {
  try {
    const lembretes =
      await lembreteService.listarLembretes(req.empresaId);

    return res.json(lembretes);
  } catch (error) {
    console.error("Erro ao listar lembretes:", error);

    return res.status(500).json({
      error: "Erro ao listar lembretes.",
    });
  }
}

async function buscarPorId(req, res) {
  try {
    const lembrete =
      await lembreteService.buscarLembretePorId(
        req.params.id,
        req.empresaId
      );

    if (!lembrete) {
      return res.status(404).json({
        error: "Lembrete não encontrado.",
      });
    }

    return res.json(lembrete);
  } catch (error) {
    console.error("Erro ao buscar lembrete:", error);

    return res.status(500).json({
      error: "Erro ao buscar lembrete.",
    });
  }
}

async function criar(req, res) {
  try {
    const lembrete =
      await lembreteService.criarLembrete(req.body, req.empresaId);

    return res.status(201).json(lembrete);
  } catch (error) {
    console.error("Erro ao criar lembrete:", error);

    return res.status(400).json({
      error: error.message,
    });
  }
}

async function atualizar(req, res) {
  try {
    const lembrete =
      await lembreteService.atualizarLembrete(
        req.params.id,
        req.body,
        req.empresaId
      );

    return res.json(lembrete);
  } catch (error) {
    console.error("Erro ao atualizar lembrete:", error);

    return res.status(400).json({
      error: error.message,
    });
  }
}

async function alterarStatus(req, res) {
  try {
    const { status } = req.body;

    const lembrete =
      await lembreteService.atualizarStatus(
        req.params.id,
        status,
        req.empresaId
      );

    return res.json(lembrete);
  } catch (error) {
    console.error(
      "Erro ao atualizar status do lembrete:",
      error
    );

    return res.status(400).json({
      error: error.message,
    });
  }
}

async function excluir(req, res) {
  try {
    await lembreteService.excluirLembrete(
      req.params.id,
      req.empresaId
    );

    return res.json({
      message: "Lembrete excluído com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir lembrete:", error);

    return res.status(400).json({
      error: error.message,
    });
  }
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  alterarStatus,
  excluir,
};