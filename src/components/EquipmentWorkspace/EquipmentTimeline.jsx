function EquipmentTimeline({ equipamento }) {
  if (!equipamento) return null;

  const ordensServico = equipamento.ordensServico || [];

  function getStatusClasses(status) {
    switch (status) {
      case "CONCLUIDA":
        return {
          ponto: "bg-emerald-500",
          badge: "bg-emerald-500/15 text-emerald-300",
          texto: "Concluída",
        };

      case "EM_ANDAMENTO":
        return {
          ponto: "bg-amber-500",
          badge: "bg-amber-500/15 text-amber-300",
          texto: "Em andamento",
        };

      case "CANCELADA":
        return {
          ponto: "bg-red-500",
          badge: "bg-red-500/15 text-red-300",
          texto: "Cancelada",
        };

      default:
        return {
          ponto: "bg-blue-500",
          badge: "bg-blue-500/15 text-blue-300",
          texto: "Aberta",
        };
    }
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (ordensServico.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Histórico
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-100">
            Timeline do equipamento
          </h2>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
          <p className="font-semibold text-slate-300">
            Nenhuma ordem de serviço vinculada
          </p>

          <p className="mt-2 text-sm text-slate-500">
            As futuras manutenções deste equipamento aparecerão aqui.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Histórico
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-100">
          Timeline do equipamento
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Acompanhe todos os atendimentos realizados neste equipamento.
        </p>
      </div>

      <div className="relative border-l border-slate-700 pl-6">
        {ordensServico.map((ordem) => {
          const status = getStatusClasses(ordem.status);

          return (
            <article key={ordem.id} className="relative mb-8 last:mb-0">
              <span
                className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full ${status.ponto} ring-4 ring-slate-900`}
              />

              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-100">
                        OS #{ordem.id}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${status.badge}`}
                      >
                        {status.texto}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {ordem.createdAt
                        ? new Date(ordem.createdAt).toLocaleDateString("pt-BR")
                        : "Data não informada"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-black text-emerald-300">
                    {formatCurrency(ordem.valorTotal)}
                  </div>
                </div>

                {ordem.observacoes && (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Observações
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {ordem.observacoes}
                    </p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <p className="mb-3 text-sm font-bold text-slate-300">
                      Serviços realizados
                    </p>

                    {ordem.servicos?.length > 0 ? (
                      <ul className="space-y-2">
                        {ordem.servicos.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-slate-400">
                              {item.service?.nome || "Serviço"}
                            </span>

                            {item.valor !== undefined && (
                              <span className="font-semibold text-slate-300">
                                {formatCurrency(item.valor)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Nenhum serviço registrado.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <p className="mb-3 text-sm font-bold text-slate-300">
                      Produtos utilizados
                    </p>

                    {ordem.produtos?.length > 0 ? (
                      <ul className="space-y-2">
                        {ordem.produtos.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-slate-400">
                              {item.produto?.nome || "Produto"}
                            </span>

                            <span className="font-semibold text-slate-300">
                              {item.quantidade} un.
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Nenhum produto registrado.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default EquipmentTimeline;