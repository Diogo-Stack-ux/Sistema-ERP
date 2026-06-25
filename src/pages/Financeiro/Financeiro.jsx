import { useCallback, useEffect, useState } from "react";
import {
  getLancamentos,
  getTotais,
  updateLancamentoStatus,
  deleteLancamento,
} from "../../services/financeiroApi";
import FinanceiroModal from "./FinanceiroModal";

const STATUS_STYLES = {
  PENDENTE: "bg-amber-500/15 text-amber-300",
  PAGO: "bg-emerald-500/15 text-emerald-300",
  RECEBIDO: "bg-emerald-500/15 text-emerald-300",
  CANCELADO: "bg-slate-700/70 text-slate-400",
};

const STATUS_LABELS = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  RECEBIDO: "Recebido",
  CANCELADO: "Cancelado",
};

const ABAS = ["contas-pagar", "contas-receber", "fluxo-caixa"];

function Financeiro() {
  const [aba, setAba] = useState("contas-pagar");
  const [lancamentos, setLancamentos] = useState([]);
  const [totais, setTotais] = useState({ totalReceitas: 0, totalDespesas: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadDados = useCallback(async () => {
    try {
      setLoading(true);
      const tipo = aba === "contas-pagar" ? "DESPESA" : aba === "contas-receber" ? "RECEITA" : undefined;
      const [data, totaisData] = await Promise.all([
        getLancamentos(tipo ? { tipo } : {}),
        getTotais(),
      ]);
      setLancamentos(data);
      setTotais(totaisData);
    } catch (error) {
      console.error("Erro ao carregar financeiro:", error);
    } finally {
      setLoading(false);
    }
  }, [aba]);

  useEffect(() => {
    loadDados();
  }, [loadDados]);

  async function handleStatusChange(id, status) {
    try {
      await updateLancamentoStatus(id, status);
      await loadDados();
    } catch {
      alert("Erro ao atualizar status");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteLancamento(id);
      await loadDados();
    } catch {
      alert("Erro ao excluir lançamento");
    } finally {
      setDeletingId(null);
    }
  }

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("pt-BR") : "—";

  const fluxoPorMes = lancamentos.reduce((acc, l) => {
    if (l.status === "CANCELADO") return acc;
    const mes = new Date(l.data).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    if (!acc[mes]) acc[mes] = { receitas: 0, despesas: 0 };
    if (l.tipo === "RECEITA" && l.status === "RECEBIDO") acc[mes].receitas += Number(l.valor);
    if (l.tipo === "DESPESA" && l.status === "PAGO") acc[mes].despesas += Number(l.valor);
    return acc;
  }, {});

  const tipoInicial = aba === "contas-receber" ? "RECEITA" : "DESPESA";

  return (
    <>
      <section className="mx-auto w-full max-w-6xl rounded-[1.25rem] glass-card p-4 ring-1 ring-slate-200/10 sm:p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Gestão
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
              Financeiro
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Controle receitas, despesas e fluxo de caixa.
            </p>
          </div>

          {aba !== "fluxo-caixa" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
            >
              + Novo Lançamento
            </button>
          )}
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-700/40 bg-emerald-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">Receitas pagas</p>
            <p className="mt-1 text-2xl font-black text-emerald-300">
              {formatCurrency(totais.totalReceitas)}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-700/40 bg-rose-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-rose-400">Despesas pagas</p>
            <p className="mt-1 text-2xl font-black text-rose-300">
              {formatCurrency(totais.totalDespesas)}
            </p>
          </div>
          <div className={`rounded-2xl border p-4 ${totais.saldo >= 0 ? "border-emerald-700/40 bg-emerald-500/10" : "border-rose-700/40 bg-rose-500/10"}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Saldo</p>
            <p className={`mt-1 text-2xl font-black ${totais.saldo >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {formatCurrency(totais.saldo)}
            </p>
          </div>
        </div>

        <div className="mb-5 -mx-4 flex gap-2 overflow-x-auto border-b border-slate-700/60 px-4 pb-1 sm:mx-0 sm:px-0">
          {[
            { key: "contas-pagar", label: "💸 Contas a Pagar" },
            { key: "contas-receber", label: "💰 Contas a Receber" },
            { key: "fluxo-caixa", label: "📊 Fluxo de Caixa" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setAba(key)}
              className={`shrink-0 rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
                aba === key
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-700/60 bg-slate-950/50 p-6 text-sm text-slate-400">
            Carregando...
          </div>
        ) : aba === "fluxo-caixa" ? (
          <div className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950/50">
            {Object.keys(fluxoPorMes).length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                Nenhum lançamento pago/recebido ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Mês</th>
                    <th className="px-4 py-3 font-semibold">Receitas</th>
                    <th className="px-4 py-3 font-semibold">Despesas</th>
                    <th className="px-4 py-3 font-semibold">Saldo do mês</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {Object.entries(fluxoPorMes).map(([mes, vals]) => {
                    const saldoMes = vals.receitas - vals.despesas;
                    return (
                      <tr key={mes} className="text-slate-300 transition hover:bg-slate-900/60">
                        <td className="px-4 py-4 font-semibold capitalize text-slate-100">{mes}</td>
                        <td className="px-4 py-4 text-emerald-300">{formatCurrency(vals.receitas)}</td>
                        <td className="px-4 py-4 text-rose-300">{formatCurrency(vals.despesas)}</td>
                        <td className={`px-4 py-4 font-bold ${saldoMes >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          {formatCurrency(saldoMes)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950/50">
            {lancamentos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-slate-100">Nenhum lançamento</p>
                <p className="mt-2 text-sm text-slate-400">
                  Clique em "+ Novo Lançamento" para começar.
                </p>
              </div>
            ) : (
              <>
              <div className="space-y-3 md:hidden">
                {lancamentos.map((l) => {
                  const vencido =
                    l.status === "PENDENTE" &&
                    l.vencimento &&
                    new Date(l.vencimento) < new Date();

                  return (
                    <article
                      key={l.id}
                      className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-100">{l.descricao}</p>
                          <p className="mt-1 text-xs text-slate-500">{l.categoria || "-"}</p>
                          {vencido && <span className="text-xs text-rose-400">Vencido</span>}
                        </div>
                        <p className={`shrink-0 font-semibold ${l.tipo === "RECEITA" ? "text-emerald-300" : "text-rose-300"}`}>
                          {formatCurrency(l.valor)}
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-900/80 p-2">
                          <span className="block text-slate-500">Vencimento</span>
                          <strong className="text-slate-200">{formatDate(l.vencimento)}</strong>
                        </div>
                        <select
                          value={l.status}
                          onChange={(e) => handleStatusChange(l.id, e.target.value)}
                          className={`rounded-xl border-none px-2.5 py-2 text-xs font-semibold outline-none ${STATUS_STYLES[l.status]}`}
                        >
                          <option value="PENDENTE">Pendente</option>
                          {l.tipo === "DESPESA" && <option value="PAGO">Pago</option>}
                          {l.tipo === "RECEITA" && <option value="RECEBIDO">Recebido</option>}
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                      </div>
                      <button
                        onClick={() => setDeletingId(l.id)}
                        className="mt-4 w-full rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-900/50 hover:text-red-300"
                      >
                        Excluir
                      </button>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.18em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Descrição</th>
                      <th className="px-4 py-3 font-semibold">Categoria</th>
                      <th className="px-4 py-3 font-semibold">Valor</th>
                      <th className="px-4 py-3 font-semibold">Vencimento</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {lancamentos.map((l) => {
                      const vencido =
                        l.status === "PENDENTE" &&
                        l.vencimento &&
                        new Date(l.vencimento) < new Date();

                      return (
                        <tr key={l.id} className="text-slate-300 transition hover:bg-slate-900/60">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-100">{l.descricao}</p>
                            {vencido && (
                              <span className="text-xs text-rose-400">⚠ Vencido</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-slate-400">{l.categoria || "—"}</td>
                          <td className={`px-4 py-4 font-semibold ${l.tipo === "RECEITA" ? "text-emerald-300" : "text-rose-300"}`}>
                            {formatCurrency(l.valor)}
                          </td>
                          <td className="px-4 py-4">{formatDate(l.vencimento)}</td>
                          <td className="px-4 py-4">
                            <select
                              value={l.status}
                              onChange={(e) => handleStatusChange(l.id, e.target.value)}
                              className={`rounded-full border-none px-2.5 py-1 text-xs font-semibold outline-none ${STATUS_STYLES[l.status]}`}
                            >
                              <option value="PENDENTE">Pendente</option>
                              {l.tipo === "DESPESA" && <option value="PAGO">Pago</option>}
                              {l.tipo === "RECEITA" && <option value="RECEBIDO">Recebido</option>}
                              <option value="CANCELADO">Cancelado</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setDeletingId(l.id)}
                              className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-900/50 hover:text-red-300"
                            >
                              🗑️ Excluir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        )}
      </section>

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-950/95 p-6 shadow-2xl ring-1 ring-slate-200/10">
            <h3 className="text-lg font-black text-slate-100">Excluir lançamento?</h3>
            <p className="mt-2 text-sm text-slate-400">Esta ação não pode ser desfeita.</p>
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
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <FinanceiroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDados}
        tipoInicial={tipoInicial}
      />
    </>
  );
}

export default Financeiro;
