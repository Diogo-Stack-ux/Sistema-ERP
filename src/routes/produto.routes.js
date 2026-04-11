const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

// ✅ Criar produto
router.post("/", async (req, res) => {
  try {
    const produto = await prisma.produto.create({
      data: req.body,
    });
    res.json(produto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Listar produtos
router.get("/", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany();
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✏️ Atualizar
router.put("/:id", async (req, res) => {
  try {
    const produto = await prisma.produto.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(produto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ❌ Deletar
router.delete("/:id", async (req, res) => {
  try {
    await prisma.produto.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: "Produto deletado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;