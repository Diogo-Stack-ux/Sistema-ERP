const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

// 🔄 Criar movimentação (entrada/saída)
router.post("/", async (req, res) => {
  try {
    const { produtoId, tipo, quantidade } = req.body;

    // Validar campos obrigatórios (mais específico)
    if (produtoId === undefined || produtoId === null || produtoId === '') {
      return res.status(400).json({ error: "produtoId é obrigatório" });
    }
    if (!tipo) {
      return res.status(400).json({ error: "tipo é obrigatório" });
    }
    if (quantidade === undefined || quantidade === null || quantidade === '') {
      return res.status(400).json({ error: "quantidade é obrigatória" });
    }

    // Validar tipo
    if (!["entrada", "saida"].includes(tipo)) {
      return res.status(400).json({ error: "tipo deve ser 'entrada' ou 'saida'" });
    }

    // Buscar produto
    const produto = await prisma.produto.findUnique({
      where: { id: Number(produtoId) },
    });

    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Atualizar estoque
    let novaQuantidade = produto.quantidade;
    const qtdNum = Number(quantidade);

    if (tipo === "entrada") {
      novaQuantidade += qtdNum;
    } else if (tipo === "saida") {
      if (produto.quantidade < qtdNum) {
        return res.status(400).json({ error: "Estoque insuficiente" });
      }
      novaQuantidade -= qtdNum;
    }

    // Atualiza produto
    await prisma.produto.update({
      where: { id: produto.id },
      data: { quantidade: novaQuantidade },
    });

    // Cria movimentação
    const movimentacao = await prisma.movimentacao.create({
      data: {
        produtoId,
        tipo,
        quantidade,
      },
    });

    res.json(movimentacao);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📋 Listar movimentações
router.get("/", async (req, res) => {
  try {
    const movimentacoes = await prisma.movimentacao.findMany({
      include: { produto: true },
    });

    res.json(movimentacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✏️ Atualizar movimentação
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const quantidadeNova = Number(req.body.quantidade);
    const tipoNovo = req.body.tipo;

    const movimentacao = await prisma.movimentacao.findUnique({
      where: { id },
    });

    if (!movimentacao) {
      return res.status(404).json({ error: "Movimentação não encontrada" });
    }

    const produto = await prisma.produto.findUnique({
      where: { id: movimentacao.produtoId },
    });

    let estoque = produto.quantidade;

    // 🔄 Reverter antiga
    if (movimentacao.tipo === "entrada") {
      estoque -= movimentacao.quantidade;
    } else {
      estoque += movimentacao.quantidade;
    }

    // 🔄 Aplicar nova
    if (tipoNovo === "entrada") {
      estoque += quantidadeNova;
    } else if (tipoNovo === "saida") {
      if (estoque < quantidadeNova) {
        return res.status(400).json({ error: "Estoque insuficiente" });
      }
      estoque -= quantidadeNova;
    }

    // Atualizar produto
    await prisma.produto.update({
      where: { id: produto.id },
      data: { quantidade: estoque },
    });

    // Atualizar movimentação
    const movimentacaoAtualizada = await prisma.movimentacao.update({
      where: { id },
      data: {
        tipo: tipoNovo,
        quantidade: quantidadeNova,
      },
    });

    res.json(movimentacaoAtualizada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ Deletar movimentação
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const movimentacao = await prisma.movimentacao.findUnique({
      where: { id },
    });

    if (!movimentacao) {
      return res.status(404).json({ error: "Movimentação não encontrada" });
    }

    const produto = await prisma.produto.findUnique({
      where: { id: movimentacao.produtoId },
    });

    let novaQuantidade = produto.quantidade;

    // 🔄 Reverter movimentação
    if (movimentacao.tipo === "entrada") {
      novaQuantidade -= movimentacao.quantidade;
    } else {
      novaQuantidade += movimentacao.quantidade;
    }

    // Atualizar estoque
    await prisma.produto.update({
      where: { id: produto.id },
      data: { quantidade: novaQuantidade },
    });

    // Deletar movimentação
    await prisma.movimentacao.delete({
      where: { id },
    });

    res.json({ message: "Movimentação deletada e estoque corrigido" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;