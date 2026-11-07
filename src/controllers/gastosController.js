const prisma = require("../lib/prisma");

function handleError(res, error, message) {
  console.error(message, error);
  res.status(500).json({
    error: message,
    details: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
}

async function index(req, res) {
  try {
    const { tipo, status } = req.query;

    const where = { empresaId: req.empresaId };
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;

    const gastos = await prisma.gasto.findMany({
      where,
      orderBy: { data: "desc" },
    });

    res.json(gastos);
  } catch (error) {
    handleError(res, error, "Erro ao listar lançamentos");
  }
}

async function create(req, res) {
  try {
    const { descricao, valor, tipo = "DESPESA", categoria, status, vencimento } = req.body;
    const valorNumerico = Number(valor);

    if (!descricao || !Number.isFinite(valorNumerico)) {
      return res.status(400).json({ error: "Descrição e valor válido são obrigatórios" });
    }

    const gasto = await prisma.gasto.create({
      data: {
        empresaId: req.empresaId,
        descricao,
        valor: valorNumerico,
        tipo,
        categoria: categoria || null,
        status: status || "PENDENTE",
        vencimento: vencimento ? new Date(vencimento) : null,
      },
    });

    res.status(201).json(gasto);
  } catch (error) {
    handleError(res, error, "Erro ao criar lançamento");
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório" });
    }

    const gasto = await prisma.gasto.update({
      where: { id: Number(req.params.id), empresaId: req.empresaId },
      data: { status },
    });

    res.json(gasto);
  } catch (error) {
    handleError(res, error, "Erro ao atualizar status");
  }
}

async function destroy(req, res) {
  try {
    await prisma.gasto.delete({
      where: { id: Number(req.params.id), empresaId: req.empresaId },
    });
    res.status(204).send();
  } catch (error) {
    handleError(res, error, "Erro ao excluir lançamento");
  }
}

async function total(req, res) {
  try {
    const receitas = await prisma.gasto.aggregate({
      where: {
        empresaId: req.empresaId,
        tipo: "RECEITA",
        status: "RECEBIDO",
      },
      _sum: { valor: true },
    });

    const despesas = await prisma.gasto.aggregate({
      where: {
        empresaId: req.empresaId,
        tipo: "DESPESA",
        status: "PAGO",
      },
      _sum: { valor: true },
    });

    const totalReceitas = receitas._sum.valor || 0;
    const totalDespesas = despesas._sum.valor || 0;

    res.json({
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
    });
  } catch (error) {
    handleError(res, error, "Erro ao calcular totais");
  }
}

module.exports = { index, create, updateStatus, destroy, total };
