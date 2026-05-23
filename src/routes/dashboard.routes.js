const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

router.get("/", async (req, res) => {
  try {
    // 👤 Clientes
    const totalClientes = await prisma.cliente.count();

    // 📦 Produtos
    const totalProdutos = await prisma.produto.count();

    // 📦 Soma do estoque
    const estoque = await prisma.produto.aggregate({
      _sum: {
        quantidade: true,
      },
    });

    // 💸 Gastos
    const gastos = await prisma.gasto.aggregate({
      _sum: {
        valor: true,
      },
    });

    // ⚠️ Estoque baixo
    const estoqueBaixo = await prisma.produto.findMany({
      where: {
        quantidade: {
          lte: 5,
        },
      },
    });

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