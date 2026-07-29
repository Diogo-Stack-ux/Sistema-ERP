const { checkSubscriptionStatus } = require("../services/mercadoPagoService");

async function requireSubscription(req, res, next) {
  try {
    const status = await checkSubscriptionStatus(req.usuarioEmail);

    if (!status.active) {
      return res.status(402).json({
        error: "Assinatura inativa",
        subscription: status,
      });
    }

    req.subscription = status;

    return next();
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao verificar assinatura",
      detail: error.message,
    });
  }
}

module.exports = requireSubscription;
