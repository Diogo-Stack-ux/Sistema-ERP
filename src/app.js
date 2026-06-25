require("dotenv/config");
const express = require("express");
const cors = require("cors");
const app = express();
const produtoRoutes = require("./routes/produto.routes");
const clienteRoutes = require("./routes/cliente.routes");
const movimentacaoRoutes = require("./routes/movimentacao.routes");
const gastoRoutes = require("./routes/gasto.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const eventoRoutes = require("./routes/evento.routes");
const authRoutes = require("./routes/auth.routes");
const serviceRoutes = require("./routes/service.routes");
const ordemServicoRoutes = require("./routes/ordemServicoRoutes");
const prisma = require("./lib/prisma");

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/clientes", clienteRoutes);
app.use("/produtos", produtoRoutes);
app.use("/movimentacoes", movimentacaoRoutes);
app.use("/gastos", gastoRoutes);
app.use("/eventos", eventoRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/auth", authRoutes);
app.use("/services", serviceRoutes);
app.use("/ordens-servico", ordemServicoRoutes);




app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

const startServer = async () => {
  try {
    // Test database connection
    await prisma.cliente.findFirst();
    console.log("✅ Database connection successful");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Please ensure DATABASE_URL is set correctly in .env and migrations are run.");
  }

  app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
  });
};

startServer();
