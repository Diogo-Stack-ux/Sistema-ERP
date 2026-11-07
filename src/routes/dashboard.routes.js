const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const auth = require("../middlewares/auth");

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const [totalClientes, totalProdutos, estoque, gastos, estoqueBaixo] =
      await Promise.all([
        prisma.cliente.count({
          where: { empresaId: req.empresaId },
        }),
        prisma.produto.count({
          where: { empresaId: req.empresaId },
        }),
        prisma.produto.aggregate({
          where: { empresaId: req.empresaId },
          _sum: {
            quantidade: true,
          },
        }),
        prisma.gasto.aggregate({
          where: { empresaId: req.empresaId },
          _sum: {
            valor: true,
          },
        }),
        prisma.produto.findMany({
          where: {
            empresaId: req.empresaId,
            quantidade: {
              lte: 5,
            },
          },
          orderBy: {
            quantidade: "asc",
          },
          take: 10,
        }),
      ]);

    res.json({
      totalClientes,
      totalProdutos,
      estoqueTotal: estoque._sum.quantidade || 0,
      totalGastos: gastos._sum.valor || 0,
      estoqueBaixo,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
