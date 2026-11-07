const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const auth = require("../middlewares/auth");

router.use(auth);

// 📌 LISTAR EVENTOS
router.get("/", async (req, res) => {
  try {
    const eventos = await prisma.evento.findMany({
      where: { empresaId: req.empresaId },
      include: {
        cliente: true,
      },
      orderBy: {
        data: "asc",
      },
    });

    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 📌 CRIAR EVENTO
router.post("/", async (req, res) => {
  try {
    const {
      titulo,
      descricao,
      tipo,
      data,
      clienteId,
      concluido,
    } = req.body;

    if (clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          id: Number(clienteId),
          empresaId: req.empresaId,
        },
      });

      if (!cliente) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
    }

    const evento = await prisma.evento.create({
      data: {
        empresaId: req.empresaId,
        titulo,
        descricao,
        tipo,
        data: new Date(data),
        concluido: concluido ?? false,

        clienteId: clienteId || null,
      },
    });

    res.json(evento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// 📌 ATUALIZAR EVENTO
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      titulo,
      descricao,
      tipo,
      data,
      clienteId,
      concluido,
    } = req.body;

    if (clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          id: Number(clienteId),
          empresaId: req.empresaId,
        },
      });

      if (!cliente) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
    }

    const evento = await prisma.evento.update({
      where: {
        id: Number(id),
        empresaId: req.empresaId,
      },
      data: {
        titulo,
        descricao,
        tipo,
        data: new Date(data),
        concluido: concluido ?? false,
        clienteId: clienteId || null,
      },
    });

    res.json(evento);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 📌 DELETAR EVENTO
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.evento.delete({
      where: {
        id: Number(id),
        empresaId: req.empresaId,
      },
    });

    res.json({
      message: "Evento removido com sucesso",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
