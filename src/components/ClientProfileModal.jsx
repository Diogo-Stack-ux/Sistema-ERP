import { useCallback, useEffect, useState } from "react";
import { getPerfilCliente } from "../services/clienteApi";
import { getEquipamentosPorCliente } from "../services/equipamentoApi";
import EquipmentModal from "./EquipmentModal";


function ClientProfileModal({ isOpen, clientId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [equipamentos, setEquipamentos] = useState([]);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("dados");

  const carregarEquipamentos = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoadingEquipamentos(true);

      const dados = await getEquipamentosPorCliente(clientId);

      setEquipamentos(dados);
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error);
    } finally {
      setLoadingEquipamentos(false);
    }
  }, [clientId]);

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

    async function carregarDados() {
      await carregarPerfil();
      await carregarEquipamentos();
    }

    carregarDados();
  }, [isOpen, clientId, carregarEquipamentos]);

  if (!isOpen) return null;

  const cliente = perfil?.cliente;
  const estatisticas = perfil?.estatisticas;
  const ordensServico = cliente?.ordensServico || [];

  const totalGasto = Number(estatisticas?.totalGasto || 0);
  const totalServicos = Number(estatisticas?.totalServicos || 0);

  const ticketMedio =
    totalServicos > 0 ? totalGasto / totalServicos : 0;

  const ultimaOS = ordensServico[0];

  const ultimoServico =
    ultimaOS?.servicos?.[0]?.service?.nome || "Nenhum serviço";

  const diasSemAtendimento = estatisticas?.ultimaVisita
    ? Math.floor(
      (new Date() - new Date(estatisticas.ultimaVisita)) /
      (1000 * 60 * 60 * 24)
    )
    : null;

  const categoriaCliente =
    totalGasto >= 5000
      ? "VIP"
      : totalServicos >= 5
        ? "Recorrente"
        : diasSemAtendimento !== null && diasSemAtendimento >= 180
          ? "Inativo"
          : "Novo";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-950 p-6 text-slate-100 shadow-2xl ring-1 ring-slate-700">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 p-6 shadow-2xl shadow-violet-950/40">
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-3xl font-black text-white ring-1 ring-white/25">
          {cliente?.nome
            ? cliente.nome
              .split(" ")
              .map((parte) => parte[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
            : "CL"}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            Perfil do Cliente
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            {cliente?.nome || "Cliente"}
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20">
              ⭐ {categoriaCliente}
            </span>

            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20">
              {totalServicos} serviços
            </span>

            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20">
              Cliente desde{" "}
              {cliente?.createdAt
                ? new Date(cliente.createdAt).toLocaleDateString("pt-BR")
                : "-"}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
      >
        Fechar
      </button>
    </div>
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

          <div className="mb-6 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-700">
            <h3 className="mb-4 text-xl font-bold">
              Resumo Inteligente
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Último Serviço</p>
                <p className="mt-2 font-bold text-slate-100">
                {ultimoServico}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Ticket Médio</p>
              <p className="mt-2 font-bold text-emerald-300">
                R${" "}
                {ticketMedio.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Tempo sem atendimento</p>
              <p className="mt-2 font-bold text-slate-100">
                {diasSemAtendimento !== null
                  ? `${diasSemAtendimento} dias`
                  : "Sem atendimento"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Categoria</p>
              <p className="mt-2 font-bold text-violet-300">
                {categoriaCliente}
              </p>
            </div>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {["dados", "historico", "equipamentos", "financeiro", "observacoes"].map(
              (aba) => (
                <button
                  key={aba}
                  onClick={() => setAbaAtiva(aba)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${abaAtiva === aba
                    ? "bg-violet-500 text-white"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                >
                  {aba === "dados" && "Dados"}
                  {aba === "historico" && "Histórico"}
                  {aba === "equipamentos" && "Equipamentos"}
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

          {abaAtiva === "equipamentos" && (
            <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-700">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    Equipamentos do Cliente
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Equipamentos, veículos e ativos vinculados a este cliente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEquipamentoSelecionado(null);
                    setEquipmentModalOpen(true);
                  }}
                  className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-600"
                >
                  Novo Equipamento
                </button>
              </div>

              {loadingEquipamentos ? (
                <p className="py-8 text-center text-slate-400">
                  Carregando equipamentos...
                </p>
              ) : equipamentos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
                  <p className="font-semibold text-slate-300">
                    Nenhum equipamento cadastrado
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Cadastre o primeiro equipamento deste cliente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {equipamentos.map((equipamento) => (
                    <div
                      key={equipamento.id}
                      className="rounded-2xl border border-slate-700 bg-slate-950 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black text-white">
                            {equipamento.nome}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {equipamento.tipo || "Tipo não informado"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            equipamento.ativo
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {equipamento.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <p>
                          <span className="text-slate-500">Marca:</span>{" "}
                          <span className="text-slate-300">
                            {equipamento.marca || "-"}
                          </span>
                        </p>

                        <p>
                          <span className="text-slate-500">Modelo:</span>{" "}
                          <span className="text-slate-300">
                            {equipamento.modelo || "-"}
                          </span>
                        </p>

                        <p>
                          <span className="text-slate-500">
                            Número de série:
                          </span>{" "}
                          <span className="text-slate-300">
                            {equipamento.numeroSerie || "-"}
                          </span>
                        </p>

                        <p>
                          <span className="text-slate-500">
                            Identificação:
                          </span>{" "}
                          <span className="text-slate-300">
                            {equipamento.identificacao || "-"}
                          </span>
                        </p>
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

          {abaAtiva === "historico" && (
            <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-700">
              <h3 className="mb-6 text-xl font-bold">
                Linha do Tempo de Atendimentos
              </h3>

              {ordensServico.length === 0 ? (
                <p className="text-slate-400">
                  Nenhuma ordem de serviço encontrada para este cliente.
                </p>
              ) : (
                <div className="relative border-l border-violet-500/40 pl-6">
                  {ordensServico.map((os) => (
                    <div key={os.id} className="relative mb-8">
                      <span className="absolute -left-[33px] top-1 flex h-4 w-4 rounded-full bg-violet-500 ring-4 ring-slate-900" />

                      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-lg">
                        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-lg font-black text-white">
                              OS #{os.id}
                            </p>

                            <p className="text-sm text-slate-400">
                              {new Date(os.createdAt).toLocaleDateString(
                                "pt-BR"
                              )}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${os.status === "CONCLUIDA"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : os.status === "EM_ANDAMENTO"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-blue-500/20 text-blue-300"
                                }`}
                            >
                              {os.status}
                            </span>

                            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-300">
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
                          <p className="mb-4 rounded-xl bg-slate-900 p-3 text-sm text-slate-300">
                            {os.observacoes}
                          </p>
                        )}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <p className="mb-2 text-sm font-bold text-slate-300">
                              Serviços realizados
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
                              Produtos utilizados
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
                                Nenhum produto utilizado.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      <EquipmentModal
        isOpen={equipmentModalOpen}
        clienteId={clientId}
        equipamento={equipamentoSelecionado}
        onClose={() => {
          setEquipmentModalOpen(false);
          setEquipamentoSelecionado(null);
        }}
        onSuccess={carregarEquipamentos}
      />
    </div>
  );
}

export default ClientProfileModal;
