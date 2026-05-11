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


app.use(cors());
app.use(express.json());
app.use("/clientes", clienteRoutes);
app.use("/produtos", produtoRoutes);
app.use("/movimentacoes", movimentacaoRoutes);
app.use("/gastos", gastoRoutes);
app.use("/eventos", eventoRoutes);
app.use("/dashboard", dashboardRoutes);


app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
