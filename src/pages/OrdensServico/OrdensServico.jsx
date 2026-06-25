import { useEffect, useState } from "react";
import { FaChevronDown, FaTrashAlt } from "react-icons/fa";
import { getOrdens, updateOrdemStatus, deleteOrdem } from "../../services/ordemServicoApi";
import OrdemServicoModal from "./OrdemServicoModal";

const STATUS_LABELS = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

const STATUS_STYLES = {
  ABERTA: "bg-sky-500/15 text-sky-300",
  EM_ANDAMENTO: "bg-amber-500/15 text-amber-300",
  CONCLUIDA: "bg-emerald-500/15 text-emerald-300",
};

function OrdensServico() {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  async function loadOrdens() {
    try {
      setLoading(true);
      const data = await getOrdens();
      setOrdens(data);
    } catch (error) {
      console.error("Erro ao carregar ordens de serviço:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrdens();
  }, []);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  async function handleStatusChange(id, status) {
    try {
      setUpdatingId(id);
      await updateOrdemStatus(id, status);
      await loadOrdens();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status da OS");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteOrdem(id);
      await loadOrdens();
    } catch (error) {
      console.error("Erro ao excluir ordem de serviço:", error);
      alert("Erro ao excluir ordem de serviço");
    } finally {
      setDeletingId(null);
    }
  }

  // Cards de resumo por status
  const resumo = ordens.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { ABERTA: 0, EM_ANDAMENTO: 0, CONCLUIDA: 0, total: 0 }
  );

  return (
    <>
      <section className="mx-auto w-full max-w-6xl rounded-[1.25rem] glass-card p-4 ring-1 ring-slate-200/10 sm:p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Operação
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
              Ordens de Serviço
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Gerencie as ordens de serviço dos seus clientes.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
          >
            Nova Ordem de Serviço
          </button>
        </div>

        {/* Cards de status */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-black text-slate-100">{resumo.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-sky-400">Abertas</p>
            <p className="mt-1 text-2xl font-black text-slate-100">{resumo.ABERTA}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-400">Em andamento</p>
            <p className="mt-1 text-2xl font-black text-slate-100">{resumo.EM_ANDAMENTO}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">Concluídas</p>
            <p className="mt-1 text-2xl font-black text-slate-100">{resumo.CONCLUIDA}</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-700/60 bg-slate-950/50 p-6 text-sm text-slate-400">
            Carregando ordens de serviço...
          </div>
        ) : ordens.length === 0 ? (
          <div className="rounded-3xl border border-slate-700/60 bg-slate-950/50 p-8 text-center">
            <h2 className="text-lg font-bold text-slate-100">
              Nenhuma ordem de serviço cadastrada
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Clique em Nova Ordem de Serviço para começar.
            </p>
          </div>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {ordens.map((ordem) => (
              <article
                key={ordem.id}
                className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">OS #{ordem.id}</p>
                    <p className="truncate font-semibold text-slate-100">
                      {ordem.cliente?.nome ?? "-"}
                    </p>
                    <p className="text-xs text-slate-500">{ordem.cliente?.telefone}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-emerald-300">
                    {formatCurrency(ordem.valorTotal)}
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {ordem.servicos?.map((s) => (
                      <span key={s.id} className="rounded-full bg-slate-800/80 px-2 py-1 text-xs text-slate-300">
                        {s.service?.nome}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ordem.produtos?.map((p) => (
                      <span key={p.id} className="rounded-full bg-slate-800/80 px-2 py-1 text-xs text-slate-300">
                        {p.produto?.nome} x{p.quantidade}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div className="relative inline-flex min-w-0 items-center">
                    <select
                      value={ordem.status}
                      disabled={updatingId === ordem.id || ordem.status === "CONCLUIDA"}
                      onChange={(e) => handleStatusChange(ordem.id, e.target.value)}
                      className={`h-10 w-full appearance-none rounded-lg border border-slate-700/70 bg-slate-950 px-3 pr-9 text-sm font-semibold outline-none ${STATUS_STYLES[ordem.status]} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <option className="bg-slate-950 text-slate-100" value="ABERTA">Aberta</option>
                      <option className="bg-slate-950 text-slate-100" value="EM_ANDAMENTO">Em andamento</option>
                      <option className="bg-slate-950 text-slate-100" value="CONCLUIDA">Concluida</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 text-xs text-slate-400">
                      <FaChevronDown />
                    </span>
                  </div>
                  <button
                    onClick={() => setDeletingId(ordem.id)}
                    disabled={ordem.status === "CONCLUIDA"}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-900/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FaTrashAlt />
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950/50 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Serviços</th>
                    <th className="px-4 py-3 font-semibold">Produtos</th>
                    <th className="px-4 py-3 font-semibold">Valor Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-700/60">
                  {ordens.map((ordem) => (
                    <tr
                      key={ordem.id}
                      className="text-slate-300 transition hover:bg-slate-900/60"
                    >
                      <td className="px-4 py-4 font-semibold text-slate-100">
                        #{ordem.id}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-100">
                          {ordem.cliente?.nome ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">{ordem.cliente?.telefone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {ordem.servicos?.map((s) => (
                            <span
                              key={s.id}
                              className="rounded-full bg-slate-800/80 px-2 py-1 text-xs text-slate-300"
                            >
                              {s.service?.nome}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {ordem.produtos?.map((p) => (
                            <span
                              key={p.id}
                              className="rounded-full bg-slate-800/80 px-2 py-1 text-xs text-slate-300"
                            >
                              {p.produto?.nome} x{p.quantidade}
                            </span>
                          ))}
                          {ordem.produtos?.length === 0 && (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-300">
                        {formatCurrency(ordem.valorTotal)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative inline-flex min-w-[170px] items-center">
                          <select
                            value={ordem.status}
                            disabled={updatingId === ordem.id || ordem.status === "CONCLUIDA"}
                            onChange={(e) => handleStatusChange(ordem.id, e.target.value)}
                            className={`h-9 w-full appearance-none rounded-lg border border-slate-700/70 bg-slate-950 px-3 pr-9 text-sm font-semibold shadow-inner shadow-slate-950/40 outline-none ring-1 ring-slate-200/5 transition hover:border-slate-600 focus:border-indigo-400 focus:ring-indigo-400/30 ${STATUS_STYLES[ordem.status]} disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                          <option className="bg-slate-950 text-slate-100" value="ABERTA">Aberta</option>
                          <option className="bg-slate-950 text-slate-100" value="EM_ANDAMENTO">Em andamento</option>
                          <option className="bg-slate-950 text-slate-100" value="CONCLUIDA">Concluída</option>
                          </select>
                          <span className="pointer-events-none absolute right-3 text-xs text-slate-400">
                            <FaChevronDown />
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setDeletingId(ordem.id)}
                          disabled={ordem.status === "CONCLUIDA"}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-900/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            ordem.status === "CONCLUIDA"
                              ? "OS concluída não pode ser excluída"
                              : "Excluir"
                          }
                        >
                          <FaTrashAlt />
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </section>

      {/* Confirmação de exclusão */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-950/95 p-6 shadow-2xl ring-1 ring-slate-200/10">
            <h3 className="text-lg font-black text-slate-100">Excluir ordem de serviço?</h3>
            <p className="mt-2 text-sm text-slate-400">
              Esta ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      <OrdemServicoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadOrdens}
      />
    </>
  );
}

export default OrdensServico;
