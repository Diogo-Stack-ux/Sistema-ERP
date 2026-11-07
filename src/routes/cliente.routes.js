const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const auth = require("../middlewares/auth");

router.use(auth);

// ✅ Criar cliente
router.post("/", async (req, res) => {
  try {
    const { nome, email = "", telefone = "", endereco = "" } = req.body || {};
    if (typeof nome !== "string" || !nome.trim()) {
      return res.status(400).json({ error: "Informe o nome do cliente." });
    }
    if (![email, telefone, endereco].every((value) => typeof value === "string")) {
      return res.status(400).json({ error: "Email, telefone e endereco devem ser textos." });
    }
    const cliente = await prisma.cliente.create({
      data: {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        empresaId: req.empresaId,
      },
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error("ERRO:", error);
    res.status(500).json({ error: "Nao foi possivel cadastrar o cliente. Tente novamente." });
  }
});


// ✅ Listar clientes
router.get("/", auth, async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { empresaId: req.empresaId },
    });
    res.json(clientes);
  } catch (error) {
    console.error("ERRO:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Atualizar cliente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, endereco } = req.body;

    const cliente = await prisma.cliente.update({
      where: { id: Number(id), empresaId: req.empresaId },
      data: { nome, email, telefone, endereco },
    });

    res.json(cliente);
  } catch (error) {
    console.error("ERRO:", error);
    res.status(500).json({ error: error.message });
  }
});


// ❌ Deletar cliente
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cliente.delete({
      where: { id: Number(id), empresaId: req.empresaId },
    });

    res.json({ message: "Cliente deletado com sucesso" });
  } catch (error) {
    console.error("ERRO:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id/perfil", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const cliente = await prisma.cliente.findUnique({
      where: {
        id,
        empresaId: req.empresaId,
      },
      include: {
        ordensServico: {
          include: {
            servicos: {
              include: {
                service: true,
              },
            },
            produtos: {
              include: {
                produto: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({
        message: "Cliente não encontrado",
      });
    }

    const totalServicos = cliente.ordensServico.length;

    const totalGasto = cliente.ordensServico.reduce(
      (total, os) => total + os.valorTotal,
      0
    );

    const ultimaVisita =
      cliente.ordensServico.length > 0
        ? cliente.ordensServico[0].createdAt
        : null;

    res.json({
      cliente,
      estatisticas: {
        totalServicos,
        totalGasto,
        ultimaVisita,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
