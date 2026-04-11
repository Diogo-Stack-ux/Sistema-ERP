const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");


// ✅ Criar cliente
router.post("/", async (req, res) => {
  try {
    const cliente = await prisma.cliente.create({
      data: req.body,
    });

    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ Listar clientes
router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Atualizar cliente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await prisma.cliente.update({
      where: { id: Number(id) },
      data: req.body,
    });

    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ❌ Deletar cliente
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cliente.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Cliente deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;