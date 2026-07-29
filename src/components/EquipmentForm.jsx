const tiposEquipamento = [
  "Veículo",
  "Notebook",
  "Computador",
  "Impressora",
  "Ar-condicionado",
  "Máquina",
  "Motor",
  "Servidor",
  "Sistema solar",
  "Outro",
];

function EquipmentForm({
  formData,
  onChange,
  onSubmit,
  loading = false,
  error = "",
  submitLabel = "Salvar equipamento",
  onCancel,
  showCliente = false,
  clientes = [],
}) {
  const inputClass =
    "h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";

  const labelClass =
    "mb-2 block text-base font-semibold text-slate-300";

  return (
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {showCliente && (
          <label className="md:col-span-2">
            <span className={labelClass}>Cliente *</span>

            <select
              name="clienteId"
              value={formData.clienteId || ""}
              onChange={onChange}
              className={inputClass}
              required
            >
              <option value="">Selecione um cliente</option>

              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="md:col-span-2">
          <span className={labelClass}>Nome do equipamento *</span>

          <input
            type="text"
            name="nome"
            value={formData.nome || ""}
            onChange={onChange}
            placeholder="Ex.: Notebook Dell Inspiron"
            className={inputClass}
            required
          />
        </label>

        <label>
          <span className={labelClass}>Tipo</span>

          <select
            name="tipo"
            value={formData.tipo || ""}
            onChange={onChange}
            className={inputClass}
          >
            <option value="">Selecione</option>

            {tiposEquipamento.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Identificação</span>

          <input
            type="text"
            name="identificacao"
            value={formData.identificacao || ""}
            onChange={onChange}
            placeholder="Placa, patrimônio ou código"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Marca</span>

          <input
            type="text"
            name="marca"
            value={formData.marca || ""}
            onChange={onChange}
            placeholder="Ex.: Dell"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Modelo</span>

          <input
            type="text"
            name="modelo"
            value={formData.modelo || ""}
            onChange={onChange}
            placeholder="Ex.: Inspiron 15"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Número de série</span>

          <input
            type="text"
            name="numeroSerie"
            value={formData.numeroSerie || ""}
            onChange={onChange}
            placeholder="Número de série do equipamento"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Data da compra</span>

          <input
            type="date"
            name="dataCompra"
            value={formData.dataCompra || ""}
            onChange={onChange}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Garantia até</span>

          <input
            type="date"
            name="garantiaAte"
            value={formData.garantiaAte || ""}
            onChange={onChange}
            className={inputClass}
          />
        </label>

        <label className="md:col-span-2">
          <span className={labelClass}>Observações</span>

          <textarea
            name="observacoes"
            value={formData.observacoes || ""}
            onChange={onChange}
            placeholder="Informações adicionais sobre o equipamento"
            className="min-h-28 w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3 md:col-span-2">
          <input
            type="checkbox"
            name="ativo"
            checked={formData.ativo ?? true}
            onChange={onChange}
            className="h-4 w-4 accent-violet-500"
          />

          <span className="text-base font-semibold text-slate-300">
            Equipamento ativo
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-base text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-5 py-3 text-base font-bold text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-6 py-3 text-base font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default EquipmentForm;
