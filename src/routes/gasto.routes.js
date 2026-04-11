const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

// 💸 Criar gasto
router.post("/", async (req, res) => {
  try {
    const descricao = req.body.descricao;
    const valor = Number(req.body.valor);

    const gasto = await prisma.gasto.create({
      data: {
        descricao,
        valor,
      },
    });

    res.json(gasto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📋 Listar gastos
router.get("/", async (req, res) => {
  try {
    const gastos = await prisma.gasto.findMany();
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📊 Total de gastos
router.get("/total", async (req, res) => {
  try {
    const total = await prisma.gasto.aggregate({
      _sum: {
        valor: true,
      },
    });

    res.json({
      totalGastos: total._sum.valor || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.gasto.delete({
      where: { id },
    });

    res.json({ message: "Gasto deletado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
