const prisma = require("../lib/prisma");

async function criarEquipamento(req, res) {
  try {
    const {
      clienteId,
      nome,
      tipo,
      marca,
      modelo,
      numeroSerie,
      identificacao,
      dataCompra,
      garantiaAte,
      observacoes,
      ativo,
    } = req.body;

    if (!clienteId || !nome) {
      return res.status(400).json({
        error: "clienteId e nome são obrigatórios",
      });
    }

    const clienteExiste = await prisma.cliente.findUnique({
      where: {
        id: Number(clienteId),
      },
    });

    if (!clienteExiste) {
      return res.status(404).json({
        error: "Cliente não encontrado",
      });
    }

    const equipamento = await prisma.equipamento.create({
      data: {
        clienteId: Number(clienteId),
        nome: nome.trim(),
        tipo: tipo?.trim() || null,
        marca: marca?.trim() || null,
        modelo: modelo?.trim() || null,
        numeroSerie: numeroSerie?.trim() || null,
        identificacao: identificacao?.trim() || null,
        dataCompra: dataCompra ? new Date(dataCompra) : null,
        garantiaAte: garantiaAte ? new Date(garantiaAte) : null,
        observacoes: observacoes?.trim() || null,
        ativo: ativo ?? true,
      },
      include: {
        cliente: true,
      },
    });

    return res.status(201).json(equipamento);
  } catch (error) {
    console.error("Erro ao criar equipamento:", error);

    return res.status(500).json({
      error: "Erro interno ao criar equipamento",
      details: error.message,
    });
  }
}

async function listarEquipamentos(req, res) {
  try {
    const equipamentos = await prisma.equipamento.findMany({
      include: {
        cliente: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(equipamentos);
  } catch (error) {
    console.error("Erro ao listar equipamentos:", error);

    return res.status(500).json({
      error: "Erro interno ao listar equipamentos",
      details: error.message,
    });
  }
}

async function buscarEquipamentoPorId(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido",
      });
    }

    const equipamento = await prisma.equipamento.findUnique({
      where: {
        id,
      },
      include: {
        cliente: true,
        ordensServico: {
          include: {
            servicos: {
              include: {
                service: true,
              },
            },
            produtos: {
              include: {
                produto: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!equipamento) {
      return res.status(404).json({
        error: "Equipamento não encontrado",
      });
    }

    return res.json(equipamento);
  } catch (error) {
    console.error("Erro ao buscar equipamento:", error);

    return res.status(500).json({
      error: "Erro interno ao buscar equipamento",
      details: error.message,
    });
  }
}

async function listarEquipamentosPorCliente(req, res) {
  try {
    const clienteId = Number(req.params.clienteId);

    if (Number.isNaN(clienteId)) {
      return res.status(400).json({
        error: "clienteId inválido",
      });
    }

    const clienteExiste = await prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },
    });

    if (!clienteExiste) {
      return res.status(404).json({
        error: "Cliente não encontrado",
      });
    }

    const equipamentos = await prisma.equipamento.findMany({
      where: {
        clienteId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(equipamentos);
  } catch (error) {
    console.error("Erro ao listar equipamentos do cliente:", error);

    return res.status(500).json({
      error: "Erro interno ao listar equipamentos do cliente",
      details: error.message,
    });
  }
}

async function atualizarEquipamento(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido",
      });
    }

    const equipamentoExiste = await prisma.equipamento.findUnique({
      where: {
        id,
      },
    });

    if (!equipamentoExiste) {
      return res.status(404).json({
        error: "Equipamento não encontrado",
      });
    }

    const {
      clienteId,
      nome,
      tipo,
      marca,
      modelo,
      numeroSerie,
      identificacao,
      dataCompra,
      garantiaAte,
      observacoes,
      ativo,
    } = req.body;

    if (clienteId) {
      const clienteExiste = await prisma.cliente.findUnique({
        where: {
          id: Number(clienteId),
        },
      });

      if (!clienteExiste) {
        return res.status(404).json({
          error: "Cliente não encontrado",
        });
      }
    }

    const equipamento = await prisma.equipamento.update({
      where: {
        id,
      },
      data: {
        ...(clienteId !== undefined && {
          clienteId: Number(clienteId),
        }),
        ...(nome !== undefined && {
          nome: nome.trim(),
        }),
        ...(tipo !== undefined && {
          tipo: tipo?.trim() || null,
        }),
        ...(marca !== undefined && {
          marca: marca?.trim() || null,
        }),
        ...(modelo !== undefined && {
          modelo: modelo?.trim() || null,
        }),
        ...(numeroSerie !== undefined && {
          numeroSerie: numeroSerie?.trim() || null,
        }),
        ...(identificacao !== undefined && {
          identificacao: identificacao?.trim() || null,
        }),
        ...(dataCompra !== undefined && {
          dataCompra: dataCompra ? new Date(dataCompra) : null,
        }),
        ...(garantiaAte !== undefined && {
          garantiaAte: garantiaAte ? new Date(garantiaAte) : null,
        }),
        ...(observacoes !== undefined && {
          observacoes: observacoes?.trim() || null,
        }),
        ...(ativo !== undefined && {
          ativo: Boolean(ativo),
        }),
      },
      include: {
        cliente: true,
      },
    });

    return res.json(equipamento);
  } catch (error) {
    console.error("Erro ao atualizar equipamento:", error);

    return res.status(500).json({
      error: "Erro interno ao atualizar equipamento",
      details: error.message,
    });
  }
}

async function excluirEquipamento(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido",
      });
    }

    const equipamento = await prisma.equipamento.findUnique({
      where: {
        id,
      },
      include: {
        ordensServico: true,
      },
    });

    if (!equipamento) {
      return res.status(404).json({
        error: "Equipamento não encontrado",
      });
    }

    if (equipamento.ordensServico.length > 0) {
      return res.status(409).json({
        error:
          "Não é possível excluir este equipamento porque ele possui ordens de serviço vinculadas",
      });
    }

    await prisma.equipamento.delete({
      where: {
        id,
      },
    });

    return res.json({
      message: "Equipamento excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir equipamento:", error);

    return res.status(500).json({
      error: "Erro interno ao excluir equipamento",
      details: error.message,
    });
  }
}

module.exports = {
  criarEquipamento,
  listarEquipamentos,
  buscarEquipamentoPorId,
  listarEquipamentosPorCliente,
  atualizarEquipamento,
  excluirEquipamento,
};