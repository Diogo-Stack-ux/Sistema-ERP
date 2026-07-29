function EquipmentStats({ equipamento }) {
  if (!equipamento) return null;

  const ordensServico = equipamento.ordensServico || [];

  const totalOrdens = ordensServico.length;

  const valorInvestido = ordensServico.reduce(
    (total, ordem) => total + Number(ordem.valorTotal || 0),
    0
  );

  const ultimaOrdem = ordensServico[0];

  const ultimoAtendimento = ultimaOrdem?.createdAt
    ? new Date(ultimaOrdem.createdAt).toLocaleDateString("pt-BR")
    : "Nenhum atendimento";

  const garantiaValida =
    equipamento.garantiaAte &&
    new Date(equipamento.garantiaAte) >= new Date();

  const garantiaTexto = equipamento.garantiaAte
    ? new Date(equipamento.garantiaAte).toLocaleDateString("pt-BR")
    : "Não informada";

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const stats = [
    {
      titulo: "Ordens de Serviço",
      valor: totalOrdens,
      detalhe: "Atendimentos registrados",
      icone: "🧾",
    },
    {
      titulo: "Valor investido",
      valor: formatCurrency(valorInvestido),
      detalhe: "Serviços e produtos",
      icone: "💰",
    },
    {
      titulo: "Último atendimento",
      valor: ultimoAtendimento,
      detalhe: ultimaOrdem ? `OS #${ultimaOrdem.id}` : "Sem histórico",
      icone: "📅",
    },
    {
      titulo: "Garantia",
      valor: garantiaTexto,
      detalhe: equipamento.garantiaAte
        ? garantiaValida
          ? "Garantia válida"
          : "Garantia vencida"
        : "Sem data cadastrada",
      icone: garantiaValida ? "✅" : "🛡️",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.titulo}
          className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-400">
                {stat.titulo}
              </p>

              <p className="mt-3 text-2xl font-black text-slate-100">
                {stat.valor}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {stat.detalhe}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-xl">
              {stat.icone}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EquipmentStats;