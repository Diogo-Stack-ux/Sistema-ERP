const prisma = require("../lib/prisma");

const ordemInclude = {
  cliente: true,
  equipamento: true,
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
};

function normalizeOrdem(ordem) {
  if (!ordem) return ordem;

  return ordem;
}

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parsePositiveId(value, fieldName) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw createHttpError(`${fieldName} invalido`);
  }

  return numberValue;
}

function parsePositiveNumber(value, fieldName) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw createHttpError(`${fieldName} invalido`);
  }

  return numberValue;
}

function calcularProximaRevisao(dataBase, frequencia, tipoFrequencia) {
  const proximaData = new Date(dataBase);
  const valor = Number(frequencia);

  switch (tipoFrequencia) {
    case "DIAS":
      proximaData.setDate(proximaData.getDate() + valor);
      break;

    case "SEMANAS":
      proximaData.setDate(proximaData.getDate() + valor * 7);
      break;

    case "MESES":
      proximaData.setMonth(proximaData.getMonth() + valor);
      break;

    case "ANOS":
      proximaData.setFullYear(proximaData.getFullYear() + valor);
      break;

    default:
      return null;
  }

  return proximaData;
}

async function listOrdens(empresaId) {
  const ordens = await prisma.ordemServico.findMany({
    where: { empresaId },
    include: ordemInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return ordens.map(normalizeOrdem);
}

async function getOrdemById(id, empresaId) {
  const ordem = await prisma.ordemServico.findFirst({
    where: {
      id: Number(id),
      empresaId,
    },
    include: ordemInclude,
  });

  return normalizeOrdem(ordem);
}

async function createOrdem(data, empresaId) {
  const {
    clienteId,
    equipamentoId,
    observacoes,
    servicos = [],
    produtos = [],
  } = data || {};

  const clienteIdNumber = parsePositiveId(clienteId, "Cliente");

  const cliente = await prisma.cliente.findFirst({
    where: {
      id: clienteIdNumber,
      empresaId,
    },
  });

  if (!cliente) {
    throw createHttpError("Cliente nao encontrado", 404);
  }

  let equipamentoIdNumber = null;

  if (equipamentoId !== null && equipamentoId !== undefined && equipamentoId !== "") {
    equipamentoIdNumber = parsePositiveId(equipamentoId, "Equipamento");

    const equipamento = await prisma.equipamento.findFirst({
      where: {
        id: equipamentoIdNumber,
        empresaId,
      },
    });

    if (!equipamento) {
      throw createHttpError("Equipamento nao encontrado", 404);
    }

    if (equipamento.clienteId !== clienteIdNumber) {
      throw createHttpError(
        "O equipamento nao pertence ao cliente selecionado"
      );
    }

    if (!equipamento.ativo) {
      throw createHttpError("Nao e possivel vincular um equipamento inativo");
    }
  }

  if (!Array.isArray(servicos) || servicos.length === 0) {
    throw createHttpError("Selecione pelo menos um servico");
  }

  if (!Array.isArray(produtos)) {
    throw createHttpError("Lista de produtos invalida");
  }

  const servicosNormalizados = servicos.map((item) => ({
    serviceId: parsePositiveId(item?.serviceId, "Servico"),
    valor: parsePositiveNumber(item?.valor, "Valor do servico"),
  }));

  const produtosNormalizados = produtos.map((item) => ({
    produtoId: parsePositiveId(item?.produtoId, "Produto"),
    quantidade: parsePositiveId(item?.quantidade, "Quantidade do produto"),
    precoUnitario: parsePositiveNumber(
      item?.precoUnitario,
      "Preco unitario do produto"
    ),
  }));

  const servicosEncontrados = await prisma.service.findMany({
    where: {
      empresaId,
      id: {
        in: servicosNormalizados.map((item) => item.serviceId),
      },
    },
  });

  if (servicosEncontrados.length !== servicosNormalizados.length) {
    throw createHttpError(
      "Um ou mais servicos selecionados nao foram encontrados",
      404
    );
  }

  const servicoInativo = servicosEncontrados.find((service) => !service.ativo);

  if (servicoInativo) {
    throw createHttpError(`O servico "${servicoInativo.nome}" esta inativo`);
  }

  if (produtosNormalizados.length > 0) {
    const produtosEncontrados = await prisma.produto.findMany({
      where: {
        empresaId,
        id: {
          in: produtosNormalizados.map((item) => item.produtoId),
        },
      },
    });

    if (produtosEncontrados.length !== produtosNormalizados.length) {
      throw createHttpError(
        "Um ou mais produtos selecionados nao foram encontrados",
        404
      );
    }

    for (const item of produtosNormalizados) {
      const produto = produtosEncontrados.find(
        (produtoEncontrado) => produtoEncontrado.id === item.produtoId
      );

      if (produto.quantidade < item.quantidade) {
        throw createHttpError(
          `Estoque insuficiente para o produto ${produto.nome}`
        );
      }
    }
  }

  const totalServicos = servicosNormalizados.reduce(
    (total, item) => total + item.valor,
    0
  );

  const totalProdutos = produtosNormalizados.reduce(
    (total, item) => total + item.precoUnitario * item.quantidade,
    0
  );

  const observacoesNormalizadas =
    typeof observacoes === "string" ? observacoes.trim() || null : null;

  const ordem = await prisma.ordemServico.create({
    data: {
      empresaId,
      clienteId: clienteIdNumber,
      equipamentoId: equipamentoIdNumber,
      observacoes: observacoesNormalizadas,
      status: "ABERTA",
      valorTotal: totalServicos + totalProdutos,

      servicos: {
        create: servicosNormalizados.map((item) => ({
          serviceId: item.serviceId,
          valor: item.valor,
        })),
      },

      produtos: {
        create: produtosNormalizados.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        })),
      },
    },
    include: ordemInclude,
  });

  return normalizeOrdem(ordem);
}

async function updateStatus(id, status, empresaId) {
  const ordemId = parsePositiveId(id, "Ordem de servico");

  const statusPermitidos = [
    "ABERTA",
    "EM_ANDAMENTO",
    "CONCLUIDA",
    "CANCELADA",
  ];

  if (!statusPermitidos.includes(status)) {
    throw createHttpError("Status invalido");
  }

  const ordem = await prisma.ordemServico.findFirst({
    where: {
      id: ordemId,
      empresaId,
    },
    include: {
      produtos: true,
      cliente: true,
      equipamento: true,
    },
  });

  if (!ordem) {
    throw createHttpError("Ordem de servico nao encontrada", 404);
  }

  if (status === "CONCLUIDA" && ordem.status !== "CONCLUIDA") {
    await prisma.$transaction(async (tx) => {
      for (const item of ordem.produtos) {
        const produto = await tx.produto.findUnique({
          where: {
            id: item.produtoId,
            empresaId,
          },
        });

        if (!produto) {
          throw createHttpError(`Produto ${item.produtoId} nao encontrado`, 404);
        }

        if (produto.quantidade < item.quantidade) {
          throw createHttpError(
            `Estoque insuficiente para o produto ${produto.nome}`
          );
        }

        await tx.produto.update({
          where: {
            id: item.produtoId,
            empresaId,
          },
          data: {
            quantidade: {
              decrement: item.quantidade,
            },
          },
        });

        await tx.movimentacao.create({
          data: {
            empresaId,
            produtoId: item.produtoId,
            tipo: "SAIDA",
            quantidade: item.quantidade,
            data: new Date(),
          },
        });
      }

      await tx.gasto.create({
        data: {
          empresaId,
          descricao: `Receita OS #${ordem.id}`,
          valor: -Number(ordem.valorTotal),
          data: new Date(),
        },
      });

      await tx.ordemServico.update({
        where: {
          id: ordemId,
          empresaId,
        },
        data: {
          status,
        },
      });

      if (
        ordem.equipamento &&
        ordem.equipamento.frequenciaRevisao &&
        ordem.equipamento.tipoFrequenciaRevisao
      ) {
        const proximaRevisao = calcularProximaRevisao(
          new Date(),
          ordem.equipamento.frequenciaRevisao,
          ordem.equipamento.tipoFrequenciaRevisao
        );

        if (proximaRevisao) {
          await tx.lembrete.create({
            data: {
              empresaId,
              clienteId: ordem.clienteId,
              equipamentoId: ordem.equipamento.id,
              titulo: `Revisão - ${ordem.equipamento.nome}`,
              mensagem: `Revisão programada do equipamento ${ordem.equipamento.nome}.`,
              dataLembrete: proximaRevisao,
              status: "PENDENTE",
              canal: "SISTEMA",
            },
          });
        }
      }
    });

    return getOrdemById(ordemId, empresaId);
  }

  const ordemAtualizada = await prisma.ordemServico.update({
    where: {
      id: ordemId,
      empresaId,
    },
    data: {
      status,
    },
    include: ordemInclude,
  });

  return normalizeOrdem(ordemAtualizada);
}

async function deleteOrdem(id, empresaId) {
  const ordemId = parsePositiveId(id, "Ordem de servico");

  const ordem = await prisma.ordemServico.findFirst({
    where: {
      id: ordemId,
      empresaId,
    },
  });

  if (!ordem) {
    throw createHttpError("Ordem de servico nao encontrada", 404);
  }

  if (ordem.status === "CONCLUIDA") {
    throw createHttpError(
      "Nao e possivel excluir uma ordem de servico concluida",
      409
    );
  }

  return prisma.ordemServico.delete({
    where: {
      id: ordemId,
      empresaId,
    },
  });
}

module.exports = {
  listOrdens,
  getOrdemById,
  createOrdem,
  updateStatus,
  deleteOrdem,
};
