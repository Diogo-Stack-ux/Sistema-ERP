import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [pagina, setPagina] = useState("dashboard");
  
  // ✅ COLOCA AQUI (dentro do componente)
  const [dados, setDados] = useState({
    totalClientes: 0,
    totalProdutos: 0,
    estoqueTotal: 0,
    totalGastos: 0,
  });
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");

  const buscarClientes = async () => {
    const res = await api.get("/clientes");
    setClientes(res.data);
  };

  const criarCliente = async () => {
    try {
      await api.post("/clientes", {
        nome,
        email,
        telefone,
        endereco,
      });

      setNome("");
      setEmail("");
      setTelefone("");
      setEndereco("");

      buscarClientes(); // atualiza lista
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
    }
  };

  const deletarCliente = async (id) => {
    await api.delete(`/clientes/${id}`);
    buscarClientes();
  };

  // 🔄 Buscar dados do backend
  useEffect(() => {
    api.get("/dashboard").then((res) => {
      setDados(res.data);
    });

    buscarClientes(); // 👈 aqui
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-black text-white p-5">
        <h2 className="text-2xl mb-6">Sistema</h2>
        <div className="flex flex-col gap-2">
          <button onClick={() => setPagina("dashboard")}>
            Dashboard
          </button>

          <button onClick={() => setPagina("clientes")}>
            Clientes
          </button>

          <button onClick={() => setPagina("produtos")}>
            Produtos
          </button>

          <button onClick={() => setPagina("movimentacoes")}>
            Movimentações
          </button>

          <button onClick={() => setPagina("gastos")}>
            Gastos
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-6">

  {pagina === "dashboard" && (
    <>
      <h1 className="text-3xl mb-4">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p>Clientes</p>
          <h2 className="text-xl font-bold">{dados.totalClientes}</h2>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p>Produtos</p>
          <h2 className="text-xl font-bold">{dados.totalProdutos}</h2>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p>Estoque</p>
          <h2 className="text-xl font-bold">{dados.estoqueTotal}</h2>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p>Gastos</p>
          <h2 className="text-xl font-bold">{dados.totalGastos}</h2>
        </div>
      </div>
    </>
  )}

  {pagina === "clientes" && (
  <div>
    <h1 className="text-2xl mb-4">Clientes</h1>

    {/* FORM */}
    <div className="mb-4 flex gap-2">
      <input
        className="border p-2 rounded"
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <input
        className="border p-2 rounded"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 rounded"
        placeholder="Telefone"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
      />

      <input
        className="border p-2 rounded"
        placeholder="Endereço"
        value={endereco}
        onChange={(e) => setEndereco(e.target.value)}
      />

      <button
        onClick={criarCliente}
        className="bg-black text-white px-4 rounded"
      >
        Adicionar
      </button>
    </div>

    {/* LISTA */}
    <div className="bg-white p-4 rounded shadow">
      {clientes.map((c) => (
        <div
          key={c.id}
          className="flex justify-between border-b py-2"
        >
          <div>
            <p>{c.nome}</p>
            <p className="text-sm text-gray-500">{c.email}</p>
          </div>

          <button
            onClick={() => deletarCliente(c.id)}
            className="text-red-500"
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  </div>
)}

  {pagina === "produtos" && <h1>📦 Tela de Produtos</h1>}
  {pagina === "movimentacoes" && <h1>🔄 Movimentações</h1>}
  {pagina === "gastos" && <h1>💸 Gastos</h1>}

</main>
    </div>
  );
}

export default App;
