const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const auth = require("../middlewares/auth");

router.use(auth);

// ✅ Criar produto
router.post("/", async (req, res) => {
  try {
    const { nome, preco, quantidade, tipo, sku } = req.body;

    if (!nome || tipo === undefined || tipo === "" || preco === undefined || quantidade === undefined) {
      return res.status(400).json({ error: "nome, preco, quantidade e tipo são obrigatórios" });
    }

    const data = {
      nome,
      preco: Number(preco),
      quantidade: Number(quantidade),
      tipo,
    };

    if (sku !== undefined && sku !== null) {
      data.sku = sku;
    }

    const produto = await prisma.produto.create({
      data,
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
    const { nome, preco, quantidade, tipo, sku } = req.body;

    if (!nome || tipo === undefined || tipo === "" || preco === undefined || quantidade === undefined) {
      return res.status(400).json({ error: "nome, preco, quantidade e tipo são obrigatórios" });
    }

    const data = {
      nome,
      preco: Number(preco),
      quantidade: Number(quantidade),
      tipo,
    };

    if (sku !== undefined && sku !== null) {
      data.sku = sku;
    }

    const produto = await prisma.produto.update({
      where: { id: Number(req.params.id) },
      data,
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