import { useEffect, useState } from "react";
import { getPerfilCliente } from "../services/clienteApi";

function ClientProfileModal({ isOpen, clientId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("dados");

  useEffect(() => {
    if (!isOpen || !clientId) return;

    async function carregarPerfil() {
      try {
        setLoading(true);
        const dados = await getPerfilCliente(clientId);
        setPerfil(dados);
      } catch (error) {
        console.error("Erro ao carregar perfil do cliente:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarPerfil();
  }, [isOpen, clientId]);

  if (!isOpen) return null;

  const cliente = perfil?.cliente;
  const estatisticas = perfil?.estatisticas;
  const ordensServico = cliente?.ordensServico || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-950 p-6 text-slate-100 shadow-2xl ring-1 ring-slate-700">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-700 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Perfil do Cliente
            </p>
            <h2 className="mt-2 text-3xl font-black">
              {cliente?.nome || "Cliente"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-red-500/10 px-3 py-2 text-red-400 hover:bg-red-500/20"
          >
            Fechar
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-slate-400">Carregando...</p>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-700">
                <p className="text-sm text-slate-400">Total de Serviços</p>
                <p className="mt-2 text-3xl font-black">
                  {estatisticas?.totalServicos || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-700">
                <p className="text-sm text-slate-400">Valor Total Gasto</p>
                <p className="mt-2 text-3xl font-black">
                  R${" "}
                  {Number(estatisticas?.totalGasto || 0).toLocaleString(
                    "pt-BR",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-700">
                <p className="text-sm text-slate-400">Último Atendimento</p>
                <p className="mt-2 text-lg font-bold">
                  {estatisticas?.ultimaVisita
                    ? new Date(estatisticas.ultimaVisita).toLocaleDateString(
                        "pt-BR"
                      )
                    : "Nenhum atendimento"}
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {["dados", "historico", "financeiro", "observacoes"].map(
                (aba) => (
                  <button
                    key={aba}
                    onClick={() => setAbaAtiva(aba)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      abaAtiva === aba
                        ? "bg-violet-500 text-white"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {aba === "dados" && "Dados"}
                    {aba === "historico" && "Histórico"}
                    {aba === "financeiro" && "Financeiro"}
                    {aba === "observacoes" && "Observações"}
                  </button>
                )
              )}
            </div>

            {abaAtiva === "dados" && (
              <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-700">
                <h3 className="mb-4 text-xl font-bold">Dados do Cliente</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <p>
                    <span className="text-slate-400">Nome:</span>{" "}
                    {cliente?.nome}
                  </p>
                  <p>
                    <span className="text-slate-400">Email:</span>{" "}
                    {cliente?.email}
                  </p>
                  <p>
                    <span className="text-slate-400">Telefone:</span>{" "}
                    {cliente?.telefone}
                  </p>
                  <p>
                    <span className="text-slate-400">Endereço:</span>{" "}
                    {cliente?.endereco}
                  </p>
                </div>
              </div>
            )}

            {abaAtiva === "historico" && (
              <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-700">
                <h3 className="mb-4 text-xl font-bold">
                  Histórico de Ordens de Serviço
                </h3>

                {ordensServico.length === 0 ? (
                  <p className="text-slate-400">
                    Nenhuma ordem de serviço encontrada para este cliente.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {ordensServico.map((os) => (
                      <div
                        key={os.id}
                        className="rounded-2xl border border-slate-700 bg-slate-950 p-4"
                      >
                        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-lg font-bold">OS #{os.id}</p>
                            <p className="text-sm text-slate-400">
                              {new Date(os.createdAt).toLocaleDateString(
                                "pt-BR"
                              )}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300">
                              {os.status}
                            </span>

                            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                              R${" "}
                              {Number(os.valorTotal || 0).toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        {os.observacoes && (
                          <p className="mb-3 text-sm text-slate-300">
                            <span className="text-slate-500">Obs:</span>{" "}
                            {os.observacoes}
                          </p>
                        )}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <p className="mb-2 text-sm font-bold text-slate-300">
                              Serviços
                            </p>

                            {os.servicos?.length > 0 ? (
                              <ul className="space-y-1 text-sm text-slate-400">
                                {os.servicos.map((item) => (
                                  <li key={item.id}>
                                    • {item.service?.nome || "Serviço"}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-500">
                                Nenhum serviço vinculado.
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="mb-2 text-sm font-bold text-slate-300">
                              Produtos usados
                            </p>

                            {os.produtos?.length > 0 ? (
                              <ul className="space-y-1 text-sm text-slate-400">
                                {os.produtos.map((item) => (
                                  <li key={item.id}>
                                    • {item.produto?.nome || "Produto"} — qtd:{" "}
                                    {item.quantidade}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-500">
                                Nenhum produto usado.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {abaAtiva === "financeiro" && (
              <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-700">
                <h3 className="mb-2 text-xl font-bold">Financeiro</h3>
                <p className="text-slate-400">
                  Nesta aba vamos conectar os lançamentos financeiros do cliente.
                </p>
              </div>
            )}

            {abaAtiva === "observacoes" && (
              <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-700">
                <h3 className="mb-2 text-xl font-bold">Observações</h3>
                <p className="text-slate-400">
                  Nesta aba vamos salvar observações importantes sobre o cliente.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ClientProfileModal;
