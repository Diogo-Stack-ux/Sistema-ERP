const prisma = require("../lib/prisma");

async function listOrdens() {
  return prisma.ordemServico.findMany({
    include: {
      cliente: true,
      servicos: { include: { service: true } },
      produtos: { include: { produto: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getOrdemById(id) {
  return prisma.ordemServico.findUnique({
    where: { id: Number(id) },
    include: {
      cliente: true,
      servicos: { include: { service: true } },
      produtos: { include: { produto: true } },
    },
  });
}

async function createOrdem(data) {
  const { clienteId, observacoes, servicos = [], produtos = [] } = data;

  // Calcula valor total (serviços + produtos)
  const totalServicos = servicos.reduce((sum, s) => sum + Number(s.valor), 0);
  const totalProdutos = produtos.reduce(
    (sum, p) => sum + Number(p.precoUnitario) * Number(p.quantidade),
    0
  );

  return prisma.ordemServico.create({
    data: {
      clienteId: Number(clienteId),
      observacoes,
      status: "ABERTA",
      valorTotal: totalServicos + totalProdutos,
      servicos: {
        create: servicos.map((s) => ({
          serviceId: Number(s.serviceId),
          valor: Number(s.valor),
        })),
      },
      produtos: {
        create: produtos.map((p) => ({
          produtoId: Number(p.produtoId),
          quantidade: Number(p.quantidade),
          precoUnitario: Number(p.precoUnitario),
        })),
      },
    },
    include: {
      cliente: true,
      servicos: { include: { service: true } },
      produtos: { include: { produto: true } },
    },
  });
}

async function updateStatus(id, status) {
  const ordem = await prisma.ordemServico.findUnique({
    where: { id: Number(id) },
    include: { produtos: true },
  });

  if (!ordem) {
    throw new Error("Ordem de serviço não encontrada");
  }

  // Ao concluir: dá baixa no estoque e gera lançamento financeiro
  if (status === "CONCLUIDA" && ordem.status !== "CONCLUIDA") {
    await prisma.$transaction(async (tx) => {
      // Baixa de estoque + movimentação
      for (const item of ordem.produtos) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { quantidade: { decrement: item.quantidade } },
        });

        await tx.movimentacao.create({
          data: {
            produtoId: item.produtoId,
            tipo: "SAIDA",
            quantidade: item.quantidade,
            data: new Date(),
          },
        });
      }

      // Lançamento financeiro (receita da OS)
      await tx.gasto.create({
        data: {
          descricao: `Receita OS #${ordem.id}`,
          valor: -Number(ordem.valorTotal), // negativo = entrada, ajuste conforme sua regra
          data: new Date(),
        },
      });

      await tx.ordemServico.update({
        where: { id: Number(id) },
        data: { status },
      });
    });

    return getOrdemById(id);
  }

  return prisma.ordemServico.update({
    where: { id: Number(id) },
    data: { status },
    include: {
      cliente: true,
      servicos: { include: { service: true } },
      produtos: { include: { produto: true } },
    },
  });
}

async function deleteOrdem(id) {
  return prisma.ordemServico.delete({ where: { id: Number(id) } });
}

module.exports = {
  listOrdens,
  getOrdemById,
  createOrdem,
  updateStatus,
  deleteOrdem,
};
