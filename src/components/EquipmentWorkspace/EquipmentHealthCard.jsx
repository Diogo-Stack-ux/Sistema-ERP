function EquipmentHealthCard({ equipamento }) {
  if (!equipamento) return null;

  const ordens = equipamento.ordensServico || [];

  const agora = new Date();

  const ordensOrdenadas = [...ordens].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const ultimaOrdem = ordensOrdenadas[0];

  const diasDesdeUltimoAtendimento = ultimaOrdem?.createdAt
    ? Math.floor(
        (agora - new Date(ultimaOrdem.createdAt)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  let proximaRevisao = null;

  if (
    ultimaOrdem?.createdAt &&
    equipamento.frequenciaRevisao &&
    equipamento.tipoFrequenciaRevisao
  ) {
    proximaRevisao = new Date(ultimaOrdem.createdAt);

    const frequencia = Number(equipamento.frequenciaRevisao);

    switch (equipamento.tipoFrequenciaRevisao) {
      case "DIAS":
        proximaRevisao.setDate(
          proximaRevisao.getDate() + frequencia
        );
        break;

      case "SEMANAS":
        proximaRevisao.setDate(
          proximaRevisao.getDate() + frequencia * 7
        );
        break;

      case "MESES":
        proximaRevisao.setMonth(
          proximaRevisao.getMonth() + frequencia
        );
        break;

      case "ANOS":
        proximaRevisao.setFullYear(
          proximaRevisao.getFullYear() + frequencia
        );
        break;

      default:
        proximaRevisao = null;
    }
  }

  const diasParaRevisao = proximaRevisao
  ? Math.ceil(
      (proximaRevisao - agora) /
        (1000 * 60 * 60 * 24)
    )
  : null;

  const garantiaValida =
    equipamento.garantiaAte &&
    new Date(equipamento.garantiaAte) >= agora;

  const ordensPendentes = ordens.filter(
    (ordem) =>
      ordem.status === "ABERTA" ||
      ordem.status === "EM_ANDAMENTO"
  ).length;

  const valorInvestido = ordens.reduce(
    (total, ordem) => total + Number(ordem.valorTotal || 0),
    0
  );

  // Índice heurístico de manutenção
  let indice = 0;

  // Equipamento ativo
  if (equipamento.ativo) {
    indice += 20;
  }

  // Garantia válida
  if (garantiaValida) {
    indice += 20;
  }

  // Atendimento recente
  if (
    diasDesdeUltimoAtendimento !== null &&
    diasDesdeUltimoAtendimento <= 180
  ) {
    indice += 20;
  } else if (
    diasDesdeUltimoAtendimento !== null &&
    diasDesdeUltimoAtendimento <= 365
  ) {
    indice += 10;
  }

  // Nenhuma OS pendente
  if (ordensPendentes === 0) {
    indice += 20;
  } else if (ordensPendentes === 1) {
    indice += 10;
  }

  // Quantidade de intervenções
  if (ordens.length <= 5) {
    indice += 20;
  } else if (ordens.length <= 10) {
    indice += 10;
  }

  let classificacao = "Crítico";
  let classeIndice = "text-red-300";
  let classeBarra = "bg-red-500";

  if (indice >= 80) {
    classificacao = "Bom";
    classeIndice = "text-emerald-300";
    classeBarra = "bg-emerald-500";
  } else if (indice >= 60) {
    classificacao = "Regular";
    classeIndice = "text-yellow-300";
    classeBarra = "bg-yellow-500";
  } else if (indice >= 40) {
    classificacao = "Atenção";
    classeIndice = "text-orange-300";
    classeBarra = "bg-orange-500";
  }

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("pt-BR") : "-";

  const alertas = [];

  if (!equipamento.ativo) {
    alertas.push("Equipamento marcado como inativo.");
  }

  if (
    equipamento.garantiaAte &&
    !garantiaValida
  ) {
    alertas.push("Garantia cadastrada está vencida.");
  }

  if (
    diasDesdeUltimoAtendimento !== null &&
    diasDesdeUltimoAtendimento > 180
  ) {
    alertas.push(
      `Último atendimento ocorreu há ${diasDesdeUltimoAtendimento} dias.`
    );
  }

  if (ordensPendentes > 0) {
    alertas.push(
      `${ordensPendentes} ordem(ns) de serviço ainda pendente(s).`
    );
  }

  if (proximaRevisao && proximaRevisao < agora) {
    alertas.push("Revisao preventiva vencida.");
  }

  if (ordens.length > 10) {
    alertas.push(
      "Equipamento possui um histórico elevado de intervenções."
    );
  }

  return (
    <section className="rounded-3xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Manutenção
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-100">
            Índice de Manutenção
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Indicador interno calculado pelo histórico de atendimentos,
            garantia, status e ordens pendentes.
          </p>

          <div className="mt-6">
            <div className="mb-2 flex items-end justify-between gap-4">
              <div>
                <span
                  className={`text-4xl font-black ${classeIndice}`}
                >
                  {indice}%
                </span>

                <p className="mt-1 text-sm font-bold text-slate-300">
                  {classificacao}
                </p>
              </div>

              <span className="text-sm text-slate-400">
                0 — 100
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${classeBarra}`}
                style={{
                  width: `${indice}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[390px]">
          <div className="rounded-2xl bg-slate-950/70 p-4">
            <p className="text-xs text-slate-500">
              Último atendimento
            </p>

            <p className="mt-2 font-black text-slate-100">
              {diasDesdeUltimoAtendimento !== null
                ? `${diasDesdeUltimoAtendimento} dias atrás`
                : "Sem histórico"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/70 p-4">
            <p className="text-xs text-slate-500">
              OS pendentes
            </p>

            <p className="mt-2 font-black text-slate-100">
              {ordensPendentes}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/70 p-4">
            <p className="text-xs text-slate-500">
              Intervenções
            </p>

            <p className="mt-2 font-black text-slate-100">
              {ordens.length}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/70 p-4">
            <p className="text-xs text-slate-500">
              Investimento acumulado
            </p>

            <p className="mt-2 font-black text-emerald-300">
              {formatCurrency(valorInvestido)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/70 p-4">
            <p className="text-xs text-slate-500">
              Próxima revisão
            </p>

            <p className="mt-2 font-black text-slate-100">
              {proximaRevisao
                ? proximaRevisao.toLocaleDateString("pt-BR")
                : "Não programada"}
            </p>

            {diasParaRevisao !== null && (
              <p
                className={`mt-1 text-xs font-semibold ${
                  diasParaRevisao < 0
                    ? "text-red-400"
                    : diasParaRevisao <= 30
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {diasParaRevisao < 0
                  ? `Atrasada há ${Math.abs(diasParaRevisao)} dias`
                  : diasParaRevisao === 0
                  ? "Revisão prevista para hoje"
                  : `Faltam ${diasParaRevisao} dias`}
              </p>
            )}
          </div>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="font-bold text-amber-300">
            Pontos de atenção
          </p>

          <ul className="mt-3 space-y-2">
            {alertas.map((alerta) => (
              <li
                key={alerta}
                className="text-sm text-slate-300"
              >
                • {alerta}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default EquipmentHealthCard;
