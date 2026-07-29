function EquipmentHeader({ equipamento }) {
  if (!equipamento) return null;

  return (
    <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 p-6 shadow-2xl">
      <div className="flex flex-col items-center text-center">

        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/15 text-5xl">
          💻
        </div>

        <h1 className="text-3xl font-black text-white">
          {equipamento.nome}
        </h1>

        <p className="mt-2 text-white/80">
          {equipamento.marca || "-"} • {equipamento.modelo || "-"}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">

          <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white">
            {equipamento.tipo || "Equipamento"}
          </span>

          <span
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              equipamento.ativo
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {equipamento.ativo ? "Ativo" : "Inativo"}
          </span>

        </div>

        <div className="mt-6 rounded-2xl bg-white/10 px-6 py-4">

          <p className="text-xs uppercase tracking-widest text-white/70">
            Cliente
          </p>

          <p className="mt-1 text-xl font-bold text-white">
            {equipamento.cliente?.nome}
          </p>

        </div>

      </div>
    </div>
  );
}

export default EquipmentHeader;