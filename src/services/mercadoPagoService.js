const API_BASE_URL = "https://api.mercadopago.com";

const ESSENTIAL_AMOUNT = Number(process.env.MP_ESSENTIAL_AMOUNT || 49.9);
// Plano Profissional preparado para liberar futuramente:
// const PROFESSIONAL_AMOUNT = Number(process.env.MP_PROFESSIONAL_AMOUNT || 89.9);
// Plano Premium preparado para liberar futuramente:
// const PREMIUM_AMOUNT = Number(process.env.MP_PREMIUM_AMOUNT || 149.9);
// Plano Essencial Anual preparado para liberar futuramente:
// const ESSENTIAL_ANNUAL_AMOUNT = Number(process.env.MP_ESSENTIAL_ANNUAL_AMOUNT || 499);
// Plano Profissional Anual preparado para liberar futuramente:
// const PROFESSIONAL_ANNUAL_AMOUNT = Number(process.env.MP_PROFESSIONAL_ANNUAL_AMOUNT || 899);
// Plano Premium Anual preparado para liberar futuramente:
// const PREMIUM_ANNUAL_AMOUNT = Number(process.env.MP_PREMIUM_ANNUAL_AMOUNT || 0);
const MONTHLY_DAYS = Number(process.env.MP_MONTHLY_DAYS || 31);
const PAYMENT_LINK = process.env.MP_ESSENTIAL_PAYMENT_LINK || "https://mpago.la/2BTRPQd";
// const PROFESSIONAL_PAYMENT_LINK =
//   process.env.MP_PROFESSIONAL_PAYMENT_LINK || "https://mpago.la/1dXRoed";
// const PREMIUM_PAYMENT_LINK =
//   process.env.MP_PREMIUM_PAYMENT_LINK || "https://mpago.la/2YifMnW";
// const ESSENTIAL_ANNUAL_PAYMENT_LINK =
//   process.env.MP_ESSENTIAL_ANNUAL_PAYMENT_LINK || "https://mpago.la/1zEBQLR";
// const PROFESSIONAL_ANNUAL_PAYMENT_LINK =
//   process.env.MP_PROFESSIONAL_ANNUAL_PAYMENT_LINK || "https://mpago.la/1scvFQy";
// const PREMIUM_ANNUAL_PAYMENT_LINK =
//   process.env.MP_PREMIUM_ANNUAL_PAYMENT_LINK || "adicione-o-link-do-premium-anual";

function getAccessToken() {
  const token = process.env.MP_ACCESS_TOKEN || "";

  if (token.includes("seu-access-token")) {
    return "";
  }

  return token;
}

function toMercadoPagoDate(date) {
  return date.toISOString().replace("Z", "-0000");
}

function isSameAmount(value, expected) {
  return Math.abs(Number(value || 0) - expected) < 0.01;
}

async function mercadoPagoGet(path, params = {}) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return {
      ok: false,
      status: 500,
      data: { message: "MP_ACCESS_TOKEN nao configurado" },
    };
  }

  const url = new URL(path, API_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function checkPreapprovalByEmail(email) {
  const preapprovalPlanId = process.env.MP_PREAPPROVAL_PLAN_ID;

  if (!preapprovalPlanId) {
    return null;
  }

  const response = await mercadoPagoGet("/preapproval/search", {
    payer_email: email,
    preapproval_plan_id: preapprovalPlanId,
    status: "authorized",
    sort: "date_created",
    criteria: "desc",
    limit: 10,
  });

  if (!response.ok) {
    return {
      active: false,
      reason: "mercado_pago_error",
      detail: response.data?.message || "Erro ao consultar assinatura",
    };
  }

  const subscription = (response.data?.results || []).find((item) =>
    item.status === "authorized" || item.status === "active"
  );

  if (!subscription) {
    return {
      active: false,
      reason: "subscription_not_found",
    };
  }

  return {
    active: true,
    reason: "subscription_active",
    plan: "Essencial",
    paymentLink: PAYMENT_LINK,
    mercadoPago: {
      preapprovalId: subscription.id,
      status: subscription.status,
    },
  };
}

async function checkRecentApprovedPaymentByEmail(email) {
  const endDate = new Date();
  const beginDate = new Date(endDate);
  beginDate.setDate(beginDate.getDate() - MONTHLY_DAYS);

  const response = await mercadoPagoGet("/v1/payments/search", {
    sort: "date_created",
    criteria: "desc",
    range: "date_created",
    begin_date: toMercadoPagoDate(beginDate),
    end_date: toMercadoPagoDate(endDate),
    status: "approved",
    limit: 50,
  });

  if (!response.ok) {
    return {
      active: false,
      reason: "mercado_pago_error",
      detail: response.data?.message || "Erro ao consultar pagamentos",
    };
  }

  const payment = (response.data?.results || []).find((item) => {
    const payerEmail = item.payer?.email?.toLowerCase();
    return (
      item.status === "approved" &&
      payerEmail === email.toLowerCase() &&
      isSameAmount(item.transaction_amount, ESSENTIAL_AMOUNT)
    );
  });

  if (!payment) {
    return {
      active: false,
      reason: "payment_not_found",
    };
  }

  const approvedAt = payment.date_approved || payment.date_created;
  const expiresAt = new Date(approvedAt);
  expiresAt.setDate(expiresAt.getDate() + MONTHLY_DAYS);

  if (expiresAt < new Date()) {
    return {
      active: false,
      reason: "payment_expired",
      approvedAt,
      expiresAt: expiresAt.toISOString(),
    };
  }

  return {
    active: true,
    reason: "payment_active",
    plan: "Essencial",
    approvedAt,
    expiresAt: expiresAt.toISOString(),
    paymentLink: PAYMENT_LINK,
    mercadoPago: {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
    },
  };
}

async function checkSubscriptionStatus(email) {
  if (!email) {
    return {
      active: false,
      reason: "email_missing",
      paymentLink: PAYMENT_LINK,
    };
  }

  const preapprovalStatus = await checkPreapprovalByEmail(email);

  if (preapprovalStatus?.active || preapprovalStatus?.reason === "mercado_pago_error") {
    return {
      ...preapprovalStatus,
      paymentLink: PAYMENT_LINK,
    };
  }

  const paymentStatus = await checkRecentApprovedPaymentByEmail(email);

  return {
    ...paymentStatus,
    paymentLink: PAYMENT_LINK,
  };
}

module.exports = {
  checkSubscriptionStatus,
};
