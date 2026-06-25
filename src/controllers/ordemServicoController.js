const ordemServicoService = require("../services/ordemServicoService");

async function index(req, res) {
  try {
    const ordens = await ordemServicoService.listOrdens();
    res.json(ordens);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar ordens de serviço" });
  }
}

async function show(req, res) {
  try {
    const ordem = await ordemServicoService.getOrdemById(req.params.id);
    if (!ordem) {
      return res.status(404).json({ error: "Ordem de serviço não encontrada" });
    }
    res.json(ordem);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar ordem de serviço" });
  }
}

async function create(req, res) {
  try {
    const ordem = await ordemServicoService.createOrdem(req.body);
    res.status(201).json(ordem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar ordem de serviço" });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const ordem = await ordemServicoService.updateStatus(req.params.id, status);
    res.json(ordem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
}

async function destroy(req, res) {
  try {
    await ordemServicoService.deleteOrdem(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir ordem de serviço" });
  }
}

module.exports = { index, show, create, updateStatus, destroy };