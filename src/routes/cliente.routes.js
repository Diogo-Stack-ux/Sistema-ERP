const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const auth = require("../middlewares/auth");

router.use(auth);

// ✅ Criar cliente
router.post("/", async (req, res) => {
  console.log("🔥 CHEGOU REQUISIÇÃO");
  console.log(req.body);
  try {
    const cliente = await prisma.cliente.create({
      data: req.body,
    });

    res.json(cliente);
  } catch (error) {
    console.error("ERRO:", error);
    res.status(500).json({ error: error.message });
  }
});


// ✅ Listar clientes
router.get("/", auth, async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany();
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

    const cliente = await prisma.cliente.update({
      where: { id: Number(id) },
      data: req.body,
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
      where: { id: Number(id) },
    });

    res.json({ message: "Cliente deletado com sucesso" });
  } catch (error) {
    console.error("ERRO:", error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;