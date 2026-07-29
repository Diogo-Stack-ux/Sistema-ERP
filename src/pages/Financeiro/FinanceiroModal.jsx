import { useState } from "react";
import { createPortal } from "react-dom";
import { createLancamento } from "../../services/financeiroApi";

const CATEGORIAS_DESPESA = [
  "Aluguel", "Fornecedor", "Salário", "Energia", "Água",
  "Internet", "Marketing", "Equipamentos", "Outros",
];

const CATEGORIAS_RECEITA = [
  "Venda", "Serviço", "Ordem de Serviço", "Comissão", "Outros",
];

function FinanceiroModal({ isOpen, onClose, onSuccess, tipoInicial = "DESPESA" }) {
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: tipoInicial,
    categoria: "",
    status: "PENDENTE",
    vencimento: "",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "tipo" ? { categoria: "" } : {}),
    }));
  }

  function handleClose() {
    if (loading) return;
    setFormData({ descricao: "", valor: "", tipo: tipoInicial, categoria: "", status: "PENDENTE", vencimento: "" });
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await createLancamento({
        ...formData,
        valor: Number(formData.valor),
        vencimento: formData.vencimento || null,
      });
      await onSuccess();
      handleClose();
    } catch (error) {
      console.error("Erro ao criar lançamento:", error?.response?.data || error);
      alert(
        error?.response?.data?.error ||
        "Erro ao criar lançamento"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";
  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-300";
  const categorias = formData.tipo === "RECEITA" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm sm:p-10 lg:items-center">
      <div className="my-auto w-full max-w-lg rounded-2xl bg-slate-950/95 p-5 shadow-2xl ring-1 ring-slate-200/10 sm:max-h-[calc(100svh-80px)] sm:p-6 sm:overflow-y-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Financeiro
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
              Novo Lançamento
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            <label className="sm:col-span-2">
              <span className={labelClass}>Tipo</span>
              <div className="flex gap-2">
                {["DESPESA", "RECEITA"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, tipo: t, categoria: "" }))}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                      formData.tipo === t
                        ? t === "DESPESA"
                          ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/50"
                          : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                        : "border border-slate-700 bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {t === "DESPESA" ? "💸 Despesa" : "💰 Receita"}
                  </button>
                ))}
              </div>
            </label>

            <label className="sm:col-span-2">
              <span className={labelClass}>Descrição</span>
              <input
                type="text"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Ex: Pagamento fornecedor"
              />
            </label>

            <label>
              <span className={labelClass}>Valor (R$)</span>
              <input
                type="number"
                step="0.01"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="0,00"
              />
            </label>

            <label>
              <span className={labelClass}>Vencimento</span>
              <input
                type="date"
                name="vencimento"
                value={formData.vencimento}
                onChange={handleChange}
                className={inputClass}
              />
            </label>

            <label>
              <span className={labelClass}>Categoria</span>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Selecione</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClass}>Status</span>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="PENDENTE">Pendente</option>
                {formData.tipo === "DESPESA" && <option value="PAGO">Pago</option>}
                {formData.tipo === "RECEITA" && <option value="RECEBIDO">Recebido</option>}
                <option value="CANCELADO">Cancelado</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default FinanceiroModal;
