import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [pagina, setPagina] = useState("dashboard");
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
  const [editandoId, setEditandoId] = useState(null);

  const buscarClientes = async () => {
    const res = await api.get("/clientes");
    setClientes(res.data);
  };

  const limparFormulario = () => {
    setEditandoId(null);
    setNome("");
    setEmail("");
    setTelefone("");
    setEndereco("");
  };

  const criarCliente = async () => {
    try {
      await api.post("/clientes", {
        nome,
        email,
        telefone,
        endereco,
      });

      limparFormulario();
      buscarClientes();
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
    }
  };

  const atualizarCliente = async () => {
    try {
      await api.put(`/clientes/${editandoId}`, {
        nome,
        email,
        telefone,
        endereco,
      });

      limparFormulario();
      buscarClientes();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  const deletarCliente = async (id) => {
    await api.delete(`/clientes/${id}`);
    buscarClientes();
  };

  useEffect(() => {
    api.get("/dashboard").then((res) => {
      setDados(res.data);
    });

    buscarClientes();
  }, []);

  const botaoMenuClasse = (nomePagina) =>
    `rounded-2xl px-5 py-4 text-left text-lg font-medium transition-all ${
      pagina === nomePagina
        ? "bg-slate-800 text-white shadow-lg shadow-slate-950/25"
        : "text-slate-300 hover:bg-slate-900 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="w-52 min-h-screen rounded-r-[1.5rem] bg-slate-950 px-4 py-6 text-white shadow-2xl">
        <div className="mb-7">
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-slate-400">
            Painel
          </p>
          <h2 className="text-[1.8rem] font-black tracking-tight">Sistema</h2>
          <p className="mt-2.5 text-[13px] leading-6 text-slate-400">
            Gestao simples, organizada e pronta para o dia a dia.
          </p>
        </div>

        <nav className="flex flex-col gap-3">
          <button
            onClick={() => setPagina("dashboard")}
            className={`${botaoMenuClasse("dashboard")} px-3.5 py-2.5 text-[13px]`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setPagina("clientes")}
            className={`${botaoMenuClasse("clientes")} px-3.5 py-2.5 text-[13px]`}
          >
            Clientes
          </button>
          <button
            onClick={() => setPagina("produtos")}
            className={`${botaoMenuClasse("produtos")} px-3.5 py-2.5 text-[13px]`}
          >
            Produtos
          </button>
          <button
            onClick={() => setPagina("movimentacoes")}
            className={`${botaoMenuClasse("movimentacoes")} px-3.5 py-2.5 text-[13px]`}
          >
            Movimentacoes
          </button>
          <button
            onClick={() => setPagina("gastos")}
            className={`${botaoMenuClasse("gastos")} px-3.5 py-2.5 text-[13px]`}
          >
            Gastos
          </button>
        </nav>
      </aside>

      <main className="flex-1 px-3 py-5 md:px-4 lg:px-5">
        <div className="mx-auto w-full max-w-[62rem]">
          {pagina === "dashboard" && (
            <>
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Visao geral
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                  Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-base text-slate-600">
                  Acompanhe rapidamente os principais numeros do sistema.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Clientes
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-900">{dados.totalClientes}</h2>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Produtos
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-900">{dados.totalProdutos}</h2>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Estoque
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-900">{dados.estoqueTotal}</h2>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Gastos
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-900">{dados.totalGastos}</h2>
                </div>
              </div>
            </>
          )}

          {pagina === "clientes" && (
            <section>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Cadastro
                </p>
                <div className="mt-2 flex flex-col items-center gap-3 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
                  <div className="mx-auto lg:mx-0">
                    <h1 className="text-[1.7rem] font-black tracking-tight text-slate-900">
                      Clientes
                    </h1>
                    <p className="mt-1 text-[13px] text-slate-600">
                      Gerencie os clientes cadastrados em um unico lugar.
                    </p>
                  </div>

                  {editandoId && (
                    <div className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                      Editando cliente. Revise os dados e clique em salvar.
                    </div>
                  )}
                </div>
              </div>

              <div className="mx-auto max-w-[54rem] rounded-[1.25rem] bg-white p-3 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 md:p-3.5">
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-[0.7fr_0.85fr_0.62fr_0.72fr_auto]">
                  <input
                    className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                  <input
                    className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                  <input
                    className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Endereco"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />

                  <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                    <button
                      onClick={editandoId ? atualizarCliente : criarCliente}
                      className="bg-black text-white px-4 rounded"
                    >
                      {editandoId ? "Atualizar" : "Adicionar"}
                    </button>

                    {editandoId && (
                      <button
                        onClick={limparFormulario}
                        className="border border-gray-300 text-gray-700 px-4 rounded"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 overflow-hidden rounded-[1rem] border border-slate-200">
                  <div className="hidden grid-cols-[0.65fr_0.9fr_0.65fr_0.68fr_0.55fr] bg-slate-900 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-100 md:grid">
                    <div className="px-2.5 py-2">Nome</div>
                    <div className="px-2.5 py-2">Email</div>
                    <div className="px-2.5 py-2">Telefone</div>
                    <div className="px-2.5 py-2">Endereco</div>
                    <div className="px-2.5 py-2 text-center">Acoes</div>
                  </div>

                  {clientes.length === 0 && (
                    <div className="bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                      Nenhum cliente cadastrado.
                    </div>
                  )}

                  {clientes.map((c) => (
                    <div key={c.id} className="border-t border-slate-200 bg-white first:border-t-0">
                      <div className="grid gap-2 px-2.5 py-2 md:grid-cols-[0.65fr_0.9fr_0.65fr_0.68fr_0.55fr] md:items-center md:gap-1.5 md:px-2.5">
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Nome
                          </p>
                          <p className="truncate text-[10px] font-semibold text-slate-900">{c.nome}</p>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Email
                          </p>
                          <p className="truncate text-[10px] text-slate-600">{c.email}</p>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Telefone
                          </p>
                          <p className="truncate text-[10px] text-slate-600">{c.telefone}</p>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Endereco
                          </p>
                          <p className="truncate text-[10px] text-slate-600">{c.endereco}</p>
                        </div>

                        <div className="flex gap-1 md:justify-center">
                          <button
                            onClick={() => {
                              setEditandoId(c.id);
                              setNome(c.nome);
                              setEmail(c.email);
                              setTelefone(c.telefone);
                              setEndereco(c.endereco);
                            }}
                            className="rounded-md bg-blue-50 px-1.5 py-1 text-[9px] font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deletarCliente(c.id)}
                            className="rounded-md bg-red-50 px-1.5 py-1 text-[9px] font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {pagina === "produtos" && (
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Tela de Produtos</h1>
          )}
          {pagina === "movimentacoes" && (
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Movimentacoes</h1>
          )}
          {pagina === "gastos" && (
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Gastos</h1>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
