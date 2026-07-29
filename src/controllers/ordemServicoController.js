const ordemServicoService = require("../services/ordemServicoService");

async function index(req, res) {
  try {
    const ordens = await ordemServicoService.listOrdens();
    return res.json(ordens);
  } catch (error) {
    console.error("Erro ao listar ordens de servico:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Erro ao listar ordens de servico",
    });
  }
}

async function show(req, res) {
  try {
    const ordem = await ordemServicoService.getOrdemById(req.params.id);

    if (!ordem) {
      return res.status(404).json({
        error: "Ordem de servico nao encontrada",
      });
    }

    return res.json(ordem);
  } catch (error) {
    console.error("Erro ao buscar ordem de servico:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Erro ao buscar ordem de servico",
    });
  }
}

async function create(req, res) {
  try {
    const ordem = await ordemServicoService.createOrdem(req.body);
    return res.status(201).json(ordem);
  } catch (error) {
    console.error("Erro ao criar ordem de servico:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Erro ao criar ordem de servico",
    });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;

    const ordem = await ordemServicoService.updateStatus(
      req.params.id,
      status
    );

    return res.json(ordem);
  } catch (error) {
    console.error("Erro ao atualizar status:", error);

    return res.status(error.statusCode || 500).json({
      error: error.message || "Erro ao atualizar status",
    });
  }
}

async function destroy(req, res) {
  try {
    await ordemServicoService.deleteOrdem(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir ordem de servico:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Erro ao excluir ordem de servico",
    });
  }
}

module.exports = { index, show, create, updateStatus, destroy };
