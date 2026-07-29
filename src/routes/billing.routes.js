const express = require("express");

const auth = require("../middlewares/auth");
const { checkSubscriptionStatus } = require("../services/mercadoPagoService");

const router = express.Router();

router.use(auth);

router.get("/status", async (req, res) => {
  try {
    const subscription = await checkSubscriptionStatus(req.usuarioEmail);

    res.json({
      email: req.usuarioEmail,
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      error: "Erro ao verificar assinatura",
      detail: error.message,
    });
  }
});

module.exports = router;
