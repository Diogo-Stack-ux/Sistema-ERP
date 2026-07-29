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
  const [comprovanteOrdem, setComprovanteOrdem] = useState(null);

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

  async function handleStatusChange(ordem, status) {
    try {
      setUpdatingId(ordem.id);
      await updateOrdemStatus(ordem.id, status);
      await loadOrdens();

      if (status === "CONCLUIDA") {
        setComprovanteOrdem({
          ...ordem,
          status,
        });
      }
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

  function handleExportPdf() {
    window.print();
  }

  function handleExportWhatsapp() {
    if (!comprovanteOrdem) return;

    const servicos =
      comprovanteOrdem.servicos?.map((servico) => `- ${servico.service?.nome || "Serviço"}`) || [];

    const produtos =
      comprovanteOrdem.produtos?.map(
        (produto) => `- ${produto.produto?.nome || "Produto"} x${produto.quantidade}`
      ) || [];

    const mensagem = [
      `Comprovante - Ordem de Serviço #${comprovanteOrdem.id}`,
      "",
      `Cliente: ${comprovanteOrdem.cliente?.nome || "-"}`,
      `Telefone: ${comprovanteOrdem.cliente?.telefone || "Não informado"}`,
      `Status: ${STATUS_LABELS[comprovanteOrdem.status] || "Concluída"}`,
      `Valor total: ${formatCurrency(comprovanteOrdem.valorTotal)}`,
      "",
      "Serviços realizados:",
      servicos.length ? servicos.join("\n") : "- Nenhum serviço informado",
      "",
      "Produtos utilizados:",
      produtos.length ? produtos.join("\n") : "- Nenhum produto utilizado",
      comprovanteOrdem.observacoes ? `\nObservações: ${comprovanteOrdem.observacoes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener,noreferrer");
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
      <section className="mx-auto flex w-full max-w-6xl flex-col rounded-[1.25rem] glass-card p-4 ring-1 ring-slate-200/10 sm:p-5">
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
                  {ordem.status === "CONCLUIDA" ? (
                    <button
                      type="button"
                      onClick={() => setComprovanteOrdem(ordem)}
                      className={`inline-flex w-full items-center justify-center rounded-lg border border-emerald-500/40 px-3 py-2 text-sm font-semibold ${STATUS_STYLES[ordem.status]}`}
                    >
                      Ver comprovante
                    </button>
                  ) : (
                    <div className="relative inline-flex min-w-0 items-center">
                      <select
                        value={ordem.status}
                        disabled={updatingId === ordem.id}
                        onChange={(e) => handleStatusChange(ordem, e.target.value)}
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
                  )}
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

          <div className="hidden space-y-4 md:block">
            {ordens.map((ordem) => (
              <article
                key={ordem.id}
                className="rounded-3xl border border-slate-700/60 bg-slate-950/50 p-4 shadow-lg shadow-slate-950/20"
              >
                <div className="grid gap-3 xl:grid-cols-[0.45fr_1.05fr_1.1fr_1.1fr_0.85fr_0.9fr_auto] xl:items-stretch">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      OS
                    </span>
                    <p className="mt-2 text-xl font-semibold text-slate-100">
                      #{ordem.id}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Cliente
                    </span>
                    <p className="mt-2 text-lg font-semibold text-slate-100">
                      {ordem.cliente?.nome ?? "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {ordem.cliente?.telefone || "Sem telefone"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Serviços
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ordem.servicos?.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-semibold text-slate-300"
                        >
                          {s.service?.nome}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Produtos
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ordem.produtos?.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-semibold text-slate-300"
                        >
                          {p.produto?.nome} x{p.quantidade}
                        </span>
                      ))}
                      {ordem.produtos?.length === 0 && (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Valor total
                    </span>
                    <p className="mt-2 text-lg font-bold text-emerald-300">
                      {formatCurrency(ordem.valorTotal)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </span>
                    <div
                      className="relative mt-2 inline-flex w-full min-w-[170px] items-center"
                      onClick={() => {
                        if (ordem.status === "CONCLUIDA") {
                          setComprovanteOrdem(ordem);
                        }
                      }}
                    >
                      <select
                        value={ordem.status}
                        disabled={updatingId === ordem.id}
                        onChange={(e) => handleStatusChange(ordem, e.target.value)}
                        className={`h-11 w-full appearance-none rounded-xl border border-slate-700/70 bg-slate-950 px-3 pr-9 text-sm font-semibold shadow-inner shadow-slate-950/40 outline-none ring-1 ring-slate-200/5 transition hover:border-slate-600 focus:border-indigo-400 focus:ring-indigo-400/30 ${STATUS_STYLES[ordem.status]} disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <option className="bg-slate-950 text-slate-100" value="ABERTA">Aberta</option>
                        <option className="bg-slate-950 text-slate-100" value="EM_ANDAMENTO">Em andamento</option>
                        <option className="bg-slate-950 text-slate-100" value="CONCLUIDA">Conclui­da</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 text-xs text-slate-400">
                        <FaChevronDown />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end xl:justify-center">
                    <button
                      onClick={() => setDeletingId(ordem.id)}
                      disabled={ordem.status === "CONCLUIDA"}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-900/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                      title={
                        ordem.status === "CONCLUIDA"
                          ? "OS concluÃ­da nÃ£o pode ser excluÃ­da"
                          : "Excluir"
                      }
                    >
                      <FaTrashAlt />
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden">
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
                            onChange={(e) => handleStatusChange(ordem, e.target.value)}
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

      {comprovanteOrdem && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm sm:p-10">
          <div className="receipt-print my-auto w-full max-w-4xl rounded-3xl bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
                  Comprovante
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  Ordem de Serviço #{comprovanteOrdem.id}
                </h2>
                <p className="mt-1 text-base text-slate-600">
                  Serviço concluído em {new Date().toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700 ring-1 ring-emerald-200">
                <p className="text-sm font-bold uppercase tracking-[0.16em]">
                  Status
                </p>
                <p className="mt-1 text-xl font-black">
                  {STATUS_LABELS[comprovanteOrdem.status] || "Concluída"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Cliente
                </p>
                <p className="mt-2 text-xl font-bold">
                  {comprovanteOrdem.cliente?.nome || "-"}
                </p>
                <p className="mt-1 text-slate-600">
                  {comprovanteOrdem.cliente?.telefone || "Telefone não informado"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Valor total
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-700">
                  {formatCurrency(comprovanteOrdem.valorTotal)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                Serviços realizados
              </p>
              <div className="mt-3 space-y-2">
                {comprovanteOrdem.servicos?.length ? (
                  comprovanteOrdem.servicos.map((servico) => (
                    <div
                      key={servico.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                    >
                      <span className="font-semibold">
                        {servico.service?.nome || "Serviço"}
                      </span>
                      <span className="text-slate-600">
                        {formatCurrency(servico.valor || servico.service?.valor)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Nenhum serviço informado.</p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                Produtos utilizados
              </p>
              <div className="mt-3 space-y-2">
                {comprovanteOrdem.produtos?.length ? (
                  comprovanteOrdem.produtos.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                    >
                      <span className="font-semibold">
                        {produto.produto?.nome || "Produto"} x{produto.quantidade}
                      </span>
                      <span className="text-slate-600">
                        {formatCurrency(Number(produto.precoUnitario || produto.produto?.preco || 0) * Number(produto.quantidade || 1))}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Nenhum produto utilizado.</p>
                )}
              </div>
            </div>

            {comprovanteOrdem.observacoes && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Observações
                </p>
                <p className="mt-2 text-slate-700">{comprovanteOrdem.observacoes}</p>
              </div>
            )}

            <div className="receipt-actions mt-6 flex flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setComprovanteOrdem(null)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Sair
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-base font-bold text-white transition hover:opacity-90"
              >
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={handleExportWhatsapp}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white transition hover:bg-emerald-500"
              >
                Exportar pelo WhatsApp
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
